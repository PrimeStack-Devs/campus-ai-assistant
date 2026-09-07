import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { CampusSetting } from "../models/campusModels.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.resolve(__dirname, "../data/db");
const settingsFile = path.join(dbDir, "settings.json");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const DEFAULT_AUTH_SETTINGS = {
  googleAuthEnabled: true,
  domainRestrictionEnabled: false, // default: all domains allowed
  allowedDomains: ["paruluniversity.ac.in"],
  allowPersonalGmail: true,
  registrationNote: "Sign in with any Google account or your Parul University student ID.",
};

export async function getAuthSettings() {
  let settings = null;

  // Try Mongo first if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await CampusSetting.findOne({ key: "auth_settings" }).lean();
      if (doc && doc.value) {
        settings = doc.value;
      }
    } catch {}
  }

  // Fallback to local settings.json
  if (!settings && fs.existsSync(settingsFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
      if (parsed.auth) {
        settings = parsed.auth;
      }
    } catch {}
  }

  // Fallback to default
  const result = {
    ...DEFAULT_AUTH_SETTINGS,
    ...(settings || {}),
  };

  // Ensure file exists with defaults if not present
  if (!fs.existsSync(settingsFile)) {
    try {
      fs.writeFileSync(
        settingsFile,
        JSON.stringify({ auth: result }, null, 2),
        "utf-8"
      );
    } catch {}
  }

  return result;
}

export async function updateAuthSettings(newSettings) {
  const current = await getAuthSettings();
  const updated = {
    ...current,
    ...newSettings,
  };

  // Clean allowed domains array
  if (Array.isArray(updated.allowedDomains)) {
    updated.allowedDomains = updated.allowedDomains
      .map((d) => String(d).trim().toLowerCase())
      .filter(Boolean);
  } else if (typeof updated.allowedDomains === "string") {
    updated.allowedDomains = updated.allowedDomains
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
  }

  // 1. Write to local disk
  try {
    let existingFull = {};
    if (fs.existsSync(settingsFile)) {
      try {
        existingFull = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
      } catch {}
    }
    existingFull.auth = updated;
    fs.writeFileSync(settingsFile, JSON.stringify(existingFull, null, 2), "utf-8");
  } catch (err) {
    console.error("[Settings] Failed to write settings.json:", err);
  }

  // 2. Sync to MongoDB Atlas
  if (mongoose.connection.readyState === 1) {
    try {
      await CampusSetting.findOneAndUpdate(
        { key: "auth_settings" },
        { key: "auth_settings", value: updated },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.warn("[Settings] MongoDB settings sync warning:", err.message);
    }
  }

  return updated;
}

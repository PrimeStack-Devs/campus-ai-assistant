import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { CampusUser } from "../models/campusModels.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.resolve(__dirname, "../data/db");
const usersFile = path.join(dbDir, "users.json");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

/**
 * Reads users from local JSON file
 */
export function readLocalUsers() {
  if (!fs.existsSync(usersFile)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(usersFile, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[UserService] Failed to read users.json:", err.message);
    return [];
  }
}

/**
 * Writes users to local JSON file
 */
export function writeLocalUsers(users) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[UserService] Failed to write users.json:", err.message);
    return false;
  }
}

/**
 * Bi-directionally synchronize user data between local users.json and MongoDB Atlas.
 * Guarantees no user record is lost across system reboots or offline periods.
 */
export async function syncUsersBetweenLocalAndMongo() {
  const localUsers = readLocalUsers();
  const userMap = new Map();

  // 1. Load local users
  for (const u of localUsers) {
    if (u.email) {
      userMap.set(u.email.toLowerCase().trim(), { ...u });
    }
  }

  // 2. Load Mongo users if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const mongoUsers = await CampusUser.find().lean();
      for (const mu of mongoUsers) {
        if (!mu.email) continue;
        const cleanEmail = mu.email.toLowerCase().trim();
        const existing = userMap.get(cleanEmail);

        if (!existing) {
          // In Mongo but not local
          userMap.set(cleanEmail, {
            googleId: mu.googleId || `gid_${Date.now()}`,
            name: mu.name || cleanEmail.split("@")[0],
            email: cleanEmail,
            avatar: mu.avatar || "",
            domain: mu.domain || cleanEmail.split("@")[1] || "",
            role: mu.role || "student",
            lastLogin: mu.lastLogin || mu.updatedAt || new Date().toISOString(),
          });
        } else {
          // Compare dates and pick latest
          const localTime = new Date(existing.lastLogin || 0).getTime();
          const mongoTime = new Date(mu.lastLogin || mu.updatedAt || 0).getTime();

          if (mongoTime > localTime) {
            userMap.set(cleanEmail, {
              ...existing,
              name: mu.name || existing.name,
              avatar: mu.avatar || existing.avatar,
              role: mu.role || existing.role,
              lastLogin: mu.lastLogin || existing.lastLogin,
            });
          }
        }
      }

      // 3. Upsert any local-only users into MongoDB
      const mergedList = Array.from(userMap.values());
      for (const u of mergedList) {
        await CampusUser.findOneAndUpdate(
          { email: u.email },
          {
            $set: {
              googleId: u.googleId,
              name: u.name,
              avatar: u.avatar || "",
              domain: u.domain || u.email.split("@")[1] || "",
              role: u.role || "student",
              lastLogin: u.lastLogin || new Date(),
            },
          },
          { upsert: true, new: true }
        );
      }

      // 4. Update local JSON with unified records
      writeLocalUsers(mergedList);
      console.log(`[UserService] Synchronized ${mergedList.length} user records with MongoDB Atlas.`);
      return mergedList;
    } catch (err) {
      console.warn("[UserService] MongoDB user sync warning:", err.message);
    }
  }

  // Fallback to local
  return Array.from(userMap.values());
}

/**
 * Get all users with optional filtering
 */
export async function getAllUsers(search = "", role = "") {
  let users = [];

  // Try Mongo first if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const query = {};
      if (role && role !== "all") {
        query.role = role;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { domain: { $regex: search, $options: "i" } },
        ];
      }
      users = await CampusUser.find(query).sort({ lastLogin: -1 }).lean();
    } catch (err) {
      console.warn("[UserService] Mongo query failed, falling back to local:", err.message);
    }
  }

  // Fallback to local users.json
  if (!users.length) {
    users = readLocalUsers();
    if (search) {
      const s = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s) ||
          u.domain?.toLowerCase().includes(s)
      );
    }
    if (role && role !== "all") {
      users = users.filter((u) => u.role === role);
    }
    users.sort((a, b) => new Date(b.lastLogin || 0).getTime() - new Date(a.lastLogin || 0).getTime());
  }

  return users;
}

/**
 * Upsert a user record (called during Google Auth or user registration)
 */
export async function upsertUser(userPayload) {
  if (!userPayload.email) {
    throw new Error("Email is required for user persistence.");
  }

  const cleanEmail = userPayload.email.toLowerCase().trim();
  const domain = userPayload.domain || cleanEmail.split("@")[1] || "";
  const role = userPayload.role || (domain.includes("parul") ? "student" : "user");

  const record = {
    googleId: userPayload.googleId || `gid_${Date.now()}`,
    name: userPayload.name || cleanEmail.split("@")[0],
    email: cleanEmail,
    avatar: userPayload.avatar || "",
    domain,
    role,
    lastLogin: userPayload.lastLogin || new Date().toISOString(),
  };

  // 1. Save to local users.json
  const users = readLocalUsers();
  const idx = users.findIndex((u) => u.email === cleanEmail);
  if (idx > -1) {
    users[idx] = { ...users[idx], ...record };
  } else {
    users.push(record);
  }
  writeLocalUsers(users);

  // 2. Save to MongoDB Atlas if connected
  if (mongoose.connection.readyState === 1) {
    try {
      await CampusUser.findOneAndUpdate(
        { email: cleanEmail },
        { $set: record },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.warn("[UserService] Mongo user upsert warning:", err.message);
    }
  }

  return record;
}

/**
 * Update user role (e.g. promote to admin/faculty)
 */
export async function updateUserRole(email, newRole) {
  const cleanEmail = email.toLowerCase().trim();
  const validRoles = ["student", "faculty", "admin", "user"];

  if (!validRoles.includes(newRole)) {
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  // 1. Update local users.json
  const users = readLocalUsers();
  const idx = users.findIndex((u) => u.email === cleanEmail);
  if (idx > -1) {
    users[idx].role = newRole;
    writeLocalUsers(users);
  }

  // 2. Update MongoDB Atlas
  if (mongoose.connection.readyState === 1) {
    try {
      await CampusUser.findOneAndUpdate(
        { email: cleanEmail },
        { $set: { role: newRole } },
        { new: true }
      );
    } catch (err) {
      console.warn("[UserService] Mongo role update warning:", err.message);
    }
  }

  return { success: true, email: cleanEmail, role: newRole };
}

/**
 * Delete a user from the system
 */
export async function deleteUser(email) {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Delete from local users.json
  const users = readLocalUsers();
  const filtered = users.filter((u) => u.email !== cleanEmail);
  writeLocalUsers(filtered);

  // 2. Delete from MongoDB Atlas
  if (mongoose.connection.readyState === 1) {
    try {
      await CampusUser.deleteOne({ email: cleanEmail });
    } catch (err) {
      console.warn("[UserService] Mongo user delete warning:", err.message);
    }
  }

  return { success: true, email: cleanEmail };
}

/**
 * Get analytics & metrics on registered users
 */
export async function getUserAnalytics() {
  const users = await getAllUsers();
  const totalUsers = users.length;

  const roles = {
    student: 0,
    faculty: 0,
    admin: 0,
    user: 0,
  };

  const domains = {};
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  let activeToday = 0;

  for (const u of users) {
    // Role counts
    const r = u.role || "user";
    roles[r] = (roles[r] || 0) + 1;

    // Domain counts
    const d = u.domain || (u.email ? u.email.split("@")[1] : "other");
    domains[d] = (domains[d] || 0) + 1;

    // Active in last 24h
    if (u.lastLogin && new Date(u.lastLogin).getTime() > oneDayAgo) {
      activeToday++;
    }
  }

  return {
    totalUsers,
    activeToday,
    roles,
    domains,
  };
}

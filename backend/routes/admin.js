import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  getCampusStats,
  processExcelUpload,
  processPdfUpload,
  resetBrainData,
  saveLocationItem,
  deleteLocationItem,
  saveFacilityItem,
  deleteFacilityItem,
  saveFacultyItem,
  deleteFacultyItem,
  saveEventItem,
  deleteEventItem,
} from "../services/adminService.js";
import {
  getAuthSettings,
  updateAuthSettings,
} from "../services/settingsService.js";
import { generateCampusDataTemplate } from "../utils/generateTemplate.js";

import os from "os";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadDir = path.join(os.tmpdir(), "campus_ai_uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// JWT Helper Functions
const getJwtSecret = () =>
  process.env.ADMIN_JWT_SECRET || "dexa_campus_ai_jwt_secret_admin_2026_secure";

const base64UrlEncode = (str) => {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const base64UrlDecode = (str) => {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64").toString("utf8");
};

export const createAdminToken = (
  payload,
  expiresInMs = 7 * 24 * 60 * 60 * 1000
) => {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Date.now() + expiresInMs;
  const fullPayload = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac("sha256", getJwtSecret())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifyAdminToken = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", getJwtSecret())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Token expired
    }
    return payload;
  } catch {
    return null;
  }
};

// Admin Auth Middleware
const requireAdmin = (req, res, next) => {
  // 1. Check Bearer token in Authorization header
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const verified = verifyAdminToken(token);
    if (verified) {
      req.admin = verified;
      return next();
    }
  }

  // 2. Check X-Admin-Key header or query param (backward compatibility)
  const adminKey = process.env.ADMIN_KEY;
  const providedKey = req.headers["x-admin-key"] || req.query.adminKey;
  if (adminKey && providedKey === adminKey) {
    req.admin = {
      email: process.env.ADMIN_EMAIL || "admin@dexa.ai",
      name: "Campus Administrator",
      role: "admin",
    };
    return next();
  }

  return res.status(401).json({
    success: false,
    error: "Unauthorized: Invalid or missing administrator credentials.",
  });
};

// 0. Admin Login Endpoint
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    const expectedEmail = (process.env.ADMIN_EMAIL || "admin@dexa.ai")
      .trim()
      .toLowerCase();
    const expectedPassword = process.env.ADMIN_PASSWORD || "admin@dexa2026";

    const cleanInputEmail = email.trim().toLowerCase();

    if (cleanInputEmail !== expectedEmail || password !== expectedPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid admin email or password.",
      });
    }

    const token = createAdminToken({
      email: expectedEmail,
      name: "Campus Administrator",
      role: "admin",
    });

    console.log(`[Admin] Successful login: ${expectedEmail}`);

    return res.json({
      success: true,
      token,
      admin: {
        email: expectedEmail,
        name: "Campus Administrator",
        role: "admin",
      },
      message: "Admin authentication successful.",
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during admin login.",
    });
  }
});

// 0.1. Admin Verify Token Endpoint
router.get("/verify", requireAdmin, (req, res) => {
  return res.json({
    success: true,
    valid: true,
    admin: req.admin,
  });
});

// 1. Download Template Excel File
router.get("/template", (req, res) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../data/campus_data_template.xlsx"
    );

    if (!fs.existsSync(templatePath)) {
      generateCampusDataTemplate(templatePath);
    }

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="campus_data_template.xlsx"'
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    return res.sendFile(templatePath);
  } catch (error) {
    console.error("Template download error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Campus Data Stats
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const stats = await getCampusStats();
    return res.json({ success: true, stats });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Upload Excel Spreadsheet (.xlsx / .csv) — Single or Multiple Files
router.post(
  "/upload-excel",
  requireAdmin,
  upload.any(),
  async (req, res) => {
    try {
      const files = req.files || (req.file ? [req.file] : []);
      if (files.length === 0) {
        return res
          .status(400)
          .json({ success: false, error: "No Excel file provided." });
      }

      console.log(`[Admin] Processing ${files.length} Excel file(s)...`);
      const combinedSummary = {};
      let totalNewVectors = 0;
      const processedFiles = [];

      for (const file of files) {
        console.log(`[Admin] Processing Excel upload: ${file.originalname}`);
        const result = await processExcelUpload(file.path);
        processedFiles.push(file.originalname);
        totalNewVectors += result.totalNewVectors || 0;
        if (result.summary) {
          for (const [key, count] of Object.entries(result.summary)) {
            combinedSummary[key] = (combinedSummary[key] || 0) + count;
          }
        }
        try {
          fs.unlinkSync(file.path);
        } catch {}
      }

      return res.json({
        success: true,
        message: `Successfully processed and indexed ${files.length} Excel file(s).`,
        files: processedFiles,
        summary: combinedSummary,
        totalNewVectors,
      });
    } catch (error) {
      console.error("[Admin] Excel processing error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

// 3.1. Auto-Sync all .xlsx files currently in backend/campus-data folder
router.post("/sync-campus-data", requireAdmin, async (req, res) => {
  try {
    const campusDataDir = path.resolve(__dirname, "../campus-data");
    if (!fs.existsSync(campusDataDir)) {
      return res
        .status(404)
        .json({ success: false, error: "campus-data folder not found." });
    }

    const excelFiles = fs
      .readdirSync(campusDataDir)
      .filter((f) => f.endsWith(".xlsx") && !f.startsWith("~$"));

    if (excelFiles.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No .xlsx files found in campus-data folder." });
    }

    console.log(
      `[Admin] Starting batch sync of ${excelFiles.length} file(s) from campus-data...`
    );
    const combinedSummary = {};
    let totalNewVectors = 0;
    const processedFiles = [];

    for (const f of excelFiles) {
      const fullPath = path.join(campusDataDir, f);
      console.log(`[Admin] Ingesting: ${f}`);
      const result = await processExcelUpload(fullPath);
      processedFiles.push(f);
      totalNewVectors += result.totalNewVectors || 0;
      if (result.summary) {
        for (const [key, count] of Object.entries(result.summary)) {
          combinedSummary[key] = (combinedSummary[key] || 0) + count;
        }
      }
    }

    return res.json({
      success: true,
      message: `Successfully synced ${excelFiles.length} file(s) from campus-data!`,
      files: processedFiles,
      summary: combinedSummary,
      totalNewVectors,
    });
  } catch (error) {
    console.error("[Admin] Sync error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Upload PDF Circulars / Handbooks (.pdf)
router.post(
  "/upload-pdf",
  requireAdmin,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "No PDF file provided." });
      }

      const category = req.body.category || "Policy";
      console.log(
        `[Admin] Processing PDF upload: ${req.file.originalname} (${category})`
      );

      const result = await processPdfUpload(
        req.file.path,
        req.file.originalname,
        category
      );

      // Clean up temp file
      try {
        fs.unlinkSync(req.file.path);
      } catch {}

      return res.json(result);
    } catch (error) {
      console.error("[Admin] PDF processing error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

// 5. Reset Dexa Brain (Vectors, local JSON DB, cache, MongoDB Atlas)
router.post("/reset-brain", requireAdmin, async (req, res) => {
  try {
    const result = await resetBrainData();
    return res.json(result);
  } catch (error) {
    console.error("[Admin] Reset brain error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Admin Location CRUD
router.post("/locations", requireAdmin, async (req, res) => {
  try {
    const item = await saveLocationItem(req.body);
    return res.json({ success: true, item });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/locations/:id", requireAdmin, async (req, res) => {
  try {
    const result = await deleteLocationItem(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Admin Facility CRUD
router.post("/facilities", requireAdmin, async (req, res) => {
  try {
    const item = await saveFacilityItem(req.body);
    return res.json({ success: true, item });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/facilities/:id", requireAdmin, async (req, res) => {
  try {
    const result = await deleteFacilityItem(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Admin Faculty / Contact CRUD
router.post("/contacts", requireAdmin, async (req, res) => {
  try {
    const item = await saveFacultyItem(req.body);
    return res.json({ success: true, item });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/contacts/:id", requireAdmin, async (req, res) => {
  try {
    const result = await deleteFacultyItem(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Admin Event CRUD
router.post("/events", requireAdmin, async (req, res) => {
  try {
    const item = await saveEventItem(req.body);
    return res.json({ success: true, item });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/events/:id", requireAdmin, async (req, res) => {
  try {
    const result = await deleteEventItem(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Admin Settings Management (Google Auth & Domain Restriction)
router.get("/settings", requireAdmin, async (req, res) => {
  try {
    const settings = await getAuthSettings();
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/settings", requireAdmin, async (req, res) => {
  try {
    const updated = await updateAuthSettings(req.body);
    return res.json({
      success: true,
      message: "Authentication and domain settings saved successfully.",
      settings: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;




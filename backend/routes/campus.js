import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import {
  CampusBuilding,
  CampusDepartment,
  CampusFaculty,
  CampusFacility,
  CampusService,
  CampusSchedule,
  CampusPath,
  CampusUser,
} from "../models/campusModels.js";
import { getAuthSettings } from "../services/settingsService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.resolve(__dirname, "../data/db");

const router = express.Router();

function readJsonCollection(filename, defaultVal = []) {
  const file = path.join(dbDir, filename);
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch {
      return defaultVal;
    }
  }
  return defaultVal;
}

// 1. GET /api/campus/locations (Buildings)
router.get("/locations", async (req, res) => {
  try {
    const q = (req.query.q || "").toLowerCase().trim();
    let buildings = [];

    if (mongoose.connection.readyState === 1) {
      try {
        buildings = await CampusBuilding.find({}).lean();
      } catch {}
    }
    if (!buildings || buildings.length === 0) {
      buildings = readJsonCollection("buildings.json", []);
    }

    if (q) {
      buildings = buildings.filter(
        (b) =>
          (b.name && b.name.toLowerCase().includes(q)) ||
          (b.code && b.code.toLowerCase().includes(q)) ||
          (b.short_name && b.short_name.toLowerCase().includes(q)) ||
          (b.zone && b.zone.toLowerCase().includes(q)) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          (Array.isArray(b.aliases) &&
            b.aliases.some((a) => a.toLowerCase().includes(q)))
      );
    }

    return res.json({ success: true, count: buildings.length, data: buildings });
  } catch (error) {
    console.error("[Campus API] Error fetching locations:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Alias for buildings
router.get("/buildings", (req, res) => {
  res.redirect("/api/campus/locations");
});

// 2. GET /api/campus/facilities
router.get("/facilities", async (req, res) => {
  try {
    const q = (req.query.q || "").toLowerCase().trim();
    let facilities = [];

    if (mongoose.connection.readyState === 1) {
      try {
        facilities = await CampusFacility.find({}).lean();
      } catch {}
    }
    if (!facilities || facilities.length === 0) {
      facilities = readJsonCollection("facilities.json", []);
    }

    if (q) {
      facilities = facilities.filter(
        (f) =>
          (f.name && f.name.toLowerCase().includes(q)) ||
          (f.category && f.category.toLowerCase().includes(q)) ||
          (f.building_name && f.building_name.toLowerCase().includes(q)) ||
          (f.description && f.description.toLowerCase().includes(q)) ||
          (Array.isArray(f.amenities) &&
            f.amenities.some((a) => a.toLowerCase().includes(q)))
      );
    }

    return res.json({ success: true, count: facilities.length, data: facilities });
  } catch (error) {
    console.error("[Campus API] Error fetching facilities:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. GET /api/campus/departments
router.get("/departments", async (req, res) => {
  try {
    const q = (req.query.q || "").toLowerCase().trim();
    let departments = [];

    if (mongoose.connection.readyState === 1) {
      try {
        departments = await CampusDepartment.find({}).lean();
      } catch {}
    }
    if (!departments || departments.length === 0) {
      departments = readJsonCollection("departments.json", []);
    }

    if (q) {
      departments = departments.filter(
        (d) =>
          (d.name && d.name.toLowerCase().includes(q)) ||
          (d.building_name && d.building_name.toLowerCase().includes(q)) ||
          (d.parent_faculty && d.parent_faculty.toLowerCase().includes(q)) ||
          (d.hod?.name && d.hod.name.toLowerCase().includes(q)) ||
          (Array.isArray(d.programs) &&
            d.programs.some((p) => p.toLowerCase().includes(q)))
      );
    }

    return res.json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    console.error("[Campus API] Error fetching departments:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. GET /api/campus/faculty (Directory & Contacts)
router.get("/faculty", async (req, res) => {
  try {
    const q = (req.query.q || "").toLowerCase().trim();
    let faculty = [];

    if (mongoose.connection.readyState === 1) {
      try {
        faculty = await CampusFaculty.find({}).lean();
      } catch {}
    }
    if (!faculty || faculty.length === 0) {
      faculty = readJsonCollection("faculty.json", []);
    }

    if (q) {
      faculty = faculty.filter(
        (f) =>
          (f.name && f.name.toLowerCase().includes(q)) ||
          (f.designation && f.designation.toLowerCase().includes(q)) ||
          (f.department_name && f.department_name.toLowerCase().includes(q)) ||
          (f.building_name && f.building_name.toLowerCase().includes(q)) ||
          (f.email && f.email.toLowerCase().includes(q))
      );
    }

    return res.json({ success: true, count: faculty.length, data: faculty });
  } catch (error) {
    console.error("[Campus API] Error fetching faculty:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Alias for contacts
router.get("/contacts", (req, res) => {
  res.redirect("/api/campus/faculty");
});

// 5. GET /api/campus/services
router.get("/services", async (req, res) => {
  try {
    const q = (req.query.q || "").toLowerCase().trim();
    let services = [];

    if (mongoose.connection.readyState === 1) {
      try {
        services = await CampusService.find({}).lean();
      } catch {}
    }
    if (!services || services.length === 0) {
      services = readJsonCollection("services.json", []);
    }

    if (q) {
      services = services.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.category && s.category.toLowerCase().includes(q)) ||
          (s.location && s.location.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    return res.json({ success: true, count: services.length, data: services });
  } catch (error) {
    console.error("[Campus API] Error fetching services:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 6. GET /api/campus/events (Formed from Schedules: Academic calendar, Important Dates, Holidays)
router.get("/events", async (req, res) => {
  try {
    const q = (req.query.q || "").toLowerCase().trim();
    const schedulesData = readJsonCollection("schedules.json", {
      bus_routes: [],
      office_hours: [],
      academic_calendar: {},
    });

    const eventsList = [];
    let idCounter = 1;

    // A. Important Dates
    const importantDates =
      schedulesData.academic_calendar?.important_dates || [];
    for (const item of importantDates) {
      eventsList.push({
        id: `ev_${idCounter++}`,
        title: item.event || "Academic Event",
        date: item.date || "Scheduled Date",
        time: "All Day",
        location: "Campus-wide",
        description: item.description || "University scheduled milestone or deadline.",
        category: (item.event || "").toLowerCase().includes("exam")
          ? "Exams"
          : "Academic",
      });
    }

    // B. Holidays
    const holidays =
      schedulesData.academic_calendar?.holidays?.fixed_national_holidays || [];
    for (const h of holidays) {
      eventsList.push({
        id: `ev_${idCounter++}`,
        title: h,
        date: "Gazetted University Holiday",
        time: "Campus Closed",
        location: "Parul University",
        description:
          schedulesData.academic_calendar?.holidays?.note ||
          "Official university recognized national holiday.",
        category: "Holidays",
      });
    }

    // C. Key Milestones from Terms
    const terms = schedulesData.academic_calendar?.terms || [];
    for (const t of terms) {
      eventsList.push({
        id: `ev_${idCounter++}`,
        title: `${t.term || "Semester"} Term Period`,
        date: `${t.start_date || "Start"} to ${t.end_date || "End"}`,
        time: "Full Term",
        location: "All Institutes",
        description: `Classes commence: ${t.classes_commence || "TBD"}, Exam window: ${t.exams || "TBD"}`,
        category: "Academic",
      });
    }

    let filtered = eventsList;
    if (q) {
      filtered = eventsList.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
    }

    return res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    console.error("[Campus API] Error fetching events:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 7. GET /api/campus/schedules
router.get("/schedules", (req, res) => {
  try {
    const schedulesData = readJsonCollection("schedules.json", {
      bus_routes: [],
      office_hours: [],
      academic_calendar: {},
    });
    return res.json({ success: true, data: schedulesData });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 8. GET /api/campus/auth-config (Public Auth Configuration for frontend UI)
router.get("/auth-config", async (req, res) => {
  try {
    const settings = await getAuthSettings();
    return res.json({
      success: true,
      config: {
        googleAuthEnabled: settings.googleAuthEnabled,
        domainRestrictionEnabled: settings.domainRestrictionEnabled,
        allowedDomains: settings.allowedDomains,
        allowPersonalGmail: settings.allowPersonalGmail,
        registrationNote: settings.registrationNote,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 9. POST /api/campus/auth/google (Google Authentication & Domain Enforcement)
router.post("/auth/google", async (req, res) => {
  try {
    const { email, name, avatar, googleId } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "INVALID_EMAIL",
        message: "Email address is required for Google authentication.",
      });
    }

    const settings = await getAuthSettings();

    // 1. Check if Google Auth is enabled
    if (settings.googleAuthEnabled === false) {
      return res.status(403).json({
        success: false,
        error: "AUTH_DISABLED",
        message: "Google sign-in is currently disabled by university administration.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailDomain = cleanEmail.split("@")[1] || "";

    // 2. Domain Restriction Check
    if (settings.domainRestrictionEnabled) {
      const allowedList = (settings.allowedDomains || []).map((d) =>
        d.toLowerCase().trim()
      );
      const isDomainAllowed = allowedList.includes(emailDomain);

      if (!isDomainAllowed) {
        const allowedFormatted = allowedList.map((d) => `@${d}`).join(", ");
        return res.status(403).json({
          success: false,
          error: "DOMAIN_RESTRICTED",
          message: `Login restricted. This portal only allows university accounts (${allowedFormatted}). Your account (${cleanEmail}) is not authorized. Please switch to your student or faculty Google account.`,
        });
      }
    }

    // 3. User Upsert
    const userPayload = {
      googleId: googleId || `gid_${Date.now()}`,
      name: name || cleanEmail.split("@")[0],
      email: cleanEmail,
      avatar: avatar || "",
      domain: emailDomain,
      role: emailDomain.includes("parul") ? "student" : "user",
      lastLogin: new Date(),
    };

    // Save to local users.json
    try {
      const users = readJsonCollection("users.json", []);
      const idx = users.findIndex((u) => u.email === cleanEmail);
      if (idx > -1) {
        users[idx] = { ...users[idx], ...userPayload };
      } else {
        users.push(userPayload);
      }
      const usersFile = path.join(dbDir, "users.json");
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf-8");
    } catch {}

    // Save to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await CampusUser.findOneAndUpdate(
          { email: cleanEmail },
          userPayload,
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn("[Campus Auth] Mongo user upsert warning:", err.message);
      }
    }

    return res.json({
      success: true,
      message: "Authentication successful.",
      user: {
        id: userPayload.googleId,
        name: userPayload.name,
        email: userPayload.email,
        avatar: userPayload.avatar,
        domain: userPayload.domain,
        role: userPayload.role,
      },
    });
  } catch (error) {
    console.error("[Campus Auth] Google auth error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;


import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSXLib from "xlsx";
const XLSX = XLSXLib.default || XLSXLib;
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { embeddings } from "./v2/vector/embeddings.js";
import { addDynamicDocuments, clearVectorStore } from "./v2/vector/store.js";
import { campusData } from "./v2/vector/campusDataCache.js";
import { createStandardDocuments } from "./v2/vector/documents/documentFactory.js";
import { createPathDocuments } from "./v2/vector/documents/pathDocuments.js";
import { createScheduleDocuments } from "./v2/vector/documents/scheduleDocuments.js";
import { syncAllDataToMongo } from "../scripts/syncToMongo.js";
import mongoose from "mongoose";
import {
  CampusBuilding,
  CampusDepartment,
  CampusFaculty,
  CampusFacility,
  CampusPath,
  CampusPolicy,
  CampusRouteSummary,
  CampusSchedule,
  CampusService,
  VectorChunk,
} from "../models/campusModels.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, "../data/db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

function readJsonCollection(filename) {
  const file = path.join(dbDir, filename);
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch {
      return [];
    }
  }
  return [];
}

function writeJsonCollection(filename, data) {
  const file = path.join(dbDir, filename);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

export async function getCampusStats() {
  const buildings = readJsonCollection("buildings.json");
  const departments = readJsonCollection("departments.json");
  const faculty = readJsonCollection("faculty.json");
  const facilities = readJsonCollection("facilities.json");
  const services = readJsonCollection("services.json");
  const schedules = readJsonCollection("schedules.json");
  const policies = readJsonCollection("policies.json");

  const vecPath = path.resolve(
    __dirname,
    "../data/vectors/precomputed_vectors.json"
  );
  let vectorCount = 0;
  if (fs.existsSync(vecPath)) {
    try {
      const v = JSON.parse(fs.readFileSync(vecPath, "utf-8"));
      vectorCount = v.length;
    } catch {}
  }

  return {
    buildings: buildings.length,
    departments: departments.length,
    faculty: faculty.length,
    facilities: facilities.length,
    services: services.length,
    schedules: Array.isArray(schedules)
      ? schedules.length
      : schedules.bus_routes?.length || 0,
    policies: policies.length,
    vectorChunks: vectorCount,
  };
}

export async function processExcelUpload(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  const summary = {};
  const newlyCreatedDocs = [];

  // 1. Buildings Sheet
  const buildingSheet = sheetNames.find(
    (n) => n.toLowerCase().includes("building")
  );
  if (buildingSheet) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[buildingSheet]);
    const existing = readJsonCollection("buildings.json");
    const idMap = new Map(existing.map((b) => [b.id, b]));

    for (const r of rows) {
      const id =
        r["Building Code*"] ||
        r["Building Code"] ||
        r["Code"] ||
        r["Source ID"] ||
        r["id"];
      if (!id) continue;
      const bObj = {
        id: String(id).trim(),
        code: String(id).trim(),
        name: r["Full Building Name*"] || r["Name"] || id,
        short_name: r["Short Name"] || id,
        category: r["Category"] || "academic",
        floors: Number(r["Floors"]) || 1,
        zone: r["Zone"] || "central",
        lat: Number(r["Latitude"]) || null,
        lng: Number(r["Longitude"]) || null,
        coordinates_verified: r["Coordinates Verified"] !== false,
        aliases: (r["Aliases (comma-separated)"] || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        description: r["Description"] || "",
        institutes: (r["Institutes"] || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        nearby: (r["Nearby"] || r["Nearby Buildings"] || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      idMap.set(id, bObj);
      newlyCreatedDocs.push(...createStandardDocuments([bObj], "Building"));
    }
    const updated = Array.from(idMap.values());
    writeJsonCollection("buildings.json", updated);
    campusData.buildings = updated;
    summary.buildings = rows.length;
  }

  // 2. Locations & Facilities Sheet
  const facSheet = sheetNames.find(
    (n) => n.toLowerCase().includes("facilit") || n.toLowerCase().includes("location")
  );
  if (facSheet) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[facSheet]);
    const existing = readJsonCollection("facilities.json");
    const idMap = new Map(existing.map((f) => [f.id, f]));

    rows.forEach((r, idx) => {
      const name =
        r["Name / Label*"] ||
        r["Location / Facility Name*"] ||
        r["Name*"] ||
        r["Name"] ||
        `FAC_${idx}`;
      const id = r["Source ID"] || `FAC_${Date.now()}_${idx}`;
      const fObj = {
        id: String(id).trim(),
        label: name,
        type:
          r["Type* (canteen/washroom/atm/etc)"] ||
          r["Type*"] ||
          r["Type"] ||
          "facility",
        building_id:
          r["Building Code*"] || r["Building Code"] || r["building_id"] || "",
        building_name: r["Building Name"] || "",
        floor: Number(r["Floor*"] || r["Floor"]) || 0,
        notes:
          r["Room / Landmark"] ||
          r["Notes / Details"] ||
          r["notes"] ||
          "",
        gender: r["Gender"] || r["Gender (for washrooms)"] || "both",
        aliases: (r["Aliases (comma-separated)"] || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      idMap.set(id, fObj);
      newlyCreatedDocs.push(...createStandardDocuments([fObj], "Facility"));
    });
    const updated = Array.from(idMap.values());
    writeJsonCollection("facilities.json", updated);
    summary.facilities = rows.length;
  }

  // 3. Faculty Sheet
  const facDirSheet = sheetNames.find((n) =>
    n.toLowerCase().includes("faculty")
  );
  if (facDirSheet) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[facDirSheet]);
    const existing = readJsonCollection("faculty.json");
    const idMap = new Map(existing.map((f) => [f.id, f]));

    rows.forEach((r, idx) => {
      const name =
        r["Name*"] ||
        r["Faculty Name*"] ||
        r["Name"] ||
        r["name"];
      if (!name) return;
      const id =
        r["Source Faculty ID"] ||
        r["id"] ||
        `fac_${Date.now()}_${idx}`;
      const fObj = {
        id: String(id).trim(),
        name,
        role: r["Source Role"] || r["Role / Designation*"] || "Faculty",
        designation:
          r["Designation*"] ||
          r["Role / Designation*"] ||
          "Faculty",
        department_name: r["Department*"] || r["Department"] || "",
        building_id:
          r["Building Code*"] || r["Building Code"] || "",
        floor: Number(r["Floor"]) || 0,
        room: r["Cabin/Room"] || r["Room"] || "",
        email: r["Email"] || "",
        phone: r["Phone"] || "",
        subjects_taught: (r["Subjects Taught"] || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        aliases: (r["Aliases (comma-separated)"] || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        description: r["Description"] || "",
      };
      idMap.set(id, fObj);
      newlyCreatedDocs.push(...createStandardDocuments([fObj], "Faculty"));
    });
    const updated = Array.from(idMap.values());
    writeJsonCollection("faculty.json", updated);
    summary.faculty = rows.length;
  }

  // 4. Departments Sheet
  const deptSheet = sheetNames.find((n) =>
    n.toLowerCase().includes("department")
  );
  if (deptSheet) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[deptSheet]);
    const existing = readJsonCollection("departments.json");
    const idMap = new Map(existing.map((d) => [d.id, d]));

    rows.forEach((r, idx) => {
      const name = r["Department Name*"] || r["Name"];
      if (!name) return;
      const id =
        r["Code"] ||
        r["Source ID"] ||
        r["id"] ||
        `dept_${Date.now()}_${idx}`;
      const dObj = {
        id: String(id).trim(),
        name,
        short_name: r["Short Name"] || r["Code"] || id,
        parent_faculty: r["Parent Faculty"] || "",
        building_id:
          r["Building Code*"] || r["Building Code"] || "",
        building_name: r["Building Name"] || "",
        floor: Number(r["Floor*"] || r["Floor"]) || 0,
        hod: {
          name: r["HOD Name"] || "",
          room: r["HOD Room"] || "",
          email: r["HOD Email"] || "",
          phone: r["HOD Phone"] || "",
        },
        programs: (
          r["Programs Offered (comma-separated)"] ||
          r["Programs (comma-separated)"] ||
          ""
        )
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        aliases: (r["Aliases (comma-separated)"] || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        description: r["Description"] || "",
        subjects: (r["Subjects (comma-separated)"] || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      idMap.set(id, dObj);
      newlyCreatedDocs.push(
        ...createStandardDocuments([dObj], "Department")
      );
    });
    const updated = Array.from(idMap.values());
    writeJsonCollection("departments.json", updated);
    campusData.departments = updated;
    summary.departments = rows.length;
  }

  // 5. Paths Sheet
  const pathSheet = sheetNames.find((n) => n.toLowerCase().includes("path"));
  if (pathSheet) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[pathSheet]);
    const existing = readJsonCollection("paths.json");
    const existingPaths = existing.paths || (Array.isArray(existing) ? existing : []);
    const idMap = new Map(existingPaths.map((p) => [p.id, p]));

    rows.forEach((r, idx) => {
      const id = r["Source Path ID"] || r["id"] || `path_${idx + 1}`;
      const pObj = {
        id: String(id).trim(),
        from: r["From Building Code*"] || r["From"] || "",
        from_name: r["From Building Name"] || r["From Name"] || "",
        to: r["To Building Code*"] || r["To"] || "",
        to_name: r["To Building Name"] || r["To Name"] || "",
        distance_m: Number(r["Distance (m)*"] || r["distance_m"]) || 0,
        walk_minutes: Number(r["Walk Time (min)*"] || r["walk_minutes"]) || 1,
        route_description: r["Route Description"] || r["route_description"] || "",
        landmarks: (r["Landmarks (comma-separated)"] || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      idMap.set(id, pObj);
    });

    const updatedPaths = Array.from(idMap.values());
    const fullData = { paths: updatedPaths, route_summaries: existing.route_summaries || [] };
    writeJsonCollection("paths.json", fullData);
    campusData.paths = updatedPaths;
    newlyCreatedDocs.push(...createPathDocuments(updatedPaths, "Navigation"));
    summary.paths = rows.length;
  }

  // 6. Services Sheets
  const serviceSheet = sheetNames.find(
    (n) =>
      n.toLowerCase() === "services" ||
      (n.toLowerCase().includes("service") &&
        !n.toLowerCase().includes("timing") &&
        !n.toLowerCase().includes("detail"))
  );
  const serviceTimingsSheet = sheetNames.find((n) =>
    n.toLowerCase().includes("timing")
  );
  const serviceDetailsSheet = sheetNames.find((n) =>
    n.toLowerCase().includes("detail")
  );

  if (serviceSheet || serviceTimingsSheet || serviceDetailsSheet) {
    const existing = readJsonCollection("services.json");
    const idMap = new Map(existing.map((s) => [s.id, s]));

    if (serviceSheet) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[serviceSheet]);
      rows.forEach((r, idx) => {
        const id = r["Service ID"] || r["id"] || `svc_${idx + 1}`;
        const name = r["Service Name"] || r["Name"] || id;
        let parsedTimings = null;
        if (r["Timings (JSON)"]) {
          try {
            parsedTimings = JSON.parse(r["Timings (JSON)"]);
          } catch {
            parsedTimings = r["Timings (JSON)"];
          }
        }

        const sObj = {
          id: String(id).trim(),
          name,
          type: r["Type"] || "service",
          building_id: r["Building Code"] || "",
          building_name: r["Building Name"] || "",
          floor: Number(r["Floor"]) || 0,
          contact_email: r["Contact Email"] || "",
          contact_phone: r["Contact Phone"] || "",
          aliases: (r["Aliases (comma-separated)"] || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          timings: parsedTimings,
          description: r["Description"] || "",
          facilities: (r["Facilities (comma-separated)"] || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          rules: (r["Rules (comma-separated)"] || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        };
        idMap.set(id, sObj);
      });
      summary.services = rows.length;
    }

    if (serviceTimingsSheet) {
      const timingRows = XLSX.utils.sheet_to_json(
        workbook.Sheets[serviceTimingsSheet]
      );
      timingRows.forEach((tr) => {
        const sId = tr["Service ID"];
        if (sId && idMap.has(sId)) {
          const s = idMap.get(sId);
          if (!s.timings || typeof s.timings !== "object") s.timings = {};
          if (tr["Timing Key"] && tr["Timing"]) {
            s.timings[tr["Timing Key"]] = tr["Timing"];
          }
        }
      });
    }

    if (serviceDetailsSheet) {
      const detailRows = XLSX.utils.sheet_to_json(
        workbook.Sheets[serviceDetailsSheet]
      );
      detailRows.forEach((dr) => {
        const sId = dr["Service ID"];
        if (sId && idMap.has(sId)) {
          const s = idMap.get(sId);
          const type = (dr["Detail Type"] || "").toLowerCase();
          const val = dr["Detail"];
          if (val) {
            if (type.includes("facil")) {
              if (!s.facilities) s.facilities = [];
              if (!s.facilities.includes(val)) s.facilities.push(val);
            } else if (type.includes("rule")) {
              if (!s.rules) s.rules = [];
              if (!s.rules.includes(val)) s.rules.push(val);
            }
          }
        }
      });
    }

    const updated = Array.from(idMap.values());
    writeJsonCollection("services.json", updated);
    campusData.services = updated;
    newlyCreatedDocs.push(...createStandardDocuments(updated, "Service"));
    if (!summary.services) summary.services = updated.length;
  }

  // 7. Schedules Sheets (Bus Routes, Office Hours, Academic Calendar, Important Dates, Holidays)
  const busSheet = sheetNames.find(
    (n) =>
      n.toLowerCase().includes("bus") ||
      (n.toLowerCase().includes("schedule") &&
        !n.toLowerCase().includes("office") &&
        !n.toLowerCase().includes("calendar"))
  );
  const officeSheet = sheetNames.find(
    (n) => n.toLowerCase().includes("office") || n.toLowerCase().includes("hour")
  );
  const calendarSheet = sheetNames.find(
    (n) =>
      n.toLowerCase().includes("calendar") || n.toLowerCase().includes("academic")
  );
  const datesSheet = sheetNames.find(
    (n) => n.toLowerCase().includes("date") || n.toLowerCase().includes("important")
  );
  const holidaysSheet = sheetNames.find((n) =>
    n.toLowerCase().includes("holiday")
  );

  if (
    busSheet ||
    officeSheet ||
    calendarSheet ||
    datesSheet ||
    holidaysSheet
  ) {
    const existing = readJsonCollection("schedules.json");
    const fullData =
      typeof existing === "object" && !Array.isArray(existing)
        ? { ...existing }
        : { bus_routes: [], office_hours: [], academic_calendar: {} };

    if (!fullData.bus_routes) fullData.bus_routes = [];
    if (!fullData.office_hours) fullData.office_hours = [];
    if (!fullData.academic_calendar) fullData.academic_calendar = {};

    let totalRows = 0;

    // Bus routes
    if (busSheet) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[busSheet]);
      const idMap = new Map(fullData.bus_routes.map((b) => [b.id, b]));
      rows.forEach((r, idx) => {
        const id = r["Route ID"] || r["id"] || `bus_${idx + 1}`;
        let parsedStops = [];
        if (r["Stops (JSON)"]) {
          try {
            parsedStops = JSON.parse(r["Stops (JSON)"]);
          } catch {
            parsedStops = [];
          }
        }
        let parsedReturn = [];
        if (r["Return Schedule (JSON)"]) {
          try {
            parsedReturn = JSON.parse(r["Return Schedule (JSON)"]);
          } catch {
            parsedReturn = [];
          }
        }
        const bObj = {
          id: String(id).trim(),
          route_name: r["Route Name"] || "",
          route_number: r["Route Number"] || "",
          direction: r["Direction"] || "both",
          aliases: (r["Aliases (comma-separated)"] || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          description: r["Description"] || "",
          stops: parsedStops,
          return_schedule: parsedReturn,
          frequency: r["Frequency"] || "",
          notes: r["Notes"] || "",
        };
        idMap.set(id, bObj);
      });
      fullData.bus_routes = Array.from(idMap.values());
      totalRows += rows.length;
    }

    // Office hours
    if (officeSheet) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[officeSheet]);
      const idMap = new Map(fullData.office_hours.map((o) => [o.id, o]));
      rows.forEach((r, idx) => {
        const id = r["ID"] || r["id"] || `oh_${idx + 1}`;
        const ohObj = {
          id: String(id).trim(),
          name: r["Name"] || "",
          days: r["Days"] || "",
          timing: r["Timing"] || "",
          lunch_break: r["Lunch Break"] || "",
          notes: r["Notes"] || "",
          aliases: (r["Aliases (comma-separated)"] || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        };
        idMap.set(id, ohObj);
      });
      fullData.office_hours = Array.from(idMap.values());
      totalRows += rows.length;
    }

    // Academic calendar
    if (calendarSheet) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[calendarSheet]);
      rows.forEach((r) => {
        if (r["Academic Year"]) {
          fullData.academic_calendar.current_academic_year = r["Academic Year"];
        }
        const semKey =
          r["Semester"] ||
          (r["Semester Name"]
            ? r["Semester Name"].toLowerCase().replace(/\s+/g, "_")
            : null);
        if (semKey) {
          fullData.academic_calendar[semKey] = {
            name: r["Semester Name"] || semKey,
            start_date: r["Start Date"] || "",
            end_date: r["End Date"] || "",
            exam_start: r["Exam Start"] || "",
            exam_end: r["Exam End"] || "",
            result_declaration: r["Result Declaration"] || "",
          };
        }
      });
      totalRows += rows.length;
    }

    // Important dates
    if (datesSheet) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[datesSheet]);
      fullData.academic_calendar.important_dates = rows.map((r) => ({
        event: r["Event"] || "",
        date: r["Date"] || "TBD",
        description: r["Description"] || "",
      }));
      totalRows += rows.length;
    }

    // Holidays
    if (holidaysSheet) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[holidaysSheet]);
      const holidayNote =
        rows.find((r) => r["Holiday Note"])?.["Holiday Note"] || "";
      const fixedHolidays = rows
        .map((r) => r["Fixed National Holidays (one per row)"] || r["Holiday"])
        .filter(Boolean);
      fullData.academic_calendar.holidays = {
        note: holidayNote,
        fixed_national_holidays: fixedHolidays,
      };
      totalRows += rows.length;
    }

    writeJsonCollection("schedules.json", fullData);
    campusData.schedules = fullData;
    const schedDocs = createScheduleDocuments(fullData, "Schedule");
    newlyCreatedDocs.push(...schedDocs);
    summary.schedules = totalRows;
  }

  // 8. Embed and update vector store
  if (newlyCreatedDocs.length > 0) {
    console.log(
      `Embedding ${newlyCreatedDocs.length} new records from Excel...`
    );
    const texts = newlyCreatedDocs.map((d) => d.pageContent);
    const vectors = await embeddings.embedDocuments(texts);
    await addDynamicDocuments(newlyCreatedDocs, vectors);
  }

  // 9. Sync to MongoDB Atlas in background
  try {
    syncAllDataToMongo().catch((err) =>
      console.warn("[Admin] Background MongoDB sync failed:", err.message)
    );
  } catch {}

  return {
    success: true,
    message: "Excel data imported and indexed successfully",
    summary,
    totalNewVectors: newlyCreatedDocs.length,
  };
}

export async function processPdfUpload(filePath, originalFilename, category = "Policy") {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);
  const text = pdfData.text || "";

  if (!text.trim()) {
    throw new Error("No readable text could be extracted from this PDF.");
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
  });

  const rawChunks = await splitter.splitText(text);
  const docs = rawChunks.map(
    (chunk, i) =>
      new Document({
        pageContent: `Document: ${originalFilename}\nCategory: ${category}\nContent: ${chunk}`,
        metadata: {
          source: originalFilename,
          category,
          chunkIndex: i,
          uploadDate: new Date().toISOString(),
        },
      })
  );

  console.log(`Embedding ${docs.length} chunks from ${originalFilename}...`);
  const vectors = await embeddings.embedDocuments(docs.map((d) => d.pageContent));
  await addDynamicDocuments(docs, vectors);

  return {
    success: true,
    filename: originalFilename,
    pages: pdfData.numpages,
    chunksIndexed: docs.length,
  };
}

/**
 * Completely wipe Dexa's Brain (Vectors, In-Memory Cache, JSON collections, MongoDB Atlas)
 */
export async function resetBrainData() {
  console.log("[Admin] Initiating full brain reset...");

  // 1. Clear vector store and in-memory cache
  await clearVectorStore();

  // 2. Clear local JSON database collections in backend/data/db
  const emptyCollections = {
    "buildings.json": [],
    "departments.json": [],
    "faculty.json": [],
    "facilities.json": [],
    "services.json": [],
    "schedules.json": { bus_routes: [], office_hours: [], academic_calendar: {} },
    "policies.json": [],
    "paths.json": { paths: [], route_summaries: [] },
  };

  for (const [filename, emptyVal] of Object.entries(emptyCollections)) {
    writeJsonCollection(filename, emptyVal);
  }

  // 3. Clear MongoDB Atlas if connected
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("[Admin] Wiping MongoDB Atlas campus collections...");
      await Promise.all([
        CampusBuilding.deleteMany({}),
        CampusDepartment.deleteMany({}),
        CampusFaculty.deleteMany({}),
        CampusFacility.deleteMany({}),
        CampusService.deleteMany({}),
        CampusSchedule.deleteMany({}),
        CampusPolicy.deleteMany({}),
        CampusPath.deleteMany({}),
        CampusRouteSummary.deleteMany({}),
        VectorChunk.deleteMany({}),
      ]);
      console.log("[Admin] MongoDB Atlas campus collections wiped.");
    }
  } catch (mongoErr) {
    console.warn("[Admin] MongoDB wipe warning:", mongoErr.message);
  }

  return {
    success: true,
    message: "Dexa Brain has been completely reset. All vectors and knowledge records have been cleared.",
    stats: {
      buildings: 0,
      departments: 0,
      faculty: 0,
      facilities: 0,
      services: 0,
      schedules: 0,
      policies: 0,
      vectorChunks: 0,
    },
  };
}

/**
 * Admin CRUD for Locations (Buildings)
 */
export async function saveLocationItem(item) {
  const existing = readJsonCollection("buildings.json");
  const id = item.id || `b_${Date.now()}`;
  const bObj = {
    id: String(id),
    code: item.code || String(id),
    name: item.name || "Untitled Building",
    short_name: item.short_name || item.name,
    category: item.category || item.type || "academic",
    floors: Number(item.floors) || 1,
    zone: item.zone || "central",
    lat: Number(item.latitude ?? item.lat) || 22.292,
    lng: Number(item.longitude ?? item.lng) || 73.363,
    coordinates_verified: true,
    aliases: Array.isArray(item.aliases)
      ? item.aliases
      : (item.aliases || "").split(",").map((s) => s.trim()).filter(Boolean),
    description: item.description || "",
    institutes: Array.isArray(item.institutes)
      ? item.institutes
      : (item.institutes || "").split(",").map((s) => s.trim()).filter(Boolean),
    nearby: Array.isArray(item.nearby)
      ? item.nearby
      : (item.nearby || "").split(",").map((s) => s.trim()).filter(Boolean),
  };

  const idx = existing.findIndex((b) => b.id === bObj.id || b.code === bObj.code);
  if (idx > -1) {
    existing[idx] = { ...existing[idx], ...bObj };
  } else {
    existing.push(bObj);
  }
  writeJsonCollection("buildings.json", existing);
  campusData.buildings = existing;

  if (mongoose.connection.readyState === 1) {
    try {
      await CampusBuilding.findOneAndUpdate({ id: bObj.id }, bObj, {
        upsert: true,
        new: true,
      });
    } catch {}
  }

  try {
    const docs = createStandardDocuments([bObj], "Building");
    const vectors = await embeddings.embedDocuments(docs.map((d) => d.pageContent));
    await addDynamicDocuments(docs, vectors);
  } catch (err) {
    console.warn("[Admin] Vector embedding warning:", err.message);
  }

  return bObj;
}

export async function deleteLocationItem(id) {
  const existing = readJsonCollection("buildings.json");
  const filtered = existing.filter((b) => String(b.id) !== String(id) && String(b.code) !== String(id));
  writeJsonCollection("buildings.json", filtered);
  campusData.buildings = filtered;

  if (mongoose.connection.readyState === 1) {
    try {
      await CampusBuilding.deleteOne({ $or: [{ id }, { code: id }] });
    } catch {}
  }
  return { success: true, id };
}

/**
 * Admin CRUD for Facilities
 */
export async function saveFacilityItem(item) {
  const existing = readJsonCollection("facilities.json");
  const id = item.id || `f_${Date.now()}`;
  const fObj = {
    id: String(id),
    name: item.name || "Untitled Facility",
    category: item.category || "General",
    building_name: item.building_name || item.location || "",
    floor: item.floor || "",
    hours: item.hours || "Standard Hours",
    amenities: Array.isArray(item.amenities)
      ? item.amenities
      : (item.amenities || "").split(",").map((s) => s.trim()).filter(Boolean),
    description: item.description || "",
  };

  const idx = existing.findIndex((f) => f.id === fObj.id);
  if (idx > -1) {
    existing[idx] = { ...existing[idx], ...fObj };
  } else {
    existing.push(fObj);
  }
  writeJsonCollection("facilities.json", existing);
  campusData.facilities = existing;

  if (mongoose.connection.readyState === 1) {
    try {
      await CampusFacility.findOneAndUpdate({ id: fObj.id }, fObj, {
        upsert: true,
        new: true,
      });
    } catch {}
  }

  try {
    const docs = createStandardDocuments([fObj], "Facility");
    const vectors = await embeddings.embedDocuments(docs.map((d) => d.pageContent));
    await addDynamicDocuments(docs, vectors);
  } catch (err) {}

  return fObj;
}

export async function deleteFacilityItem(id) {
  const existing = readJsonCollection("facilities.json");
  const filtered = existing.filter((f) => String(f.id) !== String(id));
  writeJsonCollection("facilities.json", filtered);
  campusData.facilities = filtered;

  if (mongoose.connection.readyState === 1) {
    try {
      await CampusFacility.deleteOne({ id });
    } catch {}
  }
  return { success: true, id };
}

/**
 * Admin CRUD for Faculty / Contacts
 */
export async function saveFacultyItem(item) {
  const existing = readJsonCollection("faculty.json");
  const id = item.id || `fac_${Date.now()}`;
  const facObj = {
    id: String(id),
    name: item.name || "Faculty Member",
    role: item.role || "faculty",
    designation: item.designation || "Assistant Professor",
    department_name: item.department_name || item.department || "",
    building_name: item.building_name || item.building || "",
    email: item.email || "",
    phone: item.phone || "",
    room: item.room || "",
  };

  const idx = existing.findIndex((f) => f.id === facObj.id);
  if (idx > -1) {
    existing[idx] = { ...existing[idx], ...facObj };
  } else {
    existing.push(facObj);
  }
  writeJsonCollection("faculty.json", existing);
  campusData.faculty = existing;

  if (mongoose.connection.readyState === 1) {
    try {
      await CampusFaculty.findOneAndUpdate({ id: facObj.id }, facObj, {
        upsert: true,
        new: true,
      });
    } catch {}
  }

  try {
    const docs = createStandardDocuments([facObj], "Faculty");
    const vectors = await embeddings.embedDocuments(docs.map((d) => d.pageContent));
    await addDynamicDocuments(docs, vectors);
  } catch (err) {}

  return facObj;
}

export async function deleteFacultyItem(id) {
  const existing = readJsonCollection("faculty.json");
  const filtered = existing.filter((f) => String(f.id) !== String(id));
  writeJsonCollection("faculty.json", filtered);
  campusData.faculty = filtered;

  if (mongoose.connection.readyState === 1) {
    try {
      await CampusFaculty.deleteOne({ id });
    } catch {}
  }
  return { success: true, id };
}

/**
 * Admin CRUD for Events / Schedules
 */
export async function saveEventItem(item) {
  const fullData = readJsonCollection("schedules.json", {
    bus_routes: [],
    office_hours: [],
    academic_calendar: { important_dates: [], holidays: { fixed_national_holidays: [] } },
  });

  if (!fullData.academic_calendar) {
    fullData.academic_calendar = { important_dates: [], holidays: { fixed_national_holidays: [] } };
  }
  if (!Array.isArray(fullData.academic_calendar.important_dates)) {
    fullData.academic_calendar.important_dates = [];
  }

  const newDateEntry = {
    event: item.title || item.event || "Academic Event",
    date: item.date || "TBD",
    description: item.description || "",
  };

  const idx = fullData.academic_calendar.important_dates.findIndex(
    (e) => e.event === newDateEntry.event
  );
  if (idx > -1) {
    fullData.academic_calendar.important_dates[idx] = newDateEntry;
  } else {
    fullData.academic_calendar.important_dates.push(newDateEntry);
  }

  writeJsonCollection("schedules.json", fullData);
  campusData.schedules = fullData;

  try {
    const schedDocs = createScheduleDocuments(fullData, "Schedule");
    const vectors = await embeddings.embedDocuments(schedDocs.map((d) => d.pageContent));
    await addDynamicDocuments(schedDocs, vectors);
  } catch (err) {}

  return newDateEntry;
}

export async function deleteEventItem(idOrTitle) {
  const fullData = readJsonCollection("schedules.json", {
    bus_routes: [],
    office_hours: [],
    academic_calendar: { important_dates: [], holidays: { fixed_national_holidays: [] } },
  });

  if (fullData.academic_calendar?.important_dates) {
    fullData.academic_calendar.important_dates = fullData.academic_calendar.important_dates.filter(
      (e) => e.event !== idOrTitle && !idOrTitle.includes(e.event)
    );
    writeJsonCollection("schedules.json", fullData);
    campusData.schedules = fullData;
  }

  return { success: true, removed: idOrTitle };
}


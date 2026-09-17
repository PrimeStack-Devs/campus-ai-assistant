import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSXLib from "xlsx";
const XLSX = XLSXLib.default || XLSXLib;
import { embeddings } from "../services/v2/vector/embeddings.js";
import { createStandardDocuments } from "../services/v2/vector/documents/documentFactory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const profsPath = path.resolve(__dirname, "../data/seeds/professors.json");
const seedsFacultyPath = path.resolve(__dirname, "../data/seeds/faculty.json");
const dbFacultyPath = path.resolve(__dirname, "../data/db/faculty.json");
const seedsDeptsPath = path.resolve(__dirname, "../data/seeds/departments.json");
const dbDeptsPath = path.resolve(__dirname, "../data/db/departments.json");
const excelFacDirPath = path.resolve(__dirname, "../data/excel/Faculty_directory.xlsx");
const vectorsPath = path.resolve(__dirname, "../data/vectors/precomputed_vectors.json");

function normalizeName(name) {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.|er\.|shri|smt\.)\s+/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function cleanStr(val) {
  if (!val) return "";
  const s = String(val).trim();
  if (s === "—" || s === "-" || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") {
    return "";
  }
  return s;
}

function cleanPhone(val) {
  const s = cleanStr(val);
  if (!s) return "";
  const digits = s.replace(/[^0-9]/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

async function runSync() {
  console.log("🚀 Starting Professors Data Ingestion and Vector Refresh...");

  if (!fs.existsSync(profsPath)) {
    throw new Error(`File not found: ${profsPath}`);
  }

  const rawProfessors = JSON.parse(fs.readFileSync(profsPath, "utf-8"));
  console.log(`📋 Found ${rawProfessors.length} professors in seeds/professors.json`);

  const seedsFaculty = JSON.parse(fs.readFileSync(seedsFacultyPath, "utf-8"));
  console.log(`📚 Current faculty.json count: ${seedsFaculty.length}`);

  const depts = JSON.parse(fs.readFileSync(seedsDeptsPath, "utf-8"));

  // 1. Ensure MCA Department HOD is updated in departments.json
  const mcaDept = depts.find((d) => d.id === "dept_mca");
  if (mcaDept) {
    mcaDept.hod = {
      name: "Prof. Vivek Dave",
      room: "501",
      email: "vivek.dave@paruluniversity.ac.in",
      phone: "8128313699",
    };
    fs.writeFileSync(seedsDeptsPath, JSON.stringify(depts, null, 2), "utf-8");
    fs.writeFileSync(dbDeptsPath, JSON.stringify(depts, null, 2), "utf-8");
    console.log("✅ Confirmed MCA Department HOD in seeds/departments.json & db/departments.json");
  }

  // 2. Map existing faculty by normalized name and email
  const facultyByNormName = new Map();
  const facultyByEmail = new Map();

  seedsFaculty.forEach((f) => {
    const n = normalizeName(f.name);
    if (n) facultyByNormName.set(n, f);
    if (f.email) facultyByEmail.set(f.email.toLowerCase().trim(), f);
  });

  const modifiedRecords = [];
  const newlyAddedRecords = [];

  for (const p of rawProfessors) {
    const pNorm = normalizeName(p.name);
    const pEmail = cleanStr(p.email).toLowerCase();
    const pPhone = cleanPhone(p.phone);
    const pCleanRole = cleanStr(p.role).replace(/,\s*$/, "");

    // Check if match exists
    let existing = (pEmail && facultyByEmail.get(pEmail)) || facultyByNormName.get(pNorm);

    if (existing) {
      // Enrich existing record
      if (pPhone && (!existing.phone || existing.phone.includes("TBD"))) {
        existing.phone = pPhone;
      }
      if (pEmail && (!existing.email || existing.email.includes("TBD"))) {
        existing.email = p.email.trim();
      }

      // Add alias keywords if missing
      const newAliases = [
        p.name.toLowerCase(),
        pNorm,
        pCleanRole.toLowerCase(),
      ];
      if (pCleanRole.toLowerCase().includes("hod")) {
        newAliases.push("hod", "head of department");
        if (pCleanRole.toLowerCase().includes("mca")) {
          newAliases.push("hod mca", "mca hod", "head of mca");
        }
      }
      if (pCleanRole.toLowerCase().includes("dean")) {
        newAliases.push("dean", "dean fitcs", "dean it");
      }
      if (pCleanRole.toLowerCase().includes("director")) {
        newAliases.push("academic director", "director academics");
      }

      existing.aliases = Array.from(
        new Set([...(existing.aliases || []), ...newAliases.filter(Boolean)])
      );

      // Keep designation descriptive if not present
      if (!existing.designation || existing.designation === "faculty") {
        existing.designation = pCleanRole;
      }

      modifiedRecords.push(existing);
    } else {
      // Create new faculty record
      const cleanId = `fac_pica_prof_${String(p.id).padStart(3, "0")}`;
      const isHOD = pCleanRole.toLowerCase().includes("hod");
      const isDean = pCleanRole.toLowerCase().includes("dean");
      const isDirector = pCleanRole.toLowerCase().includes("director");

      let category = "Faculty";
      let role = "faculty";
      if (isDean || isDirector) {
        category = "Institute Leadership";
        role = "leadership";
      } else if (isHOD) {
        category = "Institute Leadership";
        role = "faculty";
      }

      let deptId = "dept_mca";
      let deptName = "Master of Computer Application (MCA) / Faculty of IT & CS";
      if (pCleanRole.toLowerCase().includes("career development")) {
        deptId = "dept_cdc";
        deptName = "Career Development Cell";
      }

      const aliases = [
        p.name.toLowerCase(),
        pNorm,
        pCleanRole.toLowerCase(),
        deptId,
      ];
      if (isHOD) aliases.push("hod", "head of department");
      if (isHOD && pCleanRole.toLowerCase().includes("mca")) {
        aliases.push("hod mca", "mca hod", "head of mca");
      }
      if (isDirector) aliases.push("academic director", "director academics");
      if (isDean) aliases.push("dean fitcs", "dean");

      const newRecord = {
        id: cleanId,
        name: p.name.trim(),
        role: role,
        category: category,
        designation: pCleanRole,
        department_id: deptId,
        department_name: deptName,
        building_id: "A25",
        building_name: "C.V. Raman Centre",
        floor: 5,
        room: isHOD ? "501" : "Faculty Cabins",
        phone: pPhone || null,
        email: p.email ? p.email.trim() : null,
        subjects_taught: ["Computer Applications", "Information Technology"],
        aliases: Array.from(new Set(aliases.filter(Boolean))),
        description: `${pCleanRole} in ${deptName} at Parul University (C.V. Raman Centre A25). Contact: ${pPhone || ""} ${p.email ? `Email: ${p.email}` : ""}`.trim(),
        currently_working: true,
      };

      seedsFaculty.push(newRecord);
      facultyByNormName.set(pNorm, newRecord);
      if (newRecord.email) facultyByEmail.set(newRecord.email.toLowerCase(), newRecord);
      newlyAddedRecords.push(newRecord);
      modifiedRecords.push(newRecord);
    }
  }

  console.log(`✨ Enriched ${modifiedRecords.length - newlyAddedRecords.length} existing faculty records.`);
  console.log(`✨ Added ${newlyAddedRecords.length} new faculty records into faculty.json.`);
  console.log(`📚 Total faculty records now: ${seedsFaculty.length}`);

  // Persist to seeds/faculty.json and db/faculty.json
  fs.writeFileSync(seedsFacultyPath, JSON.stringify(seedsFaculty, null, 2), "utf-8");
  fs.writeFileSync(dbFacultyPath, JSON.stringify(seedsFaculty, null, 2), "utf-8");
  console.log("✅ Saved updated faculty data to seeds/faculty.json & db/faculty.json");

  // 3. Update Excel directory if it exists
  if (fs.existsSync(excelFacDirPath)) {
    try {
      const wb = XLSX.readFile(excelFacDirPath);
      const sheetName = wb.SheetNames[0] || "Faculty_directory";
      const existingRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
      const existingEmails = new Set(existingRows.map((r) => cleanStr(r.Email).toLowerCase()).filter(Boolean));

      let addedToExcel = 0;
      for (const p of rawProfessors) {
        const pEmail = cleanStr(p.email).toLowerCase();
        if (pEmail && !existingEmails.has(pEmail)) {
          existingRows.push({
            "Name*": p.name.trim(),
            "Designation*": cleanStr(p.role).replace(/,\s*$/, "") || "Assistant Professor",
            "Department*": "MCA / Faculty of IT & CS",
            "Building Code*": "A25",
            "Floor": "5",
            "Cabin/Room": "",
            "Email": p.email.trim(),
            "Phone": p.phone ? `+91${cleanPhone(p.phone)}` : "",
            "Subjects Taught": "Computer Applications",
            "Source Faculty ID": `FAC_PROF_${p.id}`,
            "Source Role": "Faculty",
          });
          existingEmails.add(pEmail);
          addedToExcel++;
        }
      }
      const updatedWs = XLSX.utils.json_to_sheet(existingRows);
      wb.Sheets[sheetName] = updatedWs;
      XLSX.writeFile(wb, excelFacDirPath);
      console.log(`✅ Synced ${addedToExcel} entries to Faculty_directory.xlsx`);
    } catch (excelErr) {
      console.warn("⚠️ Excel sync skipped:", excelErr.message);
    }
  }

  // 4. Update Vector Embeddings in precomputed_vectors.json
  console.log("⚡ Generating fresh vector embeddings...");
  let vectorRecords = [];
  if (fs.existsSync(vectorsPath)) {
    vectorRecords = JSON.parse(fs.readFileSync(vectorsPath, "utf-8"));
  }
  console.log(`📊 Loaded ${vectorRecords.length} existing vector records.`);

  // A) Re-embed MCA department document
  const mcaDeptDoc = createStandardDocuments([mcaDept], "Department")[0];
  const mcaDeptVector = (await embeddings.embedDocuments([mcaDeptDoc.pageContent]))[0];

  let deptUpdated = false;
  vectorRecords.forEach((v) => {
    if (v.id === "chunk_102_dept_mca" || (v.metadata?.category === "Department" && v.metadata?.id === "dept_mca")) {
      v.pageContent = mcaDeptDoc.pageContent;
      v.metadata = mcaDeptDoc.metadata;
      v.vector = mcaDeptVector;
      deptUpdated = true;
    }
  });

  if (!deptUpdated) {
    vectorRecords.push({
      id: "chunk_102_dept_mca",
      pageContent: mcaDeptDoc.pageContent,
      metadata: mcaDeptDoc.metadata,
      vector: mcaDeptVector,
    });
  }
  console.log("✅ Updated chunk_102_dept_mca vector embedding (HOD: Prof. Vivek Dave).");

  // B) Re-embed modified & new faculty records
  const facultyDocs = createStandardDocuments(modifiedRecords, "Faculty");
  const facultyTexts = facultyDocs.map((d) => d.pageContent);
  console.log(`Embedding ${facultyTexts.length} faculty documents...`);
  const facultyVectors = await embeddings.embedDocuments(facultyTexts);

  const updatedIds = new Set(modifiedRecords.map((f) => f.id));

  // Remove stale chunks for these specific faculty members
  vectorRecords = vectorRecords.filter((v) => {
    const metaId = v.metadata?.id;
    return !metaId || !updatedIds.has(metaId);
  });

  // Insert refreshed chunks
  facultyDocs.forEach((doc, idx) => {
    const chunkId = `chunk_faculty_${doc.metadata?.id || idx}`;
    vectorRecords.push({
      id: chunkId,
      pageContent: doc.pageContent,
      metadata: doc.metadata || {},
      vector: facultyVectors[idx],
    });
  });

  // Write updated vectors
  fs.writeFileSync(vectorsPath, JSON.stringify(vectorRecords, null, 2), "utf-8");
  console.log(`✅ Saved ${vectorRecords.length} vector records to precomputed_vectors.json!`);
  console.log("🎉 Sync and re-embedding complete!");
}

runSync().catch((err) => {
  console.error("❌ Sync error:", err);
  process.exit(1);
});

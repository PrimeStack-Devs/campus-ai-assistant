import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSXLib from "xlsx";
const XLSX = XLSXLib.default || XLSXLib;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xlsxPath = path.resolve(__dirname, "../data/facultyInfo.xlsx");
const seedsFacultyPath = path.resolve(__dirname, "../data/seeds/faculty.json");
const dbFacultyPath = path.resolve(__dirname, "../data/db/faculty.json");
const seedsDeptsPath = path.resolve(__dirname, "../data/seeds/departments.json");
const dbDeptsPath = path.resolve(__dirname, "../data/db/departments.json");
const excelFacDirPath = path.resolve(__dirname, "../data/excel/Faculty_directory.xlsx");
const vectorsPath = path.resolve(__dirname, "../data/vectors/precomputed_vectors.json");

if (!fs.existsSync(xlsxPath)) {
  console.error(`Error: File not found at ${xlsxPath}`);
  process.exit(1);
}

// Read Excel
const workbook = XLSX.readFile(xlsxPath);
const sheetName = workbook.SheetNames[0];
const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
console.log(`📋 Read ${rawRows.length} rows from ${xlsxPath} (Sheet: "${sheetName}")`);

// Read seeds faculty
const seedsFaculty = JSON.parse(fs.readFileSync(seedsFacultyPath, "utf-8"));
console.log(`📚 Loaded ${seedsFaculty.length} existing faculty records from seeds/faculty.json`);

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
  return digits.length >= 10 ? digits : s;
}

// Known mappings for patronymic / compound Indian names in NIRF dataset
const KNOWN_NIRF_MAPPINGS = {
  "prof hardik parmar": "fac_nirf_0982", // Hardik Prabhudasparmar
  "hardik parmar": "fac_nirf_0982",
  "prof manish joshi": "fac_nirf_0433", // Manishkumarghanshyam Joshi
  "manish joshi": "fac_nirf_0433",
  "prof pratik parmar": "fac_nirf_1024", // Parmar Pratikmukeshkumar
  "pratik parmar": "fac_nirf_1024",
  "prof rinkal sarvaiya": "fac_nirf_0526", // Rinkal Dharmeshsarvaiya
  "rinkal sarvaiya": "fac_nirf_0526",
  "prof nirmit shah": "fac_nirf_0802", // Nirmitkumar Girishbhaishah
  "nirmit shah": "fac_nirf_0802",
  "prof sohil parmar": "fac_nirf_1575", // Sohil Govindbhaiparmar
  "sohil parmar": "fac_nirf_1575",
  "dr praveen tomar": "fac_nirf_1146", // Praveen Singhtomar
  "praveen tomar": "fac_nirf_1146",
  "prof vishakha n bathwar": "fac_nirf_0225", // Vishakhanarendrabhai Bathwar
  "vishakha n bathwar": "fac_nirf_0225",
  "prof vipul virsinghbhai gamit": "fac_nirf_1706", // Vipulbhai Virsinghbhaigamit
  "vipul virsinghbhai gamit": "fac_nirf_1706",
  "prof mini bhola": "fac_nirf_1114", // Bhola Minibendayabhai
  "mini bhola": "fac_nirf_1114",
  "prof madhav kapadia madhav j": "fac_nirf_1353", // Kapadiamadhavkumarjagdishbhai
  "madhav kapadia": "fac_nirf_1353",
  "prof ramadeepak": "fac_nirf_1707", // Yadagiri Ramadeepak
  "ramadeepak": "fac_nirf_1707",
  "prof tanmay shah": "fac_nirf_1648", // Tanmay Mukeshshah
  "tanmay shah": "fac_nirf_1648",
  "vijya tulsani": "fac_nirf_0234", // Vijya Ashokbhaitulsani
  "dr pallavi d khedkar": "fac_nirf_2115", // Pallavi Khedkar
  "pallavi d khedkar": "fac_nirf_2115",
  "dr ghanshyam rathod": "fac_nirf_0319", // Ghanshyamsureshbhairathod
  "ghanshyam rathod": "fac_nirf_0319",
  "dr priya swaminarayan": "fac_nirf_2229", // Priya Swaminarayan
  "priya swaminarayan": "fac_nirf_2229",
  "dr hina chokshi": "fac_nirf_2192", // Hina Chokshi
  "hina chokshi": "fac_nirf_2192",
  "prof adarsh ashok": "fac_nirf_0397", // Adarsh Ashok
  "adarsh ashok": "fac_nirf_0397",
  "prof anmol singh": "fac_nirf_1427", // Anmol Singh
  "anmol singh": "fac_nirf_1427",
  "prof niharika agarwal": "fac_nirf_0324", // Niharika Agarwal
  "niharika agarwal": "fac_nirf_0324",
  "prof aniket paul": "fac_nirf_1403", // Aniket Paul
  "aniket paul": "fac_nirf_1403",
  "dr ramachandran p": "fac_nirf_0642", // Ramachandran P
  "ramachandran p": "fac_nirf_0642",
  "dr devanshu patel": "fac_vice_chancellor", // Dr. Devanshu Patel
  "devanshu patel": "fac_vice_chancellor",
  "dr parul patel": "fac_nirf_1620", // Parul Patel
  "parul patel": "fac_nirf_1620",
  "dr kunjal sinha": "fac_nirf_2279", // Kunjal Sinha
  "kunjal sinha": "fac_nirf_2279",
  "prof vivek dave": "fac_hod_mca", // Vivek Dave
  "vivek dave": "fac_hod_mca",
};

// Build index of existing faculty
const existingById = new Map();
const existingByName = new Map();
const existingByEmail = new Map();

seedsFaculty.forEach((f, idx) => {
  existingById.set(f.id, f);
  const n = normalizeName(f.name);
  if (n && !existingByName.has(n)) existingByName.set(n, f);
  if (f.email) existingByEmail.set(cleanStr(f.email).toLowerCase(), f);
});

// Process rows and track duplicates
const updatedExistingRecords = [];
const newlyCreatedRecords = [];
const internalDuplicateRows = [];
const processedIndividuals = new Map(); // normName -> merged entry

rawRows.forEach((r, idx) => {
  const rowNum = idx + 1;
  const rawName = cleanStr(r.Name);
  if (!rawName) return;

  const normName = normalizeName(rawName);
  const category = cleanStr(r.Category);
  const rawRole = cleanStr(r["Role / Designation"]);
  const rawDept = cleanStr(r["Department / Subject / Course"]);
  const rawDetails = cleanStr(r["Assigned Division / Schedule Notes"] || r["Assigned Division / Details"]);
  const rawExt = cleanStr(r["Landline Ext."] || r["Landline Ext"]);
  const rawMob = cleanPhone(r["Mobile Number"]);
  const rawEmail = cleanStr(r["Email ID"]);

  // Extract subjects taught if present
  let subjects = [];
  if (rawDept && !rawDept.startsWith("Parul") && !rawDept.startsWith("Central") && !rawDept.startsWith("Student Affairs") && !rawDept.startsWith("Quality") && !rawDept.startsWith("PICA / FITCS") && !rawDept.startsWith("FITCS")) {
    // Looks like a subject or course
    subjects = rawDept.split("/").map(s => s.trim()).filter(Boolean);
  }

  // Check if we already processed this person earlier in this sheet (internal duplicate)
  if (processedIndividuals.has(normName)) {
    const existingEntry = processedIndividuals.get(normName);
    internalDuplicateRows.push({
      rowNum,
      name: rawName,
      category,
      duplicateOfRow: existingEntry.rowNum,
    });

    // Merge role, subjects, and divisions into existing entry
    if (category && !existingEntry.categories.includes(category)) {
      existingEntry.categories.push(category);
    }
    if (rawRole && !existingEntry.roles.includes(rawRole)) {
      existingEntry.roles.push(rawRole);
    }
    if (rawDept && !existingEntry.depts.includes(rawDept)) {
      existingEntry.depts.push(rawDept);
    }
    if (rawDetails && !existingEntry.details.includes(rawDetails)) {
      existingEntry.details.push(rawDetails);
    }
    subjects.forEach(s => {
      if (!existingEntry.subjects.includes(s)) existingEntry.subjects.push(s);
    });
    if (!existingEntry.phone && rawMob) existingEntry.phone = rawMob;
    if (!existingEntry.email && rawEmail) existingEntry.email = rawEmail;
    if (!existingEntry.ext && rawExt) existingEntry.ext = rawExt;
    return;
  }

  // Create new individual entry
  const entry = {
    rowNum,
    rawName,
    normName,
    categories: category ? [category] : [],
    roles: rawRole ? [rawRole] : [],
    depts: rawDept ? [rawDept] : [],
    details: rawDetails ? [rawDetails] : [],
    subjects: [...subjects],
    ext: rawExt,
    phone: rawMob,
    email: rawEmail,
  };

  processedIndividuals.set(normName, entry);
});

console.log(`\n🔍 Found ${internalDuplicateRows.length} internal duplicate rows in Excel sheet (consolidated into unified profiles):`);
internalDuplicateRows.forEach(d => {
  console.log(`  - Row ${d.rowNum} [${d.category}] "${d.name}" (duplicate of Row ${d.duplicateOfRow})`);
});

// Now iterate over each unique individual
for (const [normName, ind] of processedIndividuals.entries()) {
  const cleanNameLower = ind.rawName.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
  
  // 1. Check known NIRF / DB mapping
  let existing = null;
  for (const [key, targetId] of Object.entries(KNOWN_NIRF_MAPPINGS)) {
    if (cleanNameLower.includes(key) || key.includes(cleanNameLower)) {
      if (existingById.has(targetId)) {
        existing = existingById.get(targetId);
        break;
      }
    }
  }

  // 2. Check by email
  if (!existing && ind.email && existingByEmail.has(ind.email.toLowerCase())) {
    existing = existingByEmail.get(ind.email.toLowerCase());
  }

  // 3. Check by normalized name
  if (!existing && existingByName.has(normName)) {
    existing = existingByName.get(normName);
  }

  if (existing) {
    // ENRICH EXISTING RECORD WITHOUT CREATING A DUPLICATE
    const primaryCategory = ind.categories[0] || existing.category || "Faculty";
    const primaryRole = ind.roles[0] || existing.designation || "Faculty";
    const primaryDept = ind.depts[0] || existing.department_name || "Parul University";
    const divisionStr = ind.details.join("; ");

    // Update fields
    const oldName = existing.name;
    if (ind.rawName && ind.rawName.length > 3) {
      existing.name = ind.rawName;
    }
    existing.currently_working = true;
    if (ind.email) existing.email = ind.email;
    if (ind.phone) existing.phone = ind.phone;
    if (ind.ext) existing.landline_ext = ind.ext;
    if (primaryCategory) existing.category = primaryCategory;
    if (primaryDept && (existing.department_name === "Academic Faculty" || !existing.department_name)) {
      existing.department_name = primaryDept;
    }
    
    // Update designation if it's more descriptive or leadership
    if (existing.id === "fac_vice_chancellor") {
      existing.designation = "President";
      existing.role = "administration";
      existing.department_name = "Parul University / Central Administration";
    } else if (existing.id === "fac_hod_mca") {
      existing.designation = "Head of Department (MCA)";
      existing.department_name = "Master of Computer Application (MCA) / PICA";
    } else if (primaryCategory.includes("Leadership")) {
      existing.designation = primaryRole;
      existing.role = "leadership";
    }

    if (ind.subjects.length > 0) {
      const existingSubjects = existing.subjects_taught || [];
      const combined = Array.from(new Set([...existingSubjects, ...ind.subjects]));
      existing.subjects_taught = combined;
    }

    if (divisionStr) {
      existing.assigned_divisions = divisionStr;
    }

    // Build comprehensive description
    const descParts = [];
    if (existing.designation && existing.department_name) {
      descParts.push(`${existing.designation} in ${existing.department_name} at Parul University.`);
    }
    if (divisionStr) {
      descParts.push(`Assigned Divisions / Notes: ${divisionStr}.`);
    }
    if (existing.subjects_taught && existing.subjects_taught.length > 0) {
      descParts.push(`Subjects: ${existing.subjects_taught.join(", ")}.`);
    }
    if (existing.phone) {
      descParts.push(`Contact: +91-${existing.phone}.`);
    }
    if (existing.landline_ext) {
      descParts.push(`Landline Ext: ${existing.landline_ext}.`);
    }
    if (existing.email) {
      descParts.push(`Email: ${existing.email}.`);
    }

    if (descParts.length > 0) {
      existing.description = descParts.join(" ");
    }

    // Update aliases
    const aliasesSet = new Set(existing.aliases || []);
    if (oldName) aliasesSet.add(oldName.toLowerCase());
    aliasesSet.add(ind.rawName.toLowerCase());
    aliasesSet.add(ind.rawName.toLowerCase().replace(/^(dr\.|prof\.)\s*/, ""));
    ind.subjects.forEach(s => aliasesSet.add(s.toLowerCase()));
    if (existing.designation) aliasesSet.add(existing.designation.toLowerCase());
    existing.aliases = Array.from(aliasesSet);

    updatedExistingRecords.push({
      id: existing.id,
      name: existing.name,
      designation: existing.designation,
      email: existing.email,
      phone: existing.phone,
    });
  } else {
    // CREATE BRAND NEW RECORD
    const primaryCategory = ind.categories[0] || "Faculty";
    const primaryRole = ind.roles[0] || "Faculty";
    const primaryDept = ind.depts[0] || "Parul University";
    const divisionStr = ind.details.join("; ");

    const idSuffix = ind.rawName
      .toLowerCase()
      .replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/gi, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    
    let prefix = "fac";
    if (primaryCategory.includes("Central Leadership")) prefix = "fac_leadership";
    else if (primaryCategory.includes("Institute Leadership")) prefix = "fac_inst_lead";
    else if (primaryCategory.includes("Mentor")) prefix = "fac_mentor";
    else if (primaryCategory.includes("Instructor")) prefix = "fac_instructor";
    else prefix = "fac_pica";

    const newId = `${prefix}_${idSuffix}`;

    const descParts = [
      `${primaryRole} in ${primaryDept} at Parul University.`
    ];
    if (divisionStr) descParts.push(`Assigned: ${divisionStr}.`);
    if (ind.subjects.length > 0) descParts.push(`Subjects: ${ind.subjects.join(", ")}.`);
    if (ind.phone) descParts.push(`Mobile: +91-${ind.phone}.`);
    if (ind.ext) descParts.push(`Landline Ext: ${ind.ext}.`);
    if (ind.email) descParts.push(`Email: ${ind.email}.`);

    const aliases = [
      ind.rawName.toLowerCase(),
      ind.rawName.toLowerCase().replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/gi, ""),
      primaryRole.toLowerCase(),
      primaryDept.toLowerCase(),
      ...ind.subjects.map(s => s.toLowerCase()),
    ];

    const newRecord = {
      id: newId,
      name: ind.rawName,
      role: primaryCategory.includes("Leadership") ? "leadership" : (primaryCategory.includes("Instructor") ? "instructor" : (primaryCategory.includes("Mentor") ? "mentor" : "faculty")),
      category: primaryCategory,
      designation: primaryRole,
      department_name: primaryDept,
      department_id: primaryDept.toLowerCase().includes("mca") ? "dept_mca" : (primaryDept.toLowerCase().includes("pica") ? "dept_bca" : null),
      building_name: primaryDept.toLowerCase().includes("pica") || primaryDept.toLowerCase().includes("fitcs") ? "C.V. Raman Centre" : (primaryCategory.includes("Central") ? "Administrative Block C1" : null),
      assigned_divisions: divisionStr || null,
      landline_ext: ind.ext || null,
      phone: ind.phone || null,
      email: ind.email || null,
      subjects_taught: ind.subjects,
      currently_working: true,
      aliases: Array.from(new Set(aliases.filter(Boolean))),
      description: descParts.join(" "),
    };

    newlyCreatedRecords.push(newRecord);
    seedsFaculty.push(newRecord);
    existingById.set(newId, newRecord);
  }
}

console.log(`\n✨ SUMMARY:`);
console.log(`- Total unique individuals in sheet: ${processedIndividuals.size}`);
console.log(`- Enriched existing records (ignoring duplicate creations): ${updatedExistingRecords.length}`);
console.log(`- Brand new records added: ${newlyCreatedRecords.length}`);
console.log(`- Total records in faculty.json now: ${seedsFaculty.length}`);

// Persist to seeds/faculty.json and db/faculty.json
fs.writeFileSync(seedsFacultyPath, JSON.stringify(seedsFaculty, null, 2), "utf-8");
fs.writeFileSync(dbFacultyPath, JSON.stringify(seedsFaculty, null, 2), "utf-8");
console.log(`✅ Saved updated faculty data to seeds/faculty.json & db/faculty.json`);

// Also update MCA HOD in departments.json
if (fs.existsSync(seedsDeptsPath)) {
  const depts = JSON.parse(fs.readFileSync(seedsDeptsPath, "utf-8"));
  const mcaDept = depts.find(d => d.id === "dept_mca");
  if (mcaDept) {
    mcaDept.hod = {
      name: "Prof. Vivek Dave",
      room: "501",
      email: "vivek.dave@paruluniversity.ac.in",
      phone: "8128313699",
    };
    fs.writeFileSync(seedsDeptsPath, JSON.stringify(depts, null, 2), "utf-8");
    fs.writeFileSync(dbDeptsPath, JSON.stringify(depts, null, 2), "utf-8");
    console.log(`✅ Updated MCA Department HOD in departments.json`);
  }
}

// Update Faculty_directory.xlsx if present
if (fs.existsSync(excelFacDirPath)) {
  const wb = XLSX.readFile(excelFacDirPath);
  const sheetName = wb.SheetNames[0] || "Faculty_directory";
  const existingRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
  const existingExcelEmails = new Set(existingRows.map(r => cleanStr(r.Email).toLowerCase()).filter(Boolean));
  const existingExcelNames = new Set(existingRows.map(r => normalizeName(r["Name*"] || r.Name)).filter(Boolean));

  let addedToExcelCount = 0;
  for (const [normName, ind] of processedIndividuals.entries()) {
    const hasEmail = ind.email && existingExcelEmails.has(ind.email.toLowerCase());
    const hasName = existingExcelNames.has(normName);
    if (!hasEmail && !hasName) {
      existingRows.push({
        "Name*": ind.rawName,
        "Designation*": ind.roles[0] || "Faculty",
        "Department*": ind.depts[0] || "FITCS / PICA",
        "Building Code*": "A25",
        "Floor": "",
        "Cabin/Room": "",
        "Email": ind.email || "",
        "Phone": ind.phone ? `+91${ind.phone}` : "",
        "Subjects Taught": ind.subjects.join(", "),
        "Source Faculty ID": `FAC_REAL_${String(existingRows.length + 1).padStart(3, "0")}`,
        "Source Role": ind.categories[0] || "Faculty",
      });
      addedToExcelCount++;
    }
  }

  const updatedWs = XLSX.utils.json_to_sheet(existingRows);
  wb.Sheets[sheetName] = updatedWs;
  XLSX.writeFile(wb, excelFacDirPath);
  console.log(`✅ Appended ${addedToExcelCount} entries to Faculty_directory.xlsx (total: ${existingRows.length})`);
}

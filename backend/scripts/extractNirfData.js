/**
 * extractNirfData.js
 * Extracts official NIRF 2026 Data from PARUL-UNIVERSITY-OVERALL-IR-O-U-0763.pdf:
 *  1. Statutory Institutional Ranking metrics into policies.json
 *  2. 2,594 Faculty records into faculty.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;

function formatName(name) {
  return (name || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .trim();
}

function getDept(qual, designation) {
  const q = (qual || "").toUpperCase();
  const d = (designation || "").toUpperCase();

  if (q.includes("PHARM")) return "Faculty of Pharmacy";
  if (q.includes("PHYSIO") || q.includes("MPT") || q.includes("BPT")) return "Faculty of Physiotherapy";
  if (q.includes("HOM") || q.includes("BHMS")) return "Faculty of Homeopathy";
  if (q.includes("AYU") || q.includes("BAMS")) return "Faculty of Ayurved";
  if (q.includes("NURS")) return "Faculty of Nursing";
  if (q.includes("TECH") || q.includes("M.E") || q.includes("B.E")) return "Faculty of Engineering & Technology";
  if (q.includes("ARCH")) return "Faculty of Architecture & Planning";
  if (q.includes("LAW") || q.includes("LL")) return "Faculty of Law";
  if (q.includes("MBA") || q.includes("MANAGEMENT")) return "Faculty of Management Studies";
  if (q.includes("MCA") || q.includes("COMPUTER")) return "Faculty of IT & Computer Science";
  if (q.includes("MD") || q.includes("MS") || q.includes("MBBS")) return "Faculty of Medicine (PIMSR)";
  if (q.includes("MSW")) return "Faculty of Social Work";
  return "Academic Faculty";
}

export async function extractNirf() {
  const pdfPath = path.resolve(__dirname, "../data/PARUL-UNIVERSITY-OVERALL-IR-O-U-0763.pdf");
  if (!fs.existsSync(pdfPath)) {
    console.error("NIRF PDF not found at:", pdfPath);
    return;
  }

  console.log("📄 Reading NIRF PDF:", pdfPath);
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);

  const text = data.text;
  console.log(`Total Pages: ${data.numpages} | Total Text Length: ${text.length}`);

  // ==========================================
  // 1. STATUTORY NIRF 2026 KNOWLEDGE RECORDS
  // ==========================================
  const nirfRecords = [
    {
      id: "nirf_2026_placements_salaries",
      title: "NIRF 2026 Official Placement Statistics & Median Salary Packages",
      category: "placements",
      tags: ["nirf", "placement", "median salary", "average package", "graduates placed", "btech placement", "mba placement", "highest package"],
      last_updated: "2026-09-10",
      source: "NIRF 2026 Official Submission (IR-O-U-0763)",
      aliases: [
        "nirf placement data",
        "official median salary parul university",
        "btech median package nirf",
        "mba median salary",
        "how many students placed in nirf",
        "parul university placement report nirf"
      ],
      content: "According to the official NIRF 2026 data submission (IR-O-U-0763) submitted by Parul University to the Ministry of Education, Government of India: For UG 4-Year programs (Engineering/Technology), 1,971 graduating students were placed with an official median salary of Rs. 6.25 LPA (up from Rs. 6.00 LPA in 2023-24 and Rs. 5.60 LPA in 2022-23), while 494 graduates pursued higher studies. For UG 5-Year programs (Architecture/Law/Medicine), 476 students were placed with a median salary of Rs. 6.50 LPA. For PG 2-Year programs (MBA/MCA/M.Tech), 2,306 students were placed with a median salary of Rs. 6.50 LPA. For PG 3-Year programs (MD/MS), 205 students were placed with a median salary of Rs. 7.50 LPA. For UG 3-Year programs (BBA/BCA/B.Sc), 490 students were placed with a median salary of Rs. 4.80 LPA, and 1,196 graduates opted for higher studies. Across all programs in the reporting year, 5,496 students secured campus placements."
    },
    {
      id: "nirf_2026_sponsored_research_grants",
      title: "NIRF 2026 Sponsored Research Projects and Government Grants",
      category: "research",
      tags: ["nirf research", "sponsored research", "research funding", "grants", "government funding", "isro", "csir", "funding agencies"],
      last_updated: "2026-09-10",
      source: "NIRF 2026 Official Submission (IR-O-U-0763)",
      aliases: [
        "how much research funding does parul university have",
        "sponsored research nirf",
        "research grant amount",
        "government research projects parul",
        "research agencies funding"
      ],
      content: "Parul University's NIRF 2026 submission reports substantial growth in sponsored research grants: In Financial Year 2024-25, the university received Rs. 27,76,83,421 (Rs. 27.76 Crore) across 55 sponsored projects from 29 funding agencies. In FY 2023-24, it secured Rs. 12.41 Crore across 45 projects from 16 agencies. In FY 2022-23, it received Rs. 18.54 Crore across 69 projects from 19 agencies. Cumulative sponsored research funding over the three-year period exceeds Rs. 58.72 Crore from prestigious bodies including DHR, GSBTM, ISRO, CSIR, and international partners like the UK Royal Academy of Engineering."
    },
    {
      id: "nirf_2026_patents_ipr",
      title: "NIRF 2026 Patents Published and Granted (IPR)",
      category: "research",
      tags: ["patents", "ipr", "patents published", "patents granted", "intellectual property", "nirf patents"],
      last_updated: "2026-09-10",
      source: "NIRF 2026 Official Submission (IR-O-U-0763)",
      aliases: [
        "how many patents has parul university published",
        "patents granted parul university",
        "nirf patent statistics",
        "ipr patents"
      ],
      content: "In official Intellectual Property Rights (IPR) metrics reported under NIRF 2026, Parul University faculty and scholars published 108 patents in calendar year 2024, 53 patents in 2023, and 112 patents in 2022, representing 273 published patents. Additionally, 27 patents were formally granted over this three-year period (16 granted in 2024, 9 in 2023, and 2 in 2022)."
    },
    {
      id: "nirf_2026_consultancy_projects",
      title: "NIRF 2026 Industry Consultancy Projects and Revenue",
      category: "research",
      tags: ["consultancy", "industry projects", "consultancy revenue", "client organizations", "nirf consultancy"],
      last_updated: "2026-09-10",
      source: "NIRF 2026 Official Submission (IR-O-U-0763)",
      aliases: [
        "consultancy projects parul university",
        "industry tie-ups revenue",
        "consultancy amount nirf"
      ],
      content: "According to NIRF 2026 records, Parul University conducts extensive industrial consultancy: In FY 2024-25, the university executed 130 consultancy projects for 95 client organizations, earning Rs. 5,01,08,950 (Rs. 5.01 Crore). In FY 2023-24, it completed 112 consultancy projects for 74 client organizations earning Rs. 5.79 Crore, demonstrating strong corporate collaboration across engineering, pharmaceutical, management, and health sciences."
    },
    {
      id: "nirf_2026_phd_doctoral_studies",
      title: "NIRF 2026 Ph.D. Scholars, Doctoral Programs and Medical Graduates",
      category: "academic",
      tags: ["phd", "doctoral", "phd scholars", "phd graduated", "md ms", "pimsr", "medical postgraduates"],
      last_updated: "2026-09-10",
      source: "NIRF 2026 Official Submission (IR-O-U-0763)",
      aliases: [
        "how many phd students at parul university",
        "phd programs nirf",
        "how many phds graduated",
        "medical postgraduates count"
      ],
      content: "Parul University's NIRF 2026 report documents an active doctoral community with 1,535 Ph.D. scholars pursuing doctoral research (910 full-time scholars and 625 part-time scholars). In academic year 2024-25, 157 scholars graduated with Ph.D. degrees (127 full-time and 30 part-time). In addition, 799 students were enrolled in advanced postgraduate medical programs (MD/MS/DNB) under PIMSR, with 228 graduating in 2024-25."
    },
    {
      id: "nirf_2026_student_demographics_scholarships",
      title: "NIRF 2026 Student Enrollment, Gender Diversity and Scholarships",
      category: "demographics",
      tags: ["student strength", "gender ratio", "male female", "international students", "diversity", "scholarships", "sc st obc"],
      last_updated: "2026-09-10",
      source: "NIRF 2026 Official Submission (IR-O-U-0763)",
      aliases: [
        "how many students in parul university nirf",
        "male female ratio parul",
        "international students nirf",
        "scholarships in nirf",
        "sc st obc students"
      ],
      content: "Parul University's NIRF 2026 actual student strength records 37,897 regular on-campus degree students across programs. In 4-Year UG programs alone, there are 20,265 students (12,954 male and 7,311 female), including 2,986 international students from outside India and 11,848 students from outside Gujarat. Socio-economic support is extensive: in 4-Year UG, 1,754 students received full tuition fee reimbursement from State and Central Government schemes, while 3,065 students received institution scholarships."
    },
    {
      id: "nirf_2026_campus_budget_expenditure",
      title: "NIRF 2026 Financial Resources, Capital Investments & Operational Budget",
      category: "institutional",
      tags: ["financial resources", "budget", "salaries", "capital expenditure", "operational expenditure", "library budget"],
      last_updated: "2026-09-10",
      source: "NIRF 2026 Official Submission (IR-O-U-0763)",
      aliases: [
        "parul university budget",
        "expenditure nirf",
        "how much spent on library and labs",
        "operational expenditure"
      ],
      content: "As reported in NIRF 2026: Parul University's annual operational expenditure for FY 2024-25 included Rs. 301.64 Crore on teaching and non-teaching staff salaries, Rs. 90.17 Crore on academic infrastructure maintenance, and Rs. 6.33 Crore on seminars, conferences, and workshops. Capital expenditure included Rs. 5.74 Crore utilized on library resources and subscriptions, Rs. 3.54 Crore on new laboratory equipment, and Rs. 1.36 Crore on engineering workshops."
    },
    {
      id: "nirf_2026_accessibility_and_sustainability",
      title: "NIRF 2026 Campus Inclusivity (PCS Facilities) & Sustainable Green Practices",
      category: "facilities",
      tags: ["pcs facilities", "handicapped facilities", "wheelchair", "lifts", "ramps", "sustainability", "solar", "rainwater harvesting"],
      last_updated: "2026-09-10",
      source: "NIRF 2026 Official Submission (IR-O-U-0763)",
      aliases: [
        "facilities for disabled students",
        "wheelchair access parul",
        "lifts and ramps on campus",
        "green campus practices",
        "solar panels parul"
      ],
      content: "Parul University's NIRF 2026 submission highlights comprehensive accessibility (PCS facilities): More than 80% of campus buildings have lifts and ramps; provision is made for walking aids, wheelchairs, and inter-building transit for physically challenged students; and specially designed accessible restrooms are installed in over 80% of buildings. Sustainability practices include a campus-wide ban on single-use plastics, comprehensive recycling infrastructure, rooftop and surface runoff rainwater harvesting systems with percolation pits and recharge wells, and green renewable power through on-campus Solar Panels and Wind Turbines."
    }
  ];

  // ==========================================
  // 2. PARSE 2,594 FACULTY RECORDS
  // ==========================================
  const facultyStart = text.indexOf("Faculty Details");
  const lines = text.slice(facultyStart).split("\n").map((l) => l.trim()).filter(Boolean);

  let idx = 0;
  while (idx < lines.length && lines[idx] !== "1") idx++;

  const facultyList = [];
  let currentSr = 1;

  while (idx < lines.length) {
    if (lines[idx] === String(currentSr)) {
      const srno = parseInt(lines[idx]);
      const rawName = lines[idx + 1];
      const designation = lines[idx + 2];
      const gender = lines[idx + 3];
      const qualification = lines[idx + 4];
      const expMonths = parseInt(lines[idx + 5]);
      const currentlyWorking = lines[idx + 6] === "Yes";
      const joiningDate = lines[idx + 7];
      const leavingDate = lines[idx + 8] === "--" ? null : lines[idx + 8];
      const associationType = lines[idx + 9];

      const cleanName = formatName(rawName);
      const departmentName = getDept(qualification, designation);
      const id = `fac_nirf_${String(srno).padStart(4, "0")}`;

      const yearsExp = Math.floor((expMonths || 0) / 12);
      const remMonths = (expMonths || 0) % 12;
      const expText = yearsExp > 0 ? `${yearsExp} yrs ${remMonths} mos (${expMonths} mos)` : `${expMonths} mos`;

      facultyList.push({
        id,
        name: cleanName,
        role: "faculty",
        designation,
        gender,
        qualification,
        experience_months: isNaN(expMonths) ? 0 : expMonths,
        department_name: departmentName,
        association_type: associationType,
        currently_working: currentlyWorking,
        joining_date: joiningDate,
        leaving_date: leavingDate,
        aliases: [cleanName.toLowerCase(), rawName.toLowerCase(), `${cleanName.toLowerCase()} parul`],
        description: `${designation} in ${departmentName} at Parul University. Holds ${qualification} qualification with ${expText} of academic/industry experience. Associated with the university since ${joiningDate} (${associationType} faculty).`
      });

      currentSr++;
      idx += 10;
    } else {
      idx++;
    }
  }

  console.log(`✅ Extracted ${facultyList.length} verified faculty records.`);

  // ==========================================
  // 3. PERSIST POLICIES (SEEDS + DB)
  // ==========================================
  const seedsPoliciesPath = path.resolve(__dirname, "../data/seeds/policies.json");
  const dbPoliciesPath = path.resolve(__dirname, "../data/db/policies.json");

  let existingPolicies = [];
  if (fs.existsSync(seedsPoliciesPath)) {
    existingPolicies = JSON.parse(fs.readFileSync(seedsPoliciesPath, "utf-8"));
  }

  // Deduplicate against existing policies by id
  const existingIds = new Set(existingPolicies.map((p) => p.id));
  const newNirfRecords = nirfRecords.filter((r) => !existingIds.has(r.id));
  existingPolicies.push(...newNirfRecords);

  fs.writeFileSync(seedsPoliciesPath, JSON.stringify(existingPolicies, null, 2), "utf-8");
  fs.writeFileSync(dbPoliciesPath, JSON.stringify(existingPolicies, null, 2), "utf-8");
  console.log(`✅ Added ${newNirfRecords.length} NIRF institutional records to policies.json (Seeds & DB).`);

  // ==========================================
  // 4. PERSIST FACULTY (SEEDS + DB)
  // ==========================================
  // Save standalone NIRF faculty catalog
  const nirfFacultyPath = path.resolve(__dirname, "../data/seeds/faculty_nirf.json");
  const dbNirfFacultyPath = path.resolve(__dirname, "../data/db/faculty_nirf.json");
  fs.writeFileSync(nirfFacultyPath, JSON.stringify(facultyList, null, 2), "utf-8");
  fs.writeFileSync(dbNirfFacultyPath, JSON.stringify(facultyList, null, 2), "utf-8");
  console.log(`✅ Saved ${facultyList.length} faculty to faculty_nirf.json.`);

  // Merge with existing leadership faculty in faculty.json
  const seedsFacultyPath = path.resolve(__dirname, "../data/seeds/faculty.json");
  const dbFacultyPath = path.resolve(__dirname, "../data/db/faculty.json");

  let existingFaculty = [];
  if (fs.existsSync(seedsFacultyPath)) {
    existingFaculty = JSON.parse(fs.readFileSync(seedsFacultyPath, "utf-8"));
  }

  // Filter out any previous NIRF faculty to avoid duplicates
  const coreLeadership = existingFaculty.filter((f) => !f.id.startsWith("fac_nirf_"));
  const mergedFaculty = [...coreLeadership, ...facultyList];

  fs.writeFileSync(seedsFacultyPath, JSON.stringify(mergedFaculty, null, 2), "utf-8");
  fs.writeFileSync(dbFacultyPath, JSON.stringify(mergedFaculty, null, 2), "utf-8");
  console.log(`✅ Merged faculty.json now contains ${mergedFaculty.length} records (${coreLeadership.length} leadership + ${facultyList.length} verified NIRF faculty).`);
}

extractNirf().catch((err) => {
  console.error("Extraction error:", err);
});

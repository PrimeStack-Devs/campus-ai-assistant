import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSXLib from "xlsx";
const XLSX = XLSXLib.default || XLSXLib;
import { embeddings } from "../services/v2/vector/embeddings.js";
import { createStandardDocuments } from "../services/v2/vector/documents/documentFactory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedsFacultyPath = path.resolve(__dirname, "../data/seeds/faculty.json");
const vectorsPath = path.resolve(__dirname, "../data/vectors/precomputed_vectors.json");

async function updateFacultyVectors() {
  console.log("⚡ Starting Faculty Vector Embeddings Update...");

  if (!fs.existsSync(seedsFacultyPath)) {
    console.error("seeds/faculty.json not found!");
    process.exit(1);
  }

  const allFaculty = JSON.parse(fs.readFileSync(seedsFacultyPath, "utf-8"));
  
  // Find all records that are either newly added (id contains "fac_") or enriched
  // Specifically the 48 individuals from our import
  const targetIds = [
    // Central Leadership
    "fac_vice_chancellor", "fac_nirf_1620", "fac_vp_komal_patel", "fac_vp_geetika_patel",
    "fac_bom_vinod_patel", "fac_mgmt_arvind_patel", "fac_provost_madhusoodanan",
    "fac_nirf_2279", "fac_leadership_manish_pandya", "fac_leadership_babita_chaube",
    // Institute Leadership
    "fac_nirf_2229", "fac_nirf_2115", "fac_nirf_2192", "fac_hod_mca", "fac_nirf_0319",
    // Mentors & Subject Faculty
    "fac_mentor_saikat_parmanik", "fac_mentor_himanshu_yadav", "fac_nirf_0234",
    "fac_mentor_payal_parekh", "fac_nirf_0397", "fac_nirf_0802", "fac_nirf_1648",
    "fac_mentor_sahil_kumar", "fac_mentor_pratik_raj", "fac_mentor_jatin_morwal",
    "fac_nirf_1427", "fac_nirf_0982", "fac_nirf_0433", "fac_nirf_1024",
    "fac_pica_lakshya_namdeo", "fac_pica_pritam_samanta", "fac_nirf_0526",
    "fac_nirf_0324", "fac_pica_harsh_kumar", "fac_pica_dipti_sharma",
    "fac_nirf_1575", "fac_nirf_1146", "fac_nirf_1403", "fac_pica_satya_mani_gayathri_devi",
    "fac_nirf_0225", "fac_nirf_1706", "fac_nirf_1114", "fac_nirf_1353",
    "fac_pica_sathibabu_nargani", "fac_nirf_0642",
    // Instructors
    "fac_instructor_ashutosh_gautam", "fac_instructor_mukeshkumar_tyagi", "fac_nirf_1707"
  ];

  const xlsxPath = path.resolve(__dirname, "../data/facultyInfo.xlsx");
  const wb = XLSX.readFile(xlsxPath);
  const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  
  function norm(s) {
    return String(s || "").toLowerCase().replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/gi, "").replace(/[^a-z0-9]/g, "");
  }

  const sheetNames = new Set(rawRows.map(r => norm(r.Name)).filter(Boolean));
  console.log(`Sheet has ${sheetNames.size} distinct normalized names.`);

  const facultyToEmbed = allFaculty.filter(f => {
    return sheetNames.has(norm(f.name)) || f.category !== undefined;
  });
  console.log(`Found ${facultyToEmbed.length} matching faculty records to embed.`);

  const docs = createStandardDocuments(facultyToEmbed, "Faculty");
  console.log(`Created ${docs.length} document representations.`);

  const texts = docs.map(d => d.pageContent);
  console.log("Generating vector embeddings (all-MiniLM-L6-v2)...");
  const vectors = await embeddings.embedDocuments(texts);
  console.log(`Generated ${vectors.length} vector embeddings.`);

  let vectorData = [];
  if (fs.existsSync(vectorsPath)) {
    vectorData = JSON.parse(fs.readFileSync(vectorsPath, "utf-8"));
  }

  // Deduplicate by metadata.id or r.id
  const targetMetaIds = new Set(facultyToEmbed.map(f => f.id));
  const seenIds = new Set();
  const filteredVectors = [];

  vectorData.forEach(v => {
    const metaId = v.metadata?.id;
    if (metaId && targetMetaIds.has(metaId)) return;
    if (seenIds.has(v.id)) return;
    seenIds.add(v.id);
    filteredVectors.push(v);
  });

  docs.forEach((doc, idx) => {
    const chunkId = `chunk_faculty_${doc.metadata?.id || idx}`;
    if (!seenIds.has(chunkId)) {
      seenIds.add(chunkId);
      filteredVectors.push({
        id: chunkId,
        pageContent: doc.pageContent,
        metadata: doc.metadata || {},
        vector: vectors[idx],
      });
    }
  });

  fs.writeFileSync(vectorsPath, JSON.stringify(filteredVectors, null, 2), "utf-8");
  console.log(`✅ Updated precomputed_vectors.json! Total vector chunks: ${filteredVectors.length}`);
}

updateFacultyVectors().catch(err => {
  console.error("Vector update error:", err);
});

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
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
import { embeddings } from "../services/v2/vector/embeddings.js";
import { loadCampusDataDocuments } from "../services/v2/vector/loaders/campusDataLoader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function seedData() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await connectDB();

    const dataDir = path.resolve(__dirname, "../campus-data");

    // 1. Buildings
    const buildingsPath = path.join(dataDir, "buildings.json");
    if (fs.existsSync(buildingsPath)) {
      const buildings = JSON.parse(fs.readFileSync(buildingsPath, "utf-8"));
      await CampusBuilding.deleteMany({});
      await CampusBuilding.insertMany(buildings);
      console.log(`✅ Seeded ${buildings.length} buildings.`);
    }

    // 2. Departments
    const departmentsPath = path.join(dataDir, "departments.json");
    if (fs.existsSync(departmentsPath)) {
      const departments = JSON.parse(fs.readFileSync(departmentsPath, "utf-8"));
      await CampusDepartment.deleteMany({});
      await CampusDepartment.insertMany(departments);
      console.log(`✅ Seeded ${departments.length} departments.`);
    }

    // 3. Faculty
    const facultyPath = path.join(dataDir, "faculty.json");
    if (fs.existsSync(facultyPath)) {
      const faculty = JSON.parse(fs.readFileSync(facultyPath, "utf-8"));
      await CampusFaculty.deleteMany({});
      await CampusFaculty.insertMany(faculty);
      console.log(`✅ Seeded ${faculty.length} faculty members.`);
    }

    // 4. Facilities
    const facilitiesPath = path.join(dataDir, "facilities.json");
    if (fs.existsSync(facilitiesPath)) {
      const facilities = JSON.parse(fs.readFileSync(facilitiesPath, "utf-8"));
      await CampusFacility.deleteMany({});
      await CampusFacility.insertMany(facilities);
      console.log(`✅ Seeded ${facilities.length} facilities.`);
    }

    // Quick Locations (locations.json)
    const locationsPath = path.resolve(__dirname, "../data/locations.json");
    if (fs.existsSync(locationsPath)) {
      const locations = JSON.parse(fs.readFileSync(locationsPath, "utf-8"));
      const locEntities = Object.entries(locations).map(([name, desc], i) => ({
        id: `loc_quick_${i + 1}`,
        label: name,
        type: "quick_location",
        notes: desc,
        aliases: [name.toLowerCase()],
      }));
      await CampusFacility.insertMany(locEntities);
      console.log(`✅ Seeded ${locEntities.length} quick locations.`);
    }

    // 5. Services
    const servicesPath = path.join(dataDir, "services.json");
    if (fs.existsSync(servicesPath)) {
      const services = JSON.parse(fs.readFileSync(servicesPath, "utf-8"));
      await CampusService.deleteMany({});
      await CampusService.insertMany(services);
      console.log(`✅ Seeded ${services.length} services.`);
    }

    // 6. Schedules
    const schedulesPath = path.join(dataDir, "schedules.json");
    if (fs.existsSync(schedulesPath)) {
      const rawSchedules = JSON.parse(fs.readFileSync(schedulesPath, "utf-8"));
      const busRoutes = rawSchedules.bus_routes || [];
      await CampusSchedule.deleteMany({});
      if (busRoutes.length) {
        await CampusSchedule.insertMany(busRoutes);
      }
      console.log(`✅ Seeded ${busRoutes.length} bus schedules.`);
    }

    // 7. Policies
    const policiesPath = path.join(dataDir, "policies.json");
    if (fs.existsSync(policiesPath)) {
      const policies = JSON.parse(fs.readFileSync(policiesPath, "utf-8"));
      await CampusPolicy.deleteMany({});
      await CampusPolicy.insertMany(policies);
      console.log(`✅ Seeded ${policies.length} policies.`);
    }

    // 8. Paths & Route Summaries
    const pathsPath = path.join(dataDir, "paths.json");
    if (fs.existsSync(pathsPath)) {
      const rawPaths = JSON.parse(fs.readFileSync(pathsPath, "utf-8"));
      const paths = rawPaths.paths || [];
      const summaries = rawPaths.route_summaries || [];

      await CampusPath.deleteMany({});
      if (paths.length) {
        await CampusPath.insertMany(paths);
      }

      await CampusRouteSummary.deleteMany({});
      if (summaries.length) {
        await CampusRouteSummary.insertMany(summaries);
      }

      console.log(
        `✅ Seeded ${paths.length} paths and ${summaries.length} route summaries.`
      );
    }

    // 9. Pre-calculate and Seed Vector Chunks
    console.log("🧠 Preparing documents for vector embeddings...");
    const allDocs = loadCampusDataDocuments();
    console.log(`Generating embeddings for ${allDocs.length} documents...`);

    await VectorChunk.deleteMany({});

    const batchSize = 16;
    let insertedCount = 0;

    for (let i = 0; i < allDocs.length; i += batchSize) {
      const batch = allDocs.slice(i, i + batchSize);
      const texts = batch.map((doc) => doc.pageContent);
      const vectorList = await embeddings.embedDocuments(texts);

      const chunkDocs = batch.map((doc, idx) => ({
        chunkId: `chunk_${i + idx}_${doc.metadata?.id || "doc"}`,
        content: doc.pageContent,
        category: doc.metadata?.category || "General",
        sourceId: doc.metadata?.id ? String(doc.metadata.id) : null,
        metadata: doc.metadata || {},
        embedding: vectorList[idx],
      }));

      await VectorChunk.insertMany(chunkDocs);
      insertedCount += chunkDocs.length;
      process.stdout.write(
        `\rEmbedded & stored ${insertedCount}/${allDocs.length} chunks...`
      );
    }

    console.log(`\n🎉 Vector database seeded successfully! (${insertedCount} vectors)`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedData();

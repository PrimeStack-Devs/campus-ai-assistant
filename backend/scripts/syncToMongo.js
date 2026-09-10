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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

export async function syncAllDataToMongo() {
  const startTime = Date.now();
  console.log("🚀 Connecting to MongoDB Atlas...");
  await connectDB();

  const dbDir = path.resolve(__dirname, "../data/db");
  const summary = {};

  // 1. Buildings (from Buildings.xlsx)
  const buildingsPath = path.join(dbDir, "buildings.json");
  if (fs.existsSync(buildingsPath)) {
    const buildings = JSON.parse(fs.readFileSync(buildingsPath, "utf-8"));
    await CampusBuilding.deleteMany({});
    if (buildings.length) {
      await CampusBuilding.insertMany(buildings);
    }
    summary.buildings = buildings.length;
    console.log(`✅ Synced ${buildings.length} buildings to MongoDB.`);
  }

  // 2. Departments (from Departments.xlsx)
  const departmentsPath = path.join(dbDir, "departments.json");
  if (fs.existsSync(departmentsPath)) {
    const departments = JSON.parse(fs.readFileSync(departmentsPath, "utf-8"));
    await CampusDepartment.deleteMany({});
    if (departments.length) {
      await CampusDepartment.insertMany(departments);
    }
    summary.departments = departments.length;
    console.log(`✅ Synced ${departments.length} departments to MongoDB.`);
  }

  // 3. Faculty (from Faculty_directory.xlsx)
  const facultyPath = path.join(dbDir, "faculty.json");
  if (fs.existsSync(facultyPath)) {
    const faculty = JSON.parse(fs.readFileSync(facultyPath, "utf-8"));
    await CampusFaculty.deleteMany({});
    if (faculty.length) {
      await CampusFaculty.insertMany(faculty);
    }
    summary.faculty = faculty.length;
    console.log(`✅ Synced ${faculty.length} faculty members to MongoDB.`);
  }

  // 4. Facilities (from Locations_and_Facilities.xlsx)
  const facilitiesPath = path.join(dbDir, "facilities.json");
  if (fs.existsSync(facilitiesPath)) {
    const facilities = JSON.parse(fs.readFileSync(facilitiesPath, "utf-8"));
    await CampusFacility.deleteMany({});
    if (facilities.length) {
      await CampusFacility.insertMany(facilities);
    }
    summary.facilities = facilities.length;
    console.log(`✅ Synced ${facilities.length} facilities to MongoDB.`);
  }

  // 5. Services (from Services.xlsx)
  const servicesPath = path.join(dbDir, "services.json");
  if (fs.existsSync(servicesPath)) {
    const services = JSON.parse(fs.readFileSync(servicesPath, "utf-8"));
    await CampusService.deleteMany({});
    if (services.length) {
      await CampusService.insertMany(services);
    }
    summary.services = services.length;
    console.log(`✅ Synced ${services.length} services to MongoDB.`);
  }

  // 6. Schedules (from Schedules.xlsx)
  const schedulesPath = path.join(dbDir, "schedules.json");
  if (fs.existsSync(schedulesPath)) {
    const rawSchedules = JSON.parse(fs.readFileSync(schedulesPath, "utf-8"));
    const busRoutes = rawSchedules.bus_routes || [];
    await CampusSchedule.deleteMany({});
    if (busRoutes.length) {
      await CampusSchedule.insertMany(busRoutes);
    }
    summary.schedules = busRoutes.length;
    console.log(`✅ Synced ${busRoutes.length} schedule/bus routes to MongoDB.`);
  }

  // 7. Policies
  const policiesPath = path.join(dbDir, "policies.json");
  if (fs.existsSync(policiesPath)) {
    const policies = JSON.parse(fs.readFileSync(policiesPath, "utf-8"));
    await CampusPolicy.deleteMany({});
    if (policies.length) {
      await CampusPolicy.insertMany(policies);
    }
    summary.policies = policies.length;
    console.log(`✅ Synced ${policies.length} policies to MongoDB.`);
  }

  // 8. Paths (from Paths.xlsx)
  const pathsPath = path.join(dbDir, "paths.json");
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

    summary.paths = paths.length;
    console.log(`✅ Synced ${paths.length} paths to MongoDB.`);
  }

  // 9. Vectors (all vectors from precomputed_vectors.json)
  const vecPath = path.resolve(
    __dirname,
    "../data/vectors/precomputed_vectors.json"
  );
  if (fs.existsSync(vecPath)) {
    const records = JSON.parse(fs.readFileSync(vecPath, "utf-8"));
    console.log(`⚡ Syncing ${records.length} precomputed vectors to MongoDB...`);

    await VectorChunk.deleteMany({});

    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const docs = batch.map((r, idx) => ({
        chunkId: r.id || `vec_${i + idx}_${Date.now()}`,
        content: r.pageContent,
        category: r.metadata?.category || "General",
        sourceId: r.metadata?.id ? String(r.metadata.id) : null,
        metadata: r.metadata || {},
        embedding: r.vector,
      }));
      await VectorChunk.insertMany(docs);
    }
    summary.vectorChunks = records.length;
    console.log(`✅ Synced ${records.length} vector embeddings to MongoDB.`);
  }

  console.log(`🎉 Full MongoDB Atlas Sync Completed in ${Date.now() - startTime}ms!`);
  return summary;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncAllDataToMongo()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Sync to Mongo failed:", err);
      process.exit(1);
    });
}

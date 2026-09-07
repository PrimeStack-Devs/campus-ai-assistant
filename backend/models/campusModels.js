import mongoose from "mongoose";

// --- 1. Building Schema ---
const CampusBuildingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    code: { type: String, index: true },
    name: { type: String, required: true },
    short_name: { type: String },
    category: { type: String, default: "academic" },
    lat: { type: Number },
    lng: { type: Number },
    coordinates_verified: { type: Boolean, default: false },
    zone: { type: String },
    floors: { type: Number },
    description: { type: String },
    aliases: [{ type: String }],
    institutes: [{ type: String }],
    nearby: [{ type: String }],
  },
  { timestamps: true }
);

// --- 2. Department Schema ---
const CampusDepartmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    short_name: { type: String },
    parent_faculty: { type: String },
    building_id: { type: String, index: true },
    building_name: { type: String },
    floor: { type: Number },
    hod: {
      name: { type: String },
      room: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    programs: [{ type: String }],
    aliases: [{ type: String }],
    description: { type: String },
    subjects: [{ type: String }],
    lab_floors: [{ type: Number }],
    class_floors: [{ type: Number }],
  },
  { timestamps: true }
);

// --- 3. Faculty Schema ---
const CampusFacultySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    role: { type: String, default: "faculty" },
    designation: { type: String },
    department_id: { type: String, index: true },
    department_name: { type: String },
    building_id: { type: String, index: true },
    building_name: { type: String },
    floor: { type: Number },
    room: { type: String },
    email: { type: String },
    phone: { type: String },
    subjects_taught: [{ type: String }],
    aliases: [{ type: String }],
    description: { type: String },
  },
  { timestamps: true }
);

// --- 4. Facility Schema ---
const CampusFacilitySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    building_id: { type: String, index: true },
    building_name: { type: String },
    type: { type: String, index: true },
    label: { type: String },
    floor: { type: Number },
    gender: { type: String, default: "both" },
    notes: { type: String },
    aliases: [{ type: String }],
  },
  { timestamps: true }
);

// --- 5. Service Schema ---
const CampusServiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, index: true },
    building_id: { type: String, index: true },
    building_name: { type: String },
    floor: { type: Number },
    contact_email: { type: String },
    contact_phone: { type: String },
    aliases: [{ type: String }],
    timings: { type: mongoose.Schema.Types.Mixed },
    description: { type: String },
    facilities: [{ type: String }],
    rules: [{ type: String }],
  },
  { timestamps: true }
);

// --- 6. Schedule Schema ---
const CampusScheduleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    route_name: { type: String, required: true },
    route_number: { type: String, index: true },
    direction: { type: String, default: "both" },
    aliases: [{ type: String }],
    description: { type: String },
    stops: [{ type: mongoose.Schema.Types.Mixed }],
    return_schedule: [{ type: mongoose.Schema.Types.Mixed }],
    frequency: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

// --- 7. Policy Schema ---
const CampusPolicySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    category: { type: String, index: true },
    tags: [{ type: String }],
    last_updated: { type: String },
    source: { type: String },
    aliases: [{ type: String }],
    content: { type: String, required: true },
  },
  { timestamps: true }
);

// --- 8. Paths & Route Summaries ---
const CampusPathSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    from: { type: String, required: true },
    from_name: { type: String },
    to: { type: String, required: true },
    to_name: { type: String },
    distance_m: { type: Number },
    walk_minutes: { type: Number },
    route_description: { type: String },
    landmarks: [{ type: String }],
  },
  { timestamps: true }
);

const CampusRouteSummarySchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    path_ids: [{ type: String }],
    total_distance_m: { type: Number },
    total_walk_minutes: { type: Number },
    summary: { type: String },
  },
  { timestamps: true }
);

// --- 9. Vector Chunk Schema ---
const VectorChunkSchema = new mongoose.Schema(
  {
    chunkId: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    category: { type: String, required: true, index: true },
    sourceId: { type: String, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    embedding: {
      type: [Number],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 384,
        message: "Embedding must be an array of 384 numbers for MiniLM-L6-v2",
      },
    },
  },
  { timestamps: true }
);

export const CampusBuilding =
  mongoose.models.CampusBuilding ||
  mongoose.model("CampusBuilding", CampusBuildingSchema);

export const CampusDepartment =
  mongoose.models.CampusDepartment ||
  mongoose.model("CampusDepartment", CampusDepartmentSchema);

export const CampusFaculty =
  mongoose.models.CampusFaculty ||
  mongoose.model("CampusFaculty", CampusFacultySchema);

export const CampusFacility =
  mongoose.models.CampusFacility ||
  mongoose.model("CampusFacility", CampusFacilitySchema);

export const CampusService =
  mongoose.models.CampusService ||
  mongoose.model("CampusService", CampusServiceSchema);

export const CampusSchedule =
  mongoose.models.CampusSchedule ||
  mongoose.model("CampusSchedule", CampusScheduleSchema);

export const CampusPolicy =
  mongoose.models.CampusPolicy ||
  mongoose.model("CampusPolicy", CampusPolicySchema);

export const CampusPath =
  mongoose.models.CampusPath ||
  mongoose.model("CampusPath", CampusPathSchema);

export const CampusRouteSummary =
  mongoose.models.CampusRouteSummary ||
  mongoose.model("CampusRouteSummary", CampusRouteSummarySchema);

export const VectorChunk =
  mongoose.models.VectorChunk ||
  mongoose.model("VectorChunk", VectorChunkSchema);

// --- 11. System Settings Schema ---
const CampusSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const CampusSetting =
  mongoose.models.CampusSetting ||
  mongoose.model("CampusSetting", CampusSettingSchema);

// --- 12. User / Student Auth Schema ---
const CampusUserSchema = new mongoose.Schema(
  {
    googleId: { type: String, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    avatar: { type: String },
    domain: { type: String, index: true },
    role: { type: String, default: "student" }, // student, faculty, admin
    lastLogin: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const CampusUser =
  mongoose.models.CampusUser ||
  mongoose.model("CampusUser", CampusUserSchema);


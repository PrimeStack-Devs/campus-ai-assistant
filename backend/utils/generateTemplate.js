import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateCampusDataTemplate(outputPath) {
  const wb = XLSX.utils.book_new();

  // 1. Buildings Sheet
  const buildingsData = [
    {
      "Building Code*": "A1",
      "Full Building Name*": "Parul Institute of Engineering & Technology",
      "Short Name": "PIET",
      "Category": "academic",
      "Floors": 6,
      "Zone": "central",
      "Latitude": 22.288408,
      "Longitude": 73.363971,
      "Aliases (comma-separated)": "PIET, A1, engineering block, A block",
      "Description": "Main engineering and technology block of Parul University.",
      "Nearby Buildings": "A2, A3, C1, C2",
    },
    {
      "Building Code*": "C1",
      "Full Building Name*": "Administrative Block C1",
      "Short Name": "Admin C1",
      "Category": "admin",
      "Floors": 4,
      "Zone": "central",
      "Latitude": 22.2891,
      "Longitude": 73.3645,
      "Aliases (comma-separated)": "admin block, main office, exam section",
      "Description": "Houses university leadership, registrar, exam section, and accounts.",
      "Nearby Buildings": "C2, PU Circle",
    },
  ];
  const wsBuildings = XLSX.utils.json_to_sheet(buildingsData);
  XLSX.utils.book_append_sheet(wb, wsBuildings, "Buildings");

  // 2. Locations & Facilities Sheet
  const facilitiesData = [
    {
      "Location / Facility Name*": "Placement Cell",
      "Type*": "office",
      "Building Code*": "C1",
      "Floor*": 2,
      "Room / Landmark": "Room 202, near central stairs",
      "Gender (for washrooms)": "N/A",
      "Aliases (comma-separated)": "placement office, tpo, career cell",
      "Notes / Details": "Coordinates campus placements and mock interviews.",
    },
    {
      "Location / Facility Name*": "Central Washroom",
      "Type*": "washroom",
      "Building Code*": "A1",
      "Floor*": 0,
      "Room / Landmark": "Ground floor near main entrance",
      "Gender (for washrooms)": "both",
      "Aliases (comma-separated)": "restroom, washroom, toilet",
      "Notes / Details": "Separate facilities for male, female, and staff.",
    },
  ];
  const wsFacilities = XLSX.utils.json_to_sheet(facilitiesData);
  XLSX.utils.book_append_sheet(wb, wsFacilities, "Locations_and_Facilities");

  // 3. Faculty Directory Sheet
  const facultyData = [
    {
      "Faculty Name*": "Dr. Alpesh Desai",
      "Role / Designation*": "Registrar",
      "Department*": "University Administration",
      "Building Code*": "C1",
      "Floor": 1,
      "Room": "101",
      "Email": "registrar@paruluniversity.ac.in",
      "Phone": "02668-260301",
      "Subjects Taught": "",
      "Aliases (comma-separated)": "registrar, registrar office, dr alpesh",
      "Description": "Manages official university records, statutory compliance, and correspondence.",
    },
    {
      "Faculty Name*": "Prof. Rahul Sharma",
      "Role / Designation*": "Assistant Professor",
      "Department*": "Computer Science & Engineering",
      "Building Code*": "A25",
      "Floor": 3,
      "Room": "Cabin 312",
      "Email": "rahul.sharma@paruluniversity.ac.in",
      "Phone": "02668-260450",
      "Subjects Taught": "Data Structures, Algorithms",
      "Aliases (comma-separated)": "rahul sir, dsa faculty",
      "Description": "Faculty for BTech CSE students specializing in DSA.",
    },
  ];
  const wsFaculty = XLSX.utils.json_to_sheet(facultyData);
  XLSX.utils.book_append_sheet(wb, wsFaculty, "Faculty_Directory");

  // 4. Departments Sheet
  const departmentsData = [
    {
      "Department Name*": "Computer Science & Engineering",
      "Short Name": "CSE",
      "Building Code*": "A25",
      "Floor*": 3,
      "HOD Name": "Dr. TBD",
      "HOD Room": "301",
      "HOD Email": "hod.cse@paruluniversity.ac.in",
      "HOD Phone": "02668-260500",
      "Programs (comma-separated)": "BTech CSE, BTech AI/ML, BTech Data Science, MTech CSE",
      "Aliases (comma-separated)": "CSE, computer science, cs department, btech cse",
      "Description": "Offers undergraduate and postgraduate programs with advanced coding labs.",
    },
  ];
  const wsDepartments = XLSX.utils.json_to_sheet(departmentsData);
  XLSX.utils.book_append_sheet(wb, wsDepartments, "Departments");

  // 5. Services & Timings Sheet
  const servicesData = [
    {
      "Service Name*": "Central Library",
      "Type*": "library",
      "Building Code*": "C1",
      "Floor": 1,
      "Mon to Sat Timings": "07:00 AM - 08:00 PM",
      "Sunday Timings": "09:30 AM - 04:30 PM",
      "Email": "library@paruluniversity.ac.in",
      "Phone": "02668-260350",
      "Aliases (comma-separated)": "library, central library, reading room, book issue",
      "Facilities": "Book issuing, digital e-journals, reading rooms, NPTEL",
      "Rules": "ID card mandatory, silence, no food",
      "Description": "Network of over 10 subject-specific libraries linked to central system.",
    },
  ];
  const wsServices = XLSX.utils.json_to_sheet(servicesData);
  XLSX.utils.book_append_sheet(wb, wsServices, "Services_and_Timings");

  // 6. Bus Schedules Sheet
  const schedulesData = [
    {
      "Route Number*": "PU-01",
      "Route Name*": "Vadodara Railway Station - Parul University",
      "Morning Departure": "07:00 AM",
      "Stops (in order)": "Station -> Fatehgunj -> Productivity Road -> Waghodia -> PU Main Gate",
      "Return Schedule": "05:00 PM, 06:00 PM from Main Gate",
      "Frequency": "Once morning, twice evening",
      "Aliases (comma-separated)": "station bus, railway station bus, pu01",
      "Notes": "Timings may vary during exams and holidays.",
    },
  ];
  const wsSchedules = XLSX.utils.json_to_sheet(schedulesData);
  XLSX.utils.book_append_sheet(wb, wsSchedules, "Bus_Schedules");

  // 7. Policies Sheet
  const policiesData = [
    {
      "Policy Title*": "Attendance Policy",
      "Category*": "academic",
      "Tags (comma-separated)": "attendance, 75 percent, rules, condonation, detained",
      "Aliases (comma-separated)": "attendance rule, minimum attendance, attendance shortage",
      "Content*": "Parul University mandates a minimum attendance of 75% in each subject to appear for exams. Attendance is calculated subject-wise. Condonation for medical reasons (between 65% and 74%) may be requested through the HOD.",
    },
  ];
  const wsPolicies = XLSX.utils.json_to_sheet(policiesData);
  XLSX.utils.book_append_sheet(wb, wsPolicies, "Campus_Policies");

  const target =
    outputPath || path.resolve(__dirname, "../data/campus_data_template.xlsx");
  const targetDir = path.dirname(target);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  XLSX.writeFile(wb, target);
  console.log(`Excel Template created at: ${target}`);
  return target;
}

// If run directly via node
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateCampusDataTemplate();
}

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";
import AdmZip from "adm-zip";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, "../data/templates");

// Master Definitions for All Campus AI Templates
export const TEMPLATE_REGISTRY = [
  {
    id: "buildings",
    title: "Campus Buildings & Blocks",
    sheetName: "Buildings",
    category: "Infrastructure & Places",
    icon: "Building",
    description: "List of campus buildings, blocks, floors, GPS coordinates, institutes, and nearby landmarks.",
    fields: [
      { key: "Building Code*", required: true, description: "Unique short identifier (e.g. A1, C1, FH1)" },
      { key: "Full Building Name*", required: true, description: "Official name (e.g. Parul Institute of Engineering & Technology)" },
      { key: "Short Name", required: false, description: "Common abbreviation (e.g. PIET, Admin Block)" },
      { key: "Category", required: false, description: "academic, admin, hostel, hospital, sports, residential" },
      { key: "Floors", required: false, description: "Total floor count as integer (e.g. 6)" },
      { key: "Zone", required: false, description: "Campus zone (central, north, south, east, west)" },
      { key: "Latitude", required: false, description: "GPS latitude decimal (e.g. 22.288408)" },
      { key: "Longitude", required: false, description: "GPS longitude decimal (e.g. 73.363971)" },
      { key: "Aliases (comma-separated)", required: false, description: "Alternative names students use (e.g. PIET, A1 block, engineering)" },
      { key: "Description", required: false, description: "Brief overview of faculties and operations inside" },
      { key: "Institutes", required: false, description: "Colleges/institutes housed in this building" },
      { key: "Nearby Buildings", required: false, description: "Adjacent building codes (e.g. A2, A3, C1)" },
    ],
    sampleData: [
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
        "Institutes": "PIET, Faculty of Engineering",
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
        "Institutes": "University Administration",
        "Nearby Buildings": "C2, PU Circle",
      },
    ],
  },
  {
    id: "facilities",
    title: "Locations & Facilities",
    sheetName: "Locations_and_Facilities",
    category: "Infrastructure & Places",
    icon: "MapPin",
    description: "Points of interest: washrooms, canteens, ATMs, placement cells, labs, and fee counters.",
    fields: [
      { key: "Location / Facility Name*", required: true, description: "Specific facility name (e.g. Placement Cell, Central Canteen)" },
      { key: "Type*", required: true, description: "canteen, washroom, atm, office, lab, library, counter, parking" },
      { key: "Building Code*", required: true, description: "Building where located (e.g. C1, A1)" },
      { key: "Floor*", required: true, description: "Floor number (0 for Ground, 1 for 1st floor, etc.)" },
      { key: "Room / Landmark", required: false, description: "Room number or nearby landmark" },
      { key: "Gender (for washrooms)", required: false, description: "male, female, both, or N/A" },
      { key: "Aliases (comma-separated)", required: false, description: "Colloquial search terms (e.g. tpo, career cell)" },
      { key: "Notes / Details", required: false, description: "Operating instructions or special access notes" },
    ],
    sampleData: [
      {
        "Location / Facility Name*": "Placement Cell",
        "Type*": "office",
        "Building Code*": "C1",
        "Floor*": 2,
        "Room / Landmark": "Room 202, near central stairs",
        "Gender (for washrooms)": "N/A",
        "Aliases (comma-separated)": "placement office, tpo, career cell",
        "Notes / Details": "Coordinates campus placements and corporate drives.",
      },
      {
        "Location / Facility Name*": "Central Washroom",
        "Type*": "washroom",
        "Building Code*": "A1",
        "Floor*": 0,
        "Room / Landmark": "Ground floor near north entrance",
        "Gender (for washrooms)": "both",
        "Aliases (comma-separated)": "restroom, washroom, toilet",
        "Notes / Details": "Separate accessible facilities for students and staff.",
      },
      {
        "Location / Facility Name*": "HDFC & SBI ATM",
        "Type*": "atm",
        "Building Code*": "C1",
        "Floor*": 0,
        "Room / Landmark": "Ground floor exterior portico",
        "Gender (for washrooms)": "N/A",
        "Aliases (comma-separated)": "atm, cash machine, bank atm",
        "Notes / Details": "24/7 cash withdrawal and passbook printing.",
      },
    ],
  },
  {
    id: "faculty",
    title: "Faculty & Staff Directory",
    sheetName: "Faculty_Directory",
    category: "Academic & People",
    icon: "Users",
    description: "Contact information, cabin locations, roles, and subjects taught by professors and staff.",
    fields: [
      { key: "Name*", required: true, description: "Full title and name (e.g. Dr. Alpesh Desai)" },
      { key: "Role / Designation*", required: true, description: "Registrar, Professor, Assistant Professor, Dean" },
      { key: "Department*", required: true, description: "Academic department or office" },
      { key: "Building Code*", required: true, description: "Building where cabin is located" },
      { key: "Floor", required: false, description: "Cabin floor number" },
      { key: "Cabin/Room", required: false, description: "Cabin number (e.g. Cabin 312, Room 101)" },
      { key: "Email", required: false, description: "Official institutional email address" },
      { key: "Phone", required: false, description: "Office extension or official phone" },
      { key: "Subjects Taught", required: false, description: "Comma-separated subjects (e.g. Data Structures, AI)" },
      { key: "Aliases (comma-separated)", required: false, description: "Common nicknames or student terms" },
      { key: "Description", required: false, description: "Research areas, responsibilities, or office timing" },
    ],
    sampleData: [
      {
        "Name*": "Dr. Alpesh Desai",
        "Role / Designation*": "Registrar",
        "Department*": "University Administration",
        "Building Code*": "C1",
        "Floor": 1,
        "Cabin/Room": "101",
        "Email": "registrar@paruluniversity.ac.in",
        "Phone": "02668-260301",
        "Subjects Taught": "",
        "Aliases (comma-separated)": "registrar, registrar office, dr alpesh",
        "Description": "Manages university records, statutory compliance, and correspondence.",
      },
      {
        "Name*": "Prof. Rahul Sharma",
        "Role / Designation*": "Assistant Professor",
        "Department*": "Computer Science & Engineering",
        "Building Code*": "A25",
        "Floor": 3,
        "Cabin/Room": "Cabin 312",
        "Email": "rahul.sharma@paruluniversity.ac.in",
        "Phone": "02668-260450",
        "Subjects Taught": "Data Structures, Algorithms",
        "Aliases (comma-separated)": "rahul sir, dsa faculty",
        "Description": "Faculty for BTech CSE students specializing in DSA and Competitive Coding.",
      },
    ],
  },
  {
    id: "departments",
    title: "Academic Departments",
    sheetName: "Departments",
    category: "Academic & People",
    icon: "GraduationCap",
    description: "Academic departments, HOD contact details, degree programs offered, and building coordinates.",
    fields: [
      { key: "Department Name*", required: true, description: "Full department title (e.g. Computer Science & Engineering)" },
      { key: "Code", required: false, description: "Department code (e.g. CSE, IT, MECH)" },
      { key: "Building Code*", required: true, description: "Main building where department office is located" },
      { key: "Floor*", required: true, description: "Floor of HOD office" },
      { key: "HOD Name", required: false, description: "Head of Department full name" },
      { key: "HOD Email", required: false, description: "Official HOD email" },
      { key: "HOD Room", required: false, description: "Room / office of HOD" },
      { key: "HOD Phone", required: false, description: "Office phone or extension" },
      { key: "Programs Offered (comma-separated)", required: false, description: "Degrees (e.g. BTech CSE, MTech CSE, PhD)" },
      { key: "Aliases (comma-separated)", required: false, description: "Search aliases (e.g. CSE, CS department)" },
      { key: "Description", required: false, description: "Department mission, facilities, and accreditations" },
      { key: "Subjects (comma-separated)", required: false, description: "Key subjects coordinated by this department" },
    ],
    sampleData: [
      {
        "Department Name*": "Computer Science & Engineering",
        "Code": "CSE",
        "Building Code*": "A25",
        "Floor*": 3,
        "HOD Name": "Dr. TBD",
        "HOD Email": "hod.cse@paruluniversity.ac.in",
        "HOD Room": "301",
        "HOD Phone": "02668-260500",
        "Programs Offered (comma-separated)": "BTech CSE, BTech AI/ML, BTech Data Science, MTech CSE",
        "Aliases (comma-separated)": "CSE, computer science, cs department, btech cse",
        "Description": "Offers undergraduate and postgraduate programs with advanced coding labs.",
        "Subjects (comma-separated)": "Programming, Operating Systems, Computer Networks, Machine Learning",
      },
    ],
  },
  {
    id: "paths",
    title: "Navigation Paths & Walking Routes",
    sheetName: "Paths",
    category: "Navigation & Campus Map",
    icon: "Compass",
    description: "Turn-by-turn walking routes between campus buildings, distances in meters, walk times, and visual landmarks.",
    fields: [
      { key: "From Building Code*", required: true, description: "Origin building code (e.g. GATE_MAIN, PU_CIRCLE, A1)" },
      { key: "From Building Name", required: false, description: "Origin building readable name" },
      { key: "To Building Code*", required: true, description: "Destination building code (e.g. C1, A2, LIBRARY)" },
      { key: "To Building Name", required: false, description: "Destination building readable name" },
      { key: "Distance (m)*", required: true, description: "Walking distance in meters as number (e.g. 120)" },
      { key: "Walk Time (min)*", required: true, description: "Average walk duration in minutes (e.g. 2)" },
      { key: "Route Description", required: false, description: "Directions (e.g. Head straight past PU Circle, take the left path)" },
      { key: "Landmarks (comma-separated)", required: false, description: "Waypoints (e.g. PU Circle, Central Fountain, Visitor Parking)" },
    ],
    sampleData: [
      {
        "From Building Code*": "GATE_MAIN",
        "From Building Name": "Main Entry Gate",
        "To Building Code*": "PU_CIRCLE",
        "To Building Name": "Parul University Circle",
        "Distance (m)*": 80,
        "Walk Time (min)*": 1,
        "Route Description": "Walk straight from the main security gate into campus. PU Circle is immediately ahead.",
        "Landmarks (comma-separated)": "Security Gate Post, PU Welcome Sign",
      },
      {
        "From Building Code*": "PU_CIRCLE",
        "From Building Name": "Parul University Circle",
        "To Building Code*": "C1",
        "To Building Name": "Administrative Block C1",
        "Distance (m)*": 120,
        "Walk Time (min)*": 2,
        "Route Description": "From PU Circle, take the right fork towards admin zone. C1 is the large multi-story block on the right.",
        "Landmarks (comma-separated)": "PU Circle, Visitor Parking P1",
      },
    ],
  },
  {
    id: "services",
    title: "Campus Services & Amenities",
    sheetName: "Services",
    category: "Services & Amenities",
    icon: "ShieldCheck",
    description: "Libraries, health center, gym, cafeterias, guest house, student helpdesk, and timing rules.",
    fields: [
      { key: "Service ID", required: false, description: "Unique code (e.g. svc_001, library_central)" },
      { key: "Service Name*", required: true, description: "Service name (e.g. Central Library, Health Center)" },
      { key: "Type*", required: true, description: "library, medical, sports, canteen, bookstore, bank, postal" },
      { key: "Building Code*", required: true, description: "Building housing the service" },
      { key: "Building Name", required: false, description: "Building name" },
      { key: "Floor", required: false, description: "Floor number" },
      { key: "Contact Email", required: false, description: "Official support email" },
      { key: "Contact Phone", required: false, description: "Support telephone number" },
      { key: "Aliases (comma-separated)", required: false, description: "Search aliases (e.g. central library, reading hall)" },
      { key: "Timings (JSON)", required: false, description: "Optional JSON of timings, or standard timing string" },
      { key: "Description", required: false, description: "Detailed description of services offered" },
      { key: "Facilities (comma-separated)", required: false, description: "Specific features (e.g. Wi-Fi, Digital Library, Book Issue)" },
      { key: "Rules (comma-separated)", required: false, description: "Regulations (e.g. ID card required, Silence, No food)" },
    ],
    sampleData: [
      {
        "Service ID": "svc_001",
        "Service Name*": "Central Library",
        "Type*": "library",
        "Building Code*": "C1",
        "Building Name": "Administrative Block C1",
        "Floor": 1,
        "Contact Email": "library@paruluniversity.ac.in",
        "Contact Phone": "02668-260350",
        "Aliases (comma-separated)": "library, central library, reading room, book issue",
        "Timings (JSON)": '{"monday_to_saturday": "07:00 AM - 08:00 PM", "sunday": "09:30 AM - 04:30 PM"}',
        "Description": "Central knowledge hub with over 100,000 volumes, IEEE access, and quiet study zones.",
        "Facilities (comma-separated)": "Book issuing, Digital e-journals, Reading rooms, Photocopying",
        "Rules (comma-separated)": "PU student ID card mandatory, Maintain silence, Bags not permitted inside",
      },
    ],
  },
  {
    id: "bus_schedules",
    title: "Bus Routes & Schedules",
    sheetName: "Bus_Routes",
    category: "Transport & Logistics",
    icon: "Bus",
    description: "University transit bus routes, pick-up points across the city, morning departures, and evening return schedules.",
    fields: [
      { key: "Route ID*", required: true, description: "Route code (e.g. PU-01, PU-02)" },
      { key: "Route Name*", required: true, description: "Route title (e.g. Vadodara Railway Station - Parul University)" },
      { key: "Route Number*", required: true, description: "Bus or route display number (e.g. PU-01)" },
      { key: "Direction", required: false, description: "to_campus, from_campus, or both" },
      { key: "Morning Departure", required: false, description: "Morning start time (e.g. 07:00 AM)" },
      { key: "Stops (in order or JSON)", required: false, description: "Stops sequence separated by arrows or JSON array" },
      { key: "Return Schedule (JSON)", required: false, description: "Return departure timings (e.g. 05:00 PM, 06:00 PM)" },
      { key: "Frequency", required: false, description: "e.g. Daily Mon-Sat, once morning, twice evening" },
      { key: "Aliases (comma-separated)", required: false, description: "Search terms (e.g. station bus, pu01, railway station)" },
      { key: "Notes", required: false, description: "Pass requirements, fee details, or special holiday notices" },
    ],
    sampleData: [
      {
        "Route ID*": "PU-01",
        "Route Name*": "Vadodara Railway Station - Parul University",
        "Route Number*": "PU-01",
        "Direction": "both",
        "Morning Departure": "07:00 AM",
        "Stops (in order or JSON)": "Vadodara Station -> Fatehgunj -> Amit Nagar -> Waghodia Cross Road -> PU Main Gate",
        "Return Schedule (JSON)": '["05:00 PM", "06:15 PM"]',
        "Frequency": "Daily Monday to Saturday",
        "Aliases (comma-separated)": "station bus, railway station bus, pu01",
        "Notes": "University bus pass must be displayed while boarding.",
      },
    ],
  },
  {
    id: "office_hours",
    title: "Administrative Office Hours",
    sheetName: "Office_Hours",
    category: "Services & Amenities",
    icon: "Clock",
    description: "Operating windows for student counters: accounts, exam section, scholarship desk, registrar, and Dean's office.",
    fields: [
      { key: "ID*", required: true, description: "Counter identifier (e.g. oh_001, oh_accounts)" },
      { key: "Name*", required: true, description: "Office/Counter name (e.g. Accounts & Fee Counter)" },
      { key: "Days*", required: true, description: "Working days (e.g. Monday - Saturday)" },
      { key: "Timing*", required: true, description: "Daily hours (e.g. 09:00 AM - 04:30 PM)" },
      { key: "Lunch Break", required: false, description: "Lunch window (e.g. 01:00 PM - 01:45 PM)" },
      { key: "Notes", required: false, description: "Closed 2nd & 4th Saturdays, public holidays" },
      { key: "Aliases (comma-separated)", required: false, description: "Counter aliases (e.g. fee counter, challan desk)" },
    ],
    sampleData: [
      {
        "ID*": "oh_001",
        "Name*": "Accounts & Fee Counter",
        "Days*": "Monday to Saturday",
        "Timing*": "09:00 AM - 04:30 PM",
        "Lunch Break": "01:00 PM - 01:45 PM",
        "Notes": "Counter accepts fee challans, DDs, and online transaction verifications.",
        "Aliases (comma-separated)": "accounts office, fee counter, finance section",
      },
      {
        "ID*": "oh_002",
        "Name*": "Examination Section",
        "Days*": "Monday to Friday",
        "Timing*": "09:30 AM - 05:00 PM",
        "Lunch Break": "01:15 PM - 02:00 PM",
        "Notes": "Transcript requests, degree verification, and re-checking forms.",
        "Aliases (comma-separated)": "exam office, grade card section, marksheet desk",
      },
    ],
  },
  {
    id: "academic_calendar",
    title: "Academic Calendar & Semesters",
    sheetName: "Academic_Calendar",
    category: "Academic & Schedules",
    icon: "Calendar",
    description: "Semester dates, term start and end milestones, exam schedule windows, and result declaration dates.",
    fields: [
      { key: "Academic Year*", required: true, description: "Year period (e.g. 2026-2027)" },
      { key: "Semester*", required: true, description: "Semester code (e.g. odd_sem_2026, even_sem_2027)" },
      { key: "Semester Name*", required: true, description: "Display name (e.g. Fall / Odd Semester 2026)" },
      { key: "Start Date", required: false, description: "Term commencement date (YYYY-MM-DD)" },
      { key: "End Date", required: false, description: "Term closing date (YYYY-MM-DD)" },
      { key: "Exam Start", required: false, description: "Examinations start date (YYYY-MM-DD)" },
      { key: "Exam End", required: false, description: "Examinations end date (YYYY-MM-DD)" },
      { key: "Result Declaration", required: false, description: "Expected result announcement date (YYYY-MM-DD)" },
    ],
    sampleData: [
      {
        "Academic Year*": "2026-2027",
        "Semester*": "odd_sem_2026",
        "Semester Name*": "Odd Semester (Autumn 2026)",
        "Start Date": "2026-07-15",
        "End Date": "2026-11-30",
        "Exam Start": "2026-12-05",
        "Exam End": "2026-12-24",
        "Result Declaration": "2027-01-20",
      },
      {
        "Academic Year*": "2026-2027",
        "Semester*": "even_sem_2027",
        "Semester Name*": "Even Semester (Spring 2027)",
        "Start Date": "2027-01-10",
        "End Date": "2027-05-15",
        "Exam Start": "2027-05-20",
        "Exam End": "2027-06-10",
        "Result Declaration": "2027-07-05",
      },
    ],
  },
  {
    id: "important_dates",
    title: "Important Dates & Milestones",
    sheetName: "Important_Dates",
    category: "Academic & Schedules",
    icon: "CalendarCheck",
    description: "Key university milestones: registration deadlines, convocations, mid-terms, fee due dates, and sports meets.",
    fields: [
      { key: "Academic Year*", required: true, description: "Year period (e.g. 2026-2027)" },
      { key: "Event*", required: true, description: "Event title (e.g. Commencement of Classes, Last Date for Fee Payment)" },
      { key: "Date*", required: true, description: "Event date or date range (e.g. 2026-07-15 or July 15, 2026)" },
      { key: "Description", required: false, description: "Detailed description of instructions and deadlines" },
    ],
    sampleData: [
      {
        "Academic Year*": "2026-2027",
        "Event*": "Commencement of Classes",
        "Date*": "2026-07-15",
        "Description": "First day of instruction for all undergraduate and postgraduate engineering semesters.",
      },
      {
        "Academic Year*": "2026-2027",
        "Event*": "Last Date for Term Fee Payment",
        "Date*": "2026-08-10",
        "Description": "Late fee applies after this deadline through the student portal.",
      },
      {
        "Academic Year*": "2026-2027",
        "Event*": "Mid-Semester Internal Examinations",
        "Date*": "2026-09-22",
        "Description": "Central internal evaluation exams across all affiliated colleges.",
      },
    ],
  },
  {
    id: "holidays",
    title: "University Holidays",
    sheetName: "Holidays",
    category: "Academic & Schedules",
    icon: "Sun",
    description: "Official gazetted public holidays, university festival vacations, and administrative non-working dates.",
    fields: [
      { key: "Academic Year*", required: true, description: "Year period (e.g. 2026-2027)" },
      { key: "Holiday Note", required: false, description: "General note on holiday policy" },
      { key: "Fixed National Holidays (one per row)", required: true, description: "Holiday name and date (e.g. Independence Day - 15 August)" },
    ],
    sampleData: [
      {
        "Academic Year*": "2026-2027",
        "Holiday Note": "Classes and offices remain suspended on official holidays. Essential services remain operational.",
        "Fixed National Holidays (one per row)": "Independence Day - 15 August 2026",
      },
      {
        "Academic Year*": "2026-2027",
        "Holiday Note": "Emergency health center and hostel mess remain open during vacation periods.",
        "Fixed National Holidays (one per row)": "Mahatma Gandhi Jayanti - 02 October 2026",
      },
      {
        "Academic Year*": "2026-2027",
        "Holiday Note": "",
        "Fixed National Holidays (one per row)": "Diwali Vacation - 28 October to 04 November 2026",
      },
      {
        "Academic Year*": "2026-2027",
        "Holiday Note": "",
        "Fixed National Holidays (one per row)": "Republic Day - 26 January 2027",
      },
    ],
  },
  {
    id: "policies",
    title: "Campus Policies & Rules",
    sheetName: "Campus_Policies",
    category: "Regulations & Rules",
    icon: "FileCheck",
    description: "Official campus regulations: attendance threshold (75%), anti-ragging, exam rules, and hostel codes.",
    fields: [
      { key: "Policy Title*", required: true, description: "Title of regulation (e.g. 75% Mandatory Attendance Policy)" },
      { key: "Category*", required: true, description: "academic, discipline, hostel, library, transport, general" },
      { key: "Tags (comma-separated)", required: false, description: "Keywords (e.g. attendance, condonation, detention, exam eligibility)" },
      { key: "Aliases (comma-separated)", required: false, description: "Search phrases (e.g. minimum attendance, attendance short)" },
      { key: "Content*", required: true, description: "Full official policy text indexed into Kryvix AI semantic vector search" },
    ],
    sampleData: [
      {
        "Policy Title*": "Attendance Policy",
        "Category*": "academic",
        "Tags (comma-separated)": "attendance, 75 percent, rules, condonation, detained, eligibility",
        "Aliases (comma-separated)": "attendance rule, minimum attendance, attendance shortage",
        "Content*": "Parul University mandates a minimum attendance of 75% in each enrolled subject to appear for end-semester examinations. Students with attendance between 65% and 74% may apply for condonation on valid medical grounds through their Department HOD with valid medical certificates within 7 days. Students with attendance below 65% are strictly detained and must repeat the course.",
      },
      {
        "Policy Title*": "Anti-Ragging Zero Tolerance Policy",
        "Category*": "discipline",
        "Tags (comma-separated)": "anti ragging, discipline, safety, helpline, ufc",
        "Aliases (comma-separated)": "ragging rule, anti ragging cell, safety helpline",
        "Content*": "Parul University enforces a strict Zero Tolerance Policy against any form of ragging or harassment on campus, in hostels, or on university transport. Any violation leads to immediate suspension, rustication, and police FIR registration under UGC regulations. The 24/7 Anti-Ragging Helpline is available to all students.",
      },
    ],
  },
];

/**
 * Generates the unified Master Workbook containing all sheets + Instructions
 */
export function generateCampusMasterTemplate(outputPath) {
  const wb = XLSX.utils.book_new();

  // 1. Cover Instructions Sheet
  const instructionsData = [
    {
      "Step": "1. Choose Your Data Sheet",
      "Guideline": "Each tab in this workbook corresponds to a core campus AI knowledge layer (Buildings, Facilities, Faculty, Departments, Paths, Services, Schedules, Policies).",
    },
    {
      "Step": "2. Mandatory Fields (*)",
      "Guideline": "Columns marked with an asterisk (*) are required for proper indexing into Kryvix's knowledge base and vector memory.",
    },
    {
      "Step": "3. Comma-Separated Values",
      "Guideline": "Fields like Aliases, Tags, Programs, and Nearby Buildings accept comma-separated strings without quotes.",
    },
    {
      "Step": "4. GPS Coordinates",
      "Guideline": "Latitude and Longitude should be decimal format (e.g. 22.288408, 73.363971). They enable interactive campus map routing.",
    },
    {
      "Step": "5. Single-Sheet Uploads",
      "Guideline": "You can upload this entire master workbook, or extract and upload individual sheets / CSVs. Kryvix automatically identifies the data type.",
    },
    {
      "Step": "6. Instant Vector Embedding",
      "Guideline": "Upon upload in the Admin Documents Hub, all records are immediately vectorized into the AI memory without server restarts.",
    },
  ];
  const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(wb, wsInstructions, "README_Instructions");

  // 2. Append each entity sheet
  for (const item of TEMPLATE_REGISTRY) {
    const ws = XLSX.utils.json_to_sheet(item.sampleData);
    XLSX.utils.book_append_sheet(wb, ws, item.sheetName);
  }

  const target = outputPath || path.join(TEMPLATES_DIR, "campus_master_template.xlsx");
  if (!fs.existsSync(path.dirname(target))) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
  }

  XLSX.writeFile(wb, target);
  return target;
}

/**
 * Generates individual .xlsx and .csv files for every template
 */
export function generateIndividualTemplates() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  }

  const generatedFiles = [];

  for (const item of TEMPLATE_REGISTRY) {
    // 1. XLSX file
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(item.sampleData);
    XLSX.utils.book_append_sheet(wb, ws, item.sheetName);
    const xlsxPath = path.join(TEMPLATES_DIR, `${item.id}_template.xlsx`);
    XLSX.writeFile(wb, xlsxPath);
    generatedFiles.push(xlsxPath);

    // 2. CSV file
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const csvPath = path.join(TEMPLATES_DIR, `${item.id}_template.csv`);
    fs.writeFileSync(csvPath, csvContent, "utf8");
    generatedFiles.push(csvPath);
  }

  return generatedFiles;
}

/**
 * Creates the complete ZIP bundle containing all XLSX and CSV templates
 */
export function generateTemplatesZipBundle() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  }

  const zip = new AdmZip();

  // Add README Guide
  const readmeContent = `# Kryvix Campus AI Assistant - Template Documentation & Guide

Welcome to the Kryvix Campus AI Assistant Data Management Suite.
This package contains all standardized spreadsheet templates used to train and feed Kryvix's knowledge base and vector memory.

## Included Templates (Both .xlsx and .csv formats):

1. **buildings_template.xlsx / .csv** - Campus blocks, zones, institutes, and GPS coordinates.
2. **facilities_template.xlsx / .csv** - Canteens, washrooms, ATMs, placement cells, and labs.
3. **faculty_template.xlsx / .csv** - Faculty directory, roles, cabin locations, and emails.
4. **departments_template.xlsx / .csv** - Academic departments, HOD details, and degree programs.
5. **paths_template.xlsx / .csv** - Turn-by-turn walking routes, distances in meters, and landmarks.
6. **services_template.xlsx / .csv** - Campus libraries, medical centers, gym, and rules.
7. **bus_schedules_template.xlsx / .csv** - Bus transit routes, morning departures, and stops.
8. **office_hours_template.xlsx / .csv** - Administrative service counters and operating hours.
9. **academic_calendar_template.xlsx / .csv** - Semesters, exam periods, and result dates.
10. **important_dates_template.xlsx / .csv** - Important university events and deadlines.
11. **holidays_template.xlsx / .csv** - Gazetted holidays and vacation periods.
12. **policies_template.xlsx / .csv** - Academic policies, rules, and student regulations.
13. **campus_master_template.xlsx** - All 12 entity sheets combined into a single workbook.

## How to Ingest Data into Kryvix:
1. Open the desired template in Excel, Google Sheets, or any spreadsheet editor.
2. Replace or extend the sample rows with your university's real records.
3. Keep column headers unchanged. Columns marked with '*' are required.
4. Navigate to the Admin Portal -> **Data Ingestion Hub** (\`/admin/documents\`).
5. Drag and drop your file into the **Bulk Excel Upload** zone.
6. Kryvix will automatically parse, clean, save, and vectorize your records immediately!
`;
  zip.addFile("README_TEMPLATE_GUIDE.md", Buffer.from(readmeContent, "utf8"));

  // Add Master Template
  const masterPath = path.join(TEMPLATES_DIR, "campus_master_template.xlsx");
  if (fs.existsSync(masterPath)) {
    zip.addLocalFile(masterPath);
  }

  // Add all individual xlsx and csv files
  for (const item of TEMPLATE_REGISTRY) {
    const xlsxPath = path.join(TEMPLATES_DIR, `${item.id}_template.xlsx`);
    if (fs.existsSync(xlsxPath)) {
      zip.addLocalFile(xlsxPath);
    }
    const csvPath = path.join(TEMPLATES_DIR, `${item.id}_template.csv`);
    if (fs.existsSync(csvPath)) {
      zip.addLocalFile(csvPath);
    }
  }

  const zipTarget = path.join(TEMPLATES_DIR, "campus_all_templates.zip");
  zip.writeZip(zipTarget);
  return zipTarget;
}

/**
 * Master generator function called at startup or on demand
 */
export function generateCampusDataTemplate(outputPath) {
  // Generate Master Template
  const masterPath = generateCampusMasterTemplate(outputPath);

  // Maintain backward-compatible campus_data_template.xlsx
  const legacyPath = path.join(TEMPLATES_DIR, "campus_data_template.xlsx");
  if (masterPath !== legacyPath) {
    try {
      fs.copyFileSync(masterPath, legacyPath);
    } catch {}
  }

  // Generate individual xlsx and csv files
  generateIndividualTemplates();

  // Generate zip bundle
  generateTemplatesZipBundle();

  console.log(`[TemplateGenerator] All campus template files successfully generated in: ${TEMPLATES_DIR}`);
  return masterPath;
}

// If run directly via node
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateCampusDataTemplate();
}

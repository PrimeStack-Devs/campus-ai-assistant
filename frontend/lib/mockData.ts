export const events = [
  {
    id: 1,
    title: "Spring Career Fair",
    date: "March 15, 2025",
    time: "10:00 AM - 3:00 PM",
    location: "Student Center",
    description: "Connect with 50+ companies recruiting on campus",
    category: "careers",
  },
  {
    id: 2,
    title: "AI & Machine Learning Workshop",
    date: "March 20, 2025",
    time: "2:00 PM - 4:00 PM",
    location: "Engineering Building, Room 301",
    description: "Learn fundamentals of ML with industry experts",
    category: "academic",
  },
  {
    id: 3,
    title: "Spring Concert",
    date: "March 28, 2025",
    time: "7:00 PM - 10:00 PM",
    location: "Main Campus Amphitheater",
    description: "Featuring live performances from student bands",
    category: "social",
  },
  {
    id: 4,
    title: "Intramural Basketball Tournament",
    date: "April 5-12, 2025",
    time: "Evenings",
    location: "Athletic Complex",
    description: "Sign up your team for spring basketball",
    category: "sports",
  },
];

export const facilities = [
  {
    id: 1,
    name: "Science Library",
    hours: "8:00 AM - 11:00 PM",
    location: "Science Building, 2nd Floor",
    amenities: ["WiFi", "Study Rooms", "Computer Labs", "Printers"],
  },
  {
    id: 2,
    name: "Main Dining Hall",
    hours: "7:00 AM - 9:00 PM",
    location: "Student Center",
    amenities: ["Multiple Cuisine Options", "Vegetarian Menu", "WiFi", "Seating for 500+"],
  },
  {
    id: 3,
    name: "Recreation Center",
    hours: "6:00 AM - 11:00 PM",
    location: "Athletic Complex",
    amenities: ["Gym Equipment", "Basketball Courts", "Swimming Pool", "Classes"],
  },
  {
    id: 4,
    name: "Health Center",
    hours: "8:00 AM - 5:00 PM (Mon-Fri)",
    location: "Medical Building",
    amenities: ["Doctor on Duty", "Counseling Services", "Urgent Care", "Pharmacy"],
  },
];

export const clubs = [
  { id: 1, name: "Coding Club", members: 150, meets: "Thursdays 6 PM", description: "Programming and software development" },
  { id: 2, name: "Debate Team", members: 45, meets: "Tuesdays 7 PM", description: "Competitive debate and argumentation" },
  { id: 3, name: "Environmental Club", members: 80, meets: "Wednesdays 5 PM", description: "Sustainability and environmental activism" },
  { id: 4, name: "Photography Club", members: 65, meets: "Saturdays 2 PM", description: "Photography techniques and project sharing" },
];

export const academicInfo = [
  {
    title: "Course Registration",
    description: "Open until March 31st. Register for fall courses through the student portal.",
  },
  {
    title: "Office Hours",
    description: "Faculty office hours available Monday-Friday 1-4 PM. See department directory for specific times.",
  },
  {
    title: "Tutoring Services",
    description: "Free peer and professional tutoring in STEM, humanities, and languages. Book at Student Services.",
  },
  {
    title: "GPA Calculator",
    description: "Calculate your GPA using the online tool. Available 24/7 in your student portal.",
  },
];

export const contacts = [
  { name: "Admissions Office", phone: "(555) 123-4567", email: "admissions@university.edu" },
  { name: "Student Services", phone: "(555) 123-4568", email: "services@university.edu" },
  { name: "Registrar", phone: "(555) 123-4569", email: "registrar@university.edu" },
];

export const locations = [
  { id: 1, name: "Science Building", latitude: 40.8067, longitude: -73.9629, type: "Academic" },
  { id: 2, name: "Student Center", latitude: 40.8075, longitude: -73.9635, type: "Student Services" },
  { id: 3, name: "Athletic Complex", latitude: 40.8045, longitude: -73.9615, type: "Sports" },
  { id: 4, name: "Medical Building", latitude: 40.8085, longitude: -73.9625, type: "Health" },
];

export const documents = [
  { id: 1, title: "2024 Academic Calendar", type: "pdf", uploadedDate: "2024-01-15", size: "2.4 MB" },
  { id: 2, title: "Student Handbook", type: "pdf", uploadedDate: "2024-01-10", size: "5.8 MB" },
  { id: 3, title: "Housing Guide 2024-25", type: "pdf", uploadedDate: "2024-02-01", size: "3.1 MB" },
  { id: 4, title: "Financial Aid Overview", type: "pdf", uploadedDate: "2024-01-20", size: "1.9 MB" },
];

export const analytics = {
  totalUsers: 5240,
  activeUsers: 3128,
  totalQueries: 18540,
  averageResponseTime: 1.2,
  satisfactionRate: 94.5,
  userGrowth: [
    { month: "Jan", users: 2100 },
    { month: "Feb", users: 2800 },
    { month: "Mar", users: 3128 },
  ],
  queryCategories: [
    { name: "Events", count: 4200 },
    { name: "Facilities", count: 3800 },
    { name: "Academics", count: 5100 },
    { name: "Clubs", count: 2800 },
    { name: "Other", count: 2640 },
  ],
};

import { events, facilities, clubs, academicInfo, contacts } from './mockData';

// Mock AI response generator - Replace with real API call to /api/chat
export async function askCampusAI(query: string): Promise<string> {
  const lowerQuery = query.toLowerCase();

  // Events
  if (lowerQuery.includes('event') || lowerQuery.includes('happening')) {
    return `We have several upcoming events! Here are some highlights:
- Spring Career Fair (March 15) - 50+ companies recruiting
- AI & Machine Learning Workshop (March 20) - Learn from industry experts
- Spring Concert (March 28) - Live student performances
- Basketball Tournament (April 5-12) - Sign up your team

Would you like more details about any of these?`;
  }

  // Facilities & Hours
  if (lowerQuery.includes('library') || lowerQuery.includes('study')) {
    return `Our Science Library is open 8 AM - 11 PM with study rooms, computer labs, and WiFi. It's located on the 2nd floor of the Science Building. Perfect for group projects and focused studying!`;
  }

  if (lowerQuery.includes('dining') || lowerQuery.includes('food') || lowerQuery.includes('eat')) {
    return `The Main Dining Hall is open 7 AM - 9 PM and serves multiple cuisine options including vegetarian meals. It's in the Student Center with seating for over 500 students. We also have various cafes around campus!`;
  }

  if (lowerQuery.includes('gym') || lowerQuery.includes('recreation') || lowerQuery.includes('exercise')) {
    return `Our Recreation Center (6 AM - 11 PM) has full gym equipment, basketball courts, a swimming pool, and fitness classes. It's in the Athletic Complex. Free for all students!`;
  }

  if (lowerQuery.includes('health') || lowerQuery.includes('medical') || lowerQuery.includes('doctor')) {
    return `The Health Center (8 AM - 5 PM weekdays) offers doctor consultations, counseling services, urgent care, and a pharmacy. Located in the Medical Building. Counseling services available by appointment.`;
  }

  // Clubs & Activities
  if (lowerQuery.includes('club') || lowerQuery.includes('activity') || lowerQuery.includes('join')) {
    return `We have 100+ clubs on campus! Popular ones include:
- Coding Club (150+ members, Thursdays 6 PM)
- Environmental Club (80 members, Wednesdays 5 PM)
- Debate Team (45 members, Tuesdays 7 PM)
- Photography Club (65 members, Saturdays 2 PM)

You can find more clubs and sign up at the Student Center!`;
  }

  // Academics
  if (lowerQuery.includes('course') || lowerQuery.includes('register') || lowerQuery.includes('registration')) {
    return `Course registration is open until March 31st! You can register through the student portal. Need help? Visit the Registrar or attend a registration workshop.`;
  }

  if (lowerQuery.includes('tutor') || lowerQuery.includes('help') || lowerQuery.includes('learn')) {
    return `We offer free tutoring in STEM, humanities, and languages. Available peer and professional tutoring. Book your session at Student Services. Office hours with faculty are also available Monday-Friday 1-4 PM.`;
  }

  // Contact
  if (lowerQuery.includes('contact') || lowerQuery.includes('phone') || lowerQuery.includes('email')) {
    return `Here are key contacts:
- Admissions: (555) 123-4567 or admissions@university.edu
- Student Services: (555) 123-4568 or services@university.edu
- Registrar: (555) 123-4569 or registrar@university.edu

How can I help you further?`;
  }

  // Default response
  return `I'm your Campus AI Assistant! I can help you with information about:
- Campus events and activities
- Facilities and their hours
- Clubs and organizations
- Academic resources and course info
- Important contacts

What would you like to know about?`;
}

// Function to get quick answer category
export function getAnswerCategory(query: string): string {
  const lower = query.toLowerCase();
  if (lower.includes('event') || lower.includes('activity')) return 'events';
  if (lower.includes('club') || lower.includes('organization')) return 'clubs';
  if (lower.includes('facility') || lower.includes('library')) return 'facilities';
  if (lower.includes('course') || lower.includes('academic')) return 'academic';
  return 'general';
}

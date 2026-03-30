import { events, facilities, clubs, academicInfo, contacts, locations } from './mockData';
import axios from 'axios';
export interface LocationData {
  name: string;
  building?: string;
  floor?: string;
  latitude: number;
  longitude: number;
}

export interface AIResponse {
  answer: string;
  location?: LocationData;
}
const fecher = async (url: string, data?: any) => {
  try {
    const response = await axios.post(url, data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
}
// Mock AI response generator - Replace with real API call to /api/chat
export async function askCampusAI(query: string): Promise<AIResponse> {
  const response = await fecher('http://localhost:5000/api/v2/chat', { query });
  console.log('Received response from backend:', response);
  return response;
  const lowerQuery = query.toLowerCase();

  // Events
  if (lowerQuery.includes('event') || lowerQuery.includes('happening')) {
    return {
      answer: `We have several upcoming events! Here are some highlights:
- Spring Career Fair (March 15) - 50+ companies recruiting
- AI & Machine Learning Workshop (March 20) - Learn from industry experts
- Spring Concert (March 28) - Live student performances
- Basketball Tournament (April 5-12) - Sign up your team

Would you like more details about any of these?`,
      location: {
        name: 'Student Center',
        building: 'Student Center Building',
        floor: '1st Floor',
        latitude: 40.8075,
        longitude: -73.9635,
      },
    };
  }

  // Facilities & Hours
  if (lowerQuery.includes('library') || lowerQuery.includes('study')) {
    return {
      answer: `Our Science Library is open 8 AM - 11 PM with study rooms, computer labs, and WiFi. It's located on the 2nd floor of the Science Building. Perfect for group projects and focused studying!`,
      location: {
        name: 'Science Library',
        building: 'Science Building',
        floor: '2nd Floor',
        latitude: 22.292454981815624, 
        longitude: 73.36299750573762,
      },
    };
  }

  if (lowerQuery.includes('dining') || lowerQuery.includes('food') || lowerQuery.includes('eat')) {
    return {
      answer: `The Main Dining Hall is open 7 AM - 9 PM and serves multiple cuisine options including vegetarian meals. It's in the Student Center with seating for over 500 students. We also have various cafes around campus!`,
      location: {
        name: 'Main Dining Hall',
        building: 'Student Center',
        floor: '1st Floor',
        latitude: 40.8075,
        longitude: -73.9635,
      },
    };
  }

  if (lowerQuery.includes('gym') || lowerQuery.includes('recreation') || lowerQuery.includes('exercise')) {
    return {
      answer: `Our Recreation Center (6 AM - 11 PM) has full gym equipment, basketball courts, a swimming pool, and fitness classes. It's in the Athletic Complex. Free for all students!`,
      location: {
        name: 'Recreation Center',
        building: 'Athletic Complex',
        latitude: 40.8045,
        longitude: -73.9615,
      },
    };
  }

  if (lowerQuery.includes('health') || lowerQuery.includes('medical') || lowerQuery.includes('doctor')) {
    return {
      answer: `The Health Center (8 AM - 5 PM weekdays) offers doctor consultations, counseling services, urgent care, and a pharmacy. Located in the Medical Building. Counseling services available by appointment.`,
      location: {
        name: 'Health Center',
        building: 'Medical Building',
        latitude: 40.8085,
        longitude: -73.9625,
      },
    };
  }

  // Clubs & Activities
  if (lowerQuery.includes('club') || lowerQuery.includes('activity') || lowerQuery.includes('join')) {
    return {
      answer: `We have 100+ clubs on campus! Popular ones include:
- Coding Club (150+ members, Thursdays 6 PM)
- Environmental Club (80 members, Wednesdays 5 PM)
- Debate Team (45 members, Tuesdays 7 PM)
- Photography Club (65 members, Saturdays 2 PM)

You can find more clubs and sign up at the Student Center!`,
      location: {
        name: 'Student Center',
        building: 'Student Center Building',
        floor: '2nd Floor',
        latitude: 40.8075,
        longitude: -73.9635,
      },
    };
  }

  // Academics
  if (lowerQuery.includes('course') || lowerQuery.includes('register') || lowerQuery.includes('registration')) {
    return {
      answer: `Course registration is open until March 31st! You can register through the student portal. Need help? Visit the Registrar or attend a registration workshop.`,
    };
  }

  if (lowerQuery.includes('tutor') || lowerQuery.includes('help') || lowerQuery.includes('learn')) {
    return {
      answer: `We offer free tutoring in STEM, humanities, and languages. Available peer and professional tutoring. Book your session at Student Services. Office hours with faculty are also available Monday-Friday 1-4 PM.`,
      location: {
        name: 'Student Services',
        building: 'Student Center',
        floor: '3rd Floor',
        latitude: 40.8075,
        longitude: -73.9635,
      },
    };
  }

  // Contact
  if (lowerQuery.includes('contact') || lowerQuery.includes('phone') || lowerQuery.includes('email')) {
    return {
      answer: `Here are key contacts:
- Admissions: (555) 123-4567 or admissions@university.edu
- Student Services: (555) 123-4568 or services@university.edu
- Registrar: (555) 123-4569 or registrar@university.edu

How can I help you further?`,
    };
  }

  // Default response
  return {
    answer: `I'm your Campus AI Assistant! I can help you with information about:
- Campus events and activities
- Facilities and their hours
- Clubs and organizations
- Academic resources and course info
- Important contacts

What would you like to know about?`,
  };
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


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
    const response = await axios.post(url, { message: data, sessionId: 'dummy-session-id' });
    return response.data;
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
}
// Mock AI response generator - Replace with real API call to /api/chat
export async function askCampusAI(query: string): Promise<AIResponse> {
  console.log("ksdjf;lsejfs'ljfkl")
  const response: any = await axios.post("http://localhost:5000/api/v2/chat", { message: query, sessionId: 'dummy-session-id' });
  const data = response.data;

  // 
  // data.data.type = web_source || place_bundle
  // 

  return {
    answer: data?.reply,
    location: {
      name: data?.data?.destination?.name,
      building: data?.location?.building || undefined,
      floor: data?.location?.floor || undefined,
      latitude: data?.data?.destination?.coordinates?.lat || 0,
      longitude: data?.data?.destination?.coordinates?.lng || 0,

    }
  }
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

}
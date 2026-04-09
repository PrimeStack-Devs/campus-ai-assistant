import axios from 'axios';

export interface LocationData {
  name: string;
  building?: string;
  floor?: string;
  latitude: number;
  longitude: number;
}

export interface WebSourceData {
  sourceLabel: string;
  sourceUrl: string;
  cached?: boolean;
  scrapedAt?: string | null;
  disclosure?: string | null;
}

export interface AIResponse {
  answer: string;
  responseType?: string | null;
  location?: LocationData;
  webSource?: WebSourceData;
}

interface PlaceBundlePayload {
  type: 'place_bundle';
  destination?: {
    name?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
  matched_entity?: {
    name?: string;
    building_name?: string;
  };
}

interface WebSourcePayload {
  type: 'web_source';
  source_label?: string;
  source_url?: string;
  cached?: boolean;
  scraped_at?: string | null;
  disclosure?: string | null;
}

type ResponsePayload = PlaceBundlePayload | WebSourcePayload | null | undefined;

export async function askCampusAI(query: string): Promise<AIResponse> {
  const response = await axios.post('http://10.0.2.2:5000/api/v2/chat', {
    message: query,
    sessionId: 'dummy-session-id',
  });

  const apiData = response.data;
  const payload = apiData?.data as ResponsePayload;
  const responseType = typeof apiData?.data?.type === 'string' ? apiData.data.type : null;

  if (payload?.type === 'place_bundle') {
    const latitude = payload.destination?.coordinates?.lat;
    const longitude = payload.destination?.coordinates?.lng;

    const location =
      typeof latitude === 'number' && typeof longitude === 'number'
        ? {
            name: payload.matched_entity?.name || payload.destination?.name || 'Campus location',
            building:
              payload.matched_entity?.building_name || payload.destination?.name || undefined,
            latitude,
            longitude,
          }
        : undefined;

    return {
      answer: apiData?.reply ?? '',
      responseType,
      location,
    };
  }

  if (payload?.type === 'web_source') {
    return {
      answer: apiData?.reply ?? '',
      responseType,
      webSource: payload.source_url
        ? {
            sourceLabel: payload.source_label || 'Official source',
            sourceUrl: payload.source_url,
            cached: payload.cached,
            scrapedAt: payload.scraped_at,
            disclosure: payload.disclosure,
          }
        : undefined,
    };
  }

  return {
    answer: apiData?.reply ?? '',
    responseType,
  };
}

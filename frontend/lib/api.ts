import axios from 'axios';

const SESSION_STORAGE_KEY = 'campus-ai-session-id';

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `web-session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId() {
  if (typeof window === 'undefined') {
    return 'server-session';
  }

  const existingSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existingSessionId) {
    return existingSessionId;
  }

  const newSessionId = createSessionId();
  window.localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
  return newSessionId;
}

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
  title?: string;
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
  is_official?: boolean;
  cached?: boolean;
  scraped_at?: string | null;
  disclosure?: string | null;
}

type ResponsePayload = PlaceBundlePayload | WebSourcePayload | null | undefined;

export async function askCampusAI(
  query: string,
  sessionId?: string,
  options?: { messageCount?: number; existingTitle?: string }
): Promise<AIResponse> {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const response = await axios.post(`${backend}/api/chat`, {
    message: query,
    sessionId: sessionId || getSessionId(),
    messageCount: options?.messageCount,
    existingTitle: options?.existingTitle,
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
      title: apiData?.title,
      location,
    };
  }

  if (payload?.type === 'web_source') {
    // Only show SourceCard for external / third-party web sources (e.g. when disclosure is present or not official paruluniversity.ac.in domain)
    const isOfficial = payload.is_official ?? payload.source_url?.includes('paruluniversity.ac.in');
    const shouldShowSourceCard = !isOfficial || Boolean(payload.disclosure);

    return {
      answer: apiData?.reply ?? '',
      responseType,
      title: apiData?.title,
      webSource:
        payload.source_url && shouldShowSourceCard
          ? {
              sourceLabel: payload.source_label || 'External source',
              sourceUrl: payload.source_url,
              disclosure: payload.disclosure,
            }
          : undefined,
    };
  }

  return {
    answer: apiData?.reply ?? '',
    responseType,
    title: apiData?.title,
  };
}

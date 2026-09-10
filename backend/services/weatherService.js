/**
 * weatherService.js
 * Parul University Smart Campus Assistant
 *
 * Real-time weather service for Parul University campus (Vadodara, Gujarat).
 * Powered by Open-Meteo API (free, open, no API key required).
 * Includes 15-minute in-memory + Redis caching to ensure sub-millisecond responses.
 */

import redisClient from "../config/redis.js";

// Parul University Campus Coordinates (Vadodara / Waghodia, Gujarat)
const PU_LAT = 22.2884;
const PU_LNG = 73.3640;
const CACHE_KEY = "pu:weather:current";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// In-memory fallback cache
let memoryCache = {
  data: null,
  expiresAt: 0,
};

// WMO Weather Interpretation Codes
const WMO_CODES = {
  0: { condition: "Clear Sky", emoji: "☀️" },
  1: { condition: "Mainly Clear", emoji: "🌤️" },
  2: { condition: "Partly Cloudy", emoji: "⛅" },
  3: { condition: "Overcast", emoji: "☁️" },
  45: { condition: "Foggy", emoji: "🌫️" },
  48: { condition: "Depositing Rime Fog", emoji: "🌫️" },
  51: { condition: "Light Drizzle", emoji: "🌦️" },
  53: { condition: "Moderate Drizzle", emoji: "🌦️" },
  55: { condition: "Dense Drizzle", emoji: "🌧️" },
  61: { condition: "Slight Rain", emoji: "🌧️" },
  63: { condition: "Moderate Rain", emoji: "🌧️" },
  65: { condition: "Heavy Rain", emoji: "🌧️" },
  80: { condition: "Rain Showers", emoji: "🌦️" },
  81: { condition: "Moderate Showers", emoji: "🌧️" },
  82: { condition: "Violent Showers", emoji: "⛈️" },
  95: { condition: "Thunderstorm", emoji: "⛈️" },
  96: { condition: "Thunderstorm with Hail", emoji: "⛈️" },
  99: { condition: "Severe Thunderstorm with Hail", emoji: "⛈️" },
};

/**
 * Detect if the message is asking about weather.
 */
export function isWeatherQuery(query) {
  if (!query || typeof query !== "string") return false;

  const normalized = query.toLowerCase().trim();

  // Pattern matching weather inquiries
  const weatherPattern =
    /\b(weather|temperature|temp|climate|forecast|humidity|raining|rainy|is it (hot|cold|sunny|raining|cloudy)|will it rain|weather forecast)\b/i;

  return weatherPattern.test(normalized);
}

/**
 * Fetch current live weather for Parul University campus.
 */
export async function fetchCampusWeather() {
  const now = Date.now();

  // 1. Check in-memory cache
  if (memoryCache.data && memoryCache.expiresAt > now) {
    return memoryCache.data;
  }

  // 2. Check Redis cache
  try {
    if (redisClient?.isOpen) {
      const cached = await redisClient.get(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        memoryCache = { data: parsed, expiresAt: now + CACHE_TTL_MS };
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[WeatherService] Redis cache read failed:", err.message);
  }

  // 3. Fetch from Open-Meteo
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${PU_LAT}&longitude=${PU_LNG}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FKolkata`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Open-Meteo responded with status ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;

    const weatherPayload = {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      isDay: current.is_day === 1,
      time: current.time,
      location: "Parul University, Vadodara, Gujarat",
    };

    // Update in-memory cache
    memoryCache = {
      data: weatherPayload,
      expiresAt: now + CACHE_TTL_MS,
    };

    // Update Redis cache (TTL 15 minutes)
    try {
      if (redisClient?.isOpen) {
        await redisClient.setEx(CACHE_KEY, 900, JSON.stringify(weatherPayload));
      }
    } catch (cacheErr) {
      console.warn("[WeatherService] Redis setEx failed:", cacheErr.message);
    }

    return weatherPayload;
  } catch (error) {
    clearTimeout(timeout);
    console.error("[WeatherService] Failed to fetch live weather:", error.message);

    // If cache has stale data, return it as fallback
    if (memoryCache.data) {
      return memoryCache.data;
    }

    return null;
  }
}

/**
 * Generate a campus-tailored markdown response.
 */
export async function getCampusWeatherResponse(userMessage) {
  if (!isWeatherQuery(userMessage)) {
    return null;
  }

  const query = userMessage.toLowerCase();

  // Check if user specifically asked about another non-campus city (e.g., Delhi, Mumbai, London)
  const otherCityPattern =
    /\b(in|at|for)\s+(delhi|mumbai|bangalore|bengaluru|kolkata|chennai|hyderabad|pune|ahmedabad|surat|jaipur|london|paris|new york|tokyo|canada|usa|uk)\b/i;
  const isOtherCity = otherCityPattern.test(query);

  const weather = await fetchCampusWeather();

  if (!weather) {
    return {
      response: `I'm currently unable to retrieve the real-time weather feed for Parul University. Typically, Vadodara experiences warm tropical weather with temperatures around 30°C–36°C. Please check back in a few minutes!`,
      query_type: "weather",
      source: "campus_weather",
      metadata: {
        source: "campus_weather",
        campus: "Parul University",
      },
    };
  }

  const codeInfo = WMO_CODES[weather.weatherCode] || {
    condition: "Clear",
    emoji: "🌤️",
  };

  // Generate dynamic campus advice
  let campusTip = "";
  if (weather.precipitation > 0 || weather.weatherCode >= 51) {
    campusTip = `☔ **Campus Walking Tip:** Rain detected on campus. Remember to carry an umbrella and watch your step on open pathways and courtyard tiles between academic blocks.`;
  } else if (weather.feelsLike >= 38 || weather.temperature >= 38) {
    campusTip = `🌡️ **Heat Alert:** It's very hot across the 250-acre campus today! Stay hydrated, wear sunscreen, and make use of the covered walkways around the C-block administrative zone.`;
  } else if (weather.feelsLike >= 32 || weather.temperature >= 32) {
    campusTip = `💧 **Campus Tip:** Warm conditions today. Carry a water bottle with you, especially if walking between distant blocks (like from the Main Gate to the Central Library or Hostels).`;
  } else if (weather.temperature <= 18) {
    campusTip = `🧥 **Campus Tip:** Pleasant and cool breeze across campus. Great weather for studying outdoors or spending time near PU Circle.`;
  } else {
    campusTip = `🌳 **Campus Tip:** Pleasant weather across campus. Perfect conditions for outdoor sports, walking, or hanging out at the food courts.`;
  }

  const locationNote = isOtherCity
    ? `> *Note: I specialize in campus assistance for **Parul University (Vadodara)**, so here is the live weather for the PU campus:*  \n\n`
    : "";

  const responseMarkdown = `${locationNote}### ${codeInfo.emoji} Weather at Parul University (Vadodara)

* **Current Temperature:** **${weather.temperature}°C** (Feels like **${weather.feelsLike}°C**)
* **Condition:** ${codeInfo.condition} ${codeInfo.emoji}
* **Humidity:** ${weather.humidity}%
* **Wind Speed:** ${weather.windSpeed} km/h
* **Precipitation:** ${weather.precipitation > 0 ? `${weather.precipitation} mm` : "None"}

${campusTip}

*Location: Parul University, Post Limda, Waghodia, Vadodara, Gujarat.*`;

  return {
    response: responseMarkdown,
    query_type: "weather",
    source: "campus_weather",
    metadata: {
      source: "campus_weather",
      campus: "Parul University",
      city: "Vadodara",
      temperature: weather.temperature,
      feels_like: weather.feelsLike,
      condition: codeInfo.condition,
      humidity: weather.humidity,
      wind_speed: weather.windSpeed,
      is_day: weather.isDay,
      timestamp: weather.time,
    },
  };
}

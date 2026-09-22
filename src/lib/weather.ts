// Server-side weather for Han Market (Da Nang) via Open-Meteo (no API key required).
// Used by the WeatherSection Server Component at build time and by the /api/weather worker route.

type Lang = "vi" | "en";

const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=16.06827&longitude=108.21447" +
  "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
  "&timezone=Asia%2FHo_Chi_Minh&forecast_days=7";

const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];

const VI_DAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const EN_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const EN_MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface DayView {
  weekday: string;
  dateLabel: string;
  text: string;
  tMax: number;
  tMin: number;
  precipProb: number | null;
}

export interface WeatherView {
  updatedLabel: string;
  current: {
    tempC: number;
    feelsC: number;
    humidity: number;
    windKmh: number;
    precipMm: number;
    text: string;
    umbrella: boolean;
    umbrellaText: string;
  };
  daily: DayView[];
  stale: boolean;
}

function wmoText(code: number, lang: Lang): string {
  const map: Record<number, [string, string]> = {
    0: ["Quang đãng", "Clear"],
    1: ["Phần lớn quang đãng", "Mostly clear"],
    2: ["Có mây rải rác", "Partly cloudy"],
    3: ["Nhiều mây", "Overcast"],
    45: ["Sương mù", "Fog"],
    48: ["Sương mù giá", "Rime fog"],
    51: ["Mưa phùn nhẹ", "Light drizzle"],
    53: ["Mưa phùn", "Drizzle"],
    55: ["Mưa phùn dày", "Dense drizzle"],
    56: ["Mưa phùn giá", "Freezing drizzle"],
    57: ["Mưa phùn giá dày", "Dense freezing drizzle"],
    61: ["Mưa nhẹ", "Light rain"],
    63: ["Mưa", "Rain"],
    65: ["Mưa to", "Heavy rain"],
    66: ["Mưa tuyết giá", "Freezing rain"],
    67: ["Mưa tuyết giá dày", "Heavy freezing rain"],
    71: ["Tuyết rơi nhẹ", "Light snow"],
    73: ["Tuyết rơi", "Snow"],
    75: ["Tuyết rơi dày", "Heavy snow"],
    77: ["Hạt tuyết", "Snow grains"],
    80: ["Mưa rào nhẹ", "Light showers"],
    81: ["Mưa rào", "Showers"],
    82: ["Mưa rào dày", "Violent showers"],
    85: ["Tuyết rào", "Snow showers"],
    86: ["Tuyết rào dày", "Heavy snow showers"],
    95: ["Dông", "Thunderstorm"],
    96: ["Dông có mưa đá", "Thunderstorm with hail"],
    99: ["Dông mạnh có mưa đá", "Severe thunderstorm with hail"],
  };
  const pair = map[code] || (lang === "vi" ? ["Không xác định", "Unknown"] : ["Unknown", "Unknown"]);
  return pair[lang === "vi" ? 0 : 1];
}

function weekday(dt: Date, lang: Lang): string {
  return (lang === "vi" ? VI_DAY : EN_DAY)[dt.getDay()];
}

function dateLabel(dt: Date, lang: Lang): string {
  const d = dt.getDate();
  const m = dt.getMonth() + 1;
  return lang === "vi" ? `${d}/${m}` : `${EN_MON[dt.getMonth()]} ${d}`;
}

function fmtUpdated(dt: Date, lang: Lang): string {
  const hm = dt.toTimeString().slice(0, 5);
  return lang === "vi"
    ? `${dt.getDate()}/${dt.getMonth() + 1} ${hm}`
    : `${EN_MON[dt.getMonth()]} ${dt.getDate()}, ${hm}`;
}

function normalize(data: any, lang: Lang): WeatherView {
  const cur = data.current;
  const daily = data.daily;
  const code = Number(cur.weather_code);
  const precip = Number(cur.precipitation) || 0;
  const probToday = daily?.precipitation_probability_max?.[0];
  const umbrella =
    precip > 0.1 ||
    RAIN_CODES.includes(code) ||
    (typeof probToday === "number" && probToday > 50);

  const current = {
    tempC: Math.round(Number(cur.temperature_2m)),
    feelsC: Math.round(Number(cur.apparent_temperature)),
    humidity: Math.round(Number(cur.relative_humidity_2m)),
    windKmh: Math.round(Number(cur.wind_speed_10m)),
    precipMm: Math.round(precip * 10) / 10,
    text: wmoText(code, lang),
    umbrella,
    umbrellaText:
      lang === "vi"
        ? (umbrella ? "Nên mang theo ô" : "Không cần ô")
        : (umbrella ? "Bring an umbrella" : "No umbrella needed"),
  };

  const days: DayView[] = (daily.time as string[]).map((d: string, i: number) => {
    const dt = new Date(d + "T00:00");
    const prob = daily.precipitation_probability_max?.[i];
    return {
      weekday: weekday(dt, lang),
      dateLabel: dateLabel(dt, lang),
      text: wmoText(Number(daily.weather_code[i]), lang),
      tMax: Math.round(Number(daily.temperature_2m_max[i])),
      tMin: Math.round(Number(daily.temperature_2m_min[i])),
      precipProb: prob != null ? Math.round(Number(prob)) : null,
    };
  });

  const updated = new Date(String(cur.time).replace(" ", "T"));

  return {
    updatedLabel: fmtUpdated(updated, lang),
    current,
    daily: days,
    stale: false,
  };
}

function makeFallback(lang: Lang): WeatherView {
  const today = new Date();
  const samples = [
    { code: 0, tMax: 31, tMin: 24, p: 10 },
    { code: 2, tMax: 32, tMin: 25, p: 20 },
    { code: 3, tMax: 30, tMin: 25, p: 30 },
    { code: 61, tMax: 29, tMin: 24, p: 70 },
    { code: 2, tMax: 31, tMin: 24, p: 20 },
    { code: 0, tMax: 33, tMin: 25, p: 5 },
    { code: 1, tMax: 32, tMin: 25, p: 15 },
  ];
  const days: DayView[] = samples.map((s, i) => {
    const dt = new Date(today);
    dt.setDate(today.getDate() + i);
    return {
      weekday: weekday(dt, lang),
      dateLabel: dateLabel(dt, lang),
      text: wmoText(s.code, lang),
      tMax: s.tMax,
      tMin: s.tMin,
      precipProb: s.p,
    };
  });
  return {
    updatedLabel: fmtUpdated(today, lang),
    current: {
      tempC: 30,
      feelsC: 33,
      humidity: 70,
      windKmh: 12,
      precipMm: 0,
      text: wmoText(0, lang),
      umbrella: false,
      umbrellaText: lang === "vi" ? "Không cần ô" : "No umbrella needed",
    },
    daily: days,
    stale: true,
  };
}

let cache: { ts: number; lang: Lang; data: WeatherView } | null = null;

export async function fetchWeather(lang: Lang): Promise<WeatherView> {
  const now = Date.now();
  if (cache && cache.lang === lang && now - cache.ts < 30 * 60 * 1000) {
    return cache.data;
  }
  try {
    const res = await fetch(OPEN_METEO_URL, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "hanmarket-guide/1.0" },
    });
    if (!res.ok) throw new Error("open-meteo " + res.status);
    const data = await res.json();
    const view = normalize(data, lang);
    cache = { ts: now, lang, data: view };
    return view;
  } catch {
    const view = makeFallback(lang);
    cache = { ts: now, lang, data: view };
    return view;
  }
}

// Server-side weather for Han Market (Da Nang) via Open-Meteo (no API key required).
// Requested only through the native /api/weather Worker route.

type Lang = "vi" | "en";

const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=16.0680836&longitude=108.224069" +
  "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max" +
  "&timezone=Asia%2FHo_Chi_Minh&forecast_days=7";

const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
const LIGHT_RAIN = [51, 53, 55, 56, 57, 61, 80, 81];
const HEAVY_RAIN = [63, 65, 82];
const THUNDER = [95, 96, 99];
const FOG = [45, 48];
const CLEAR = [0, 1];
const CLOUDY = [2, 3];

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

export interface AdviceView {
  outfit: string[];
  activity: string[];
  gear: string[];
  risk: string[];
}

export interface WeatherView {
  updatedLabel: string;
  current: {
    tempC: number;
    feelsC: number;
    humidity: number;
    windKmh: number;
    precipMm: number;
    uv: number;
    text: string;
    umbrella: boolean;
    umbrellaText: string;
  };
  today: {
    code: number;
    tMax: number;
    tMin: number;
    precipProb: number | null;
    windKmh: number;
    uv: number;
  };
  advice: AdviceView;
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
  return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-GB", {timeZone:"Asia/Ho_Chi_Minh",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(dt);
}

function windLevel(kmh: number): number {
  if (kmh < 1) return 0;
  if (kmh <= 5) return 1;
  if (kmh <= 11) return 2;
  if (kmh <= 19) return 3;
  if (kmh <= 28) return 4;
  if (kmh <= 38) return 5;
  if (kmh <= 49) return 6;
  if (kmh <= 61) return 7;
  return 8;
}

// Build visitor-facing, plain-language advice from today's conditions.
// Returns grouped, de-duplicated tips; the risk group is only populated on severe conditions.
function buildAdvice(
  t: { code: number; tMax: number; tMin: number; precipProb: number | null; windKmh: number; uv: number },
  lang: Lang
): AdviceView {
  const T = (vi: string, en: string) => (lang === "vi" ? vi : en);
  const outfit: string[] = [];
  const activity: string[] = [];
  const gear: string[] = [];
  const risk: string[] = [];

  const prob = t.precipProb ?? 0;
  const lvl = windLevel(t.windKmh);

  if (prob >= 60) {
    outfit.push(T("Khả năng mưa cao, nên mang theo ô hoặc áo mưa", "High chance of rain — bring an umbrella or raincoat"));
    activity.push(T("Ưu tiên khu vực trong nhà; hoãn hoạt động ngoài trời, ven sông và biển", "Prioritise indoor spots; postpone outdoor, riverside and beach plans"));
    gear.push(T("Ô / áo mưa", "Umbrella / raincoat"));
  }
  if (LIGHT_RAIN.includes(t.code)) {
    activity.push(T("Hoạt động ngoài trời trải nghiệm kém hơn", "Outdoor activities will be less enjoyable"));
    gear.push(T("Ô gập nhỏ", "A compact umbrella"));
  }
  if (HEAVY_RAIN.includes(t.code)) {
    risk.push(T("Mưa khá lớn, tránh thung lũng và vùng trũng thấp", "Fairly heavy rain — avoid valleys and low-lying areas"));
    activity.push(T("Hoãn đi bộ ngoài trời khi mưa lớn; kiểm tra cảnh báo và chỉ dẫn tại chỗ", "Postpone exposed walks in heavy rain; check warnings and local directions"));
    gear.push(T("Áo mưa (gió to không nên dùng ô cán dài)", "Raincoat (avoid a long umbrella in strong wind)"));
  }
  if (THUNDER.includes(t.code)) {
    risk.push(T("Có sấm sét: tìm nơi trú kiên cố, hoãn đi bộ ngoài trời và kiểm tra cảnh báo địa phương", "Lightning risk — seek substantial shelter, postpone exposed walks and check local warnings"));
  }
  if (t.tMax >= 32) {
    outfit.push(T("Nhiệt độ cao, tránh ra ngoài lúc giữa trưa", "Hot — avoid going out at midday"));
    activity.push(T("Rút ngắn thời gian chơi ngoài trời", "Shorten outdoor time"));
    gear.push(T("Kem chống nắng, đủ nước uống, đồ chống nóng", "Sunscreen, plenty of water, heat protection"));
  }
  if (t.tMax >= 35) {
    risk.push(T("Nhiệt độ dự báo rất cao: ở nơi có bóng râm, đề phòng say nắng", "Very hot forecast — stay in shade and watch for heatstroke"));
  }
  if (t.uv >= 5) {
    activity.push(T("Tia UV mạnh, chú ý chống nắng", "Strong UV — take sun protection"));
    gear.push(T("Kem chống nắng, kính râm, mũ che nắng", "Sunscreen, sunglasses, sun hat"));
  }
  if (t.tMax - t.tMin > 8) {
    outfit.push(T("Chênh lệch nhiệt ngày đêm lớn, nên mang một áo khoác mỏng", "Big day–night temperature swing — bring a light jacket"));
  }
  if (t.tMax <= 10) {
    outfit.push(T("Nhiệt độ thấp, giữ ấm", "Low temperature — keep warm"));
    gear.push(T("Áo ấm, khăn", "Warm jacket, scarf"));
  }
  if (lvl >= 5 && lvl <= 6) {
    outfit.push(T("Gió khá mạnh", "Rather windy"));
    activity.push(T("Kiểm tra cảnh báo gió trước khi đi bộ ven sông; giữ lịch trình linh hoạt", "Check wind warnings before riverside walks and keep plans flexible"));
    gear.push(T("Mũ dễ bị thổi bay, không nên mặc váy xòe rộng", "Hats may blow away; avoid loose wide skirts"));
  }
  if (lvl >= 7) {
    risk.push(T("Gió lớn: tránh cây và bảng hiệu, hoãn đi bộ ngoài trời và theo dõi thông báo địa phương", "Strong wind — avoid trees and signs, postpone exposed walks and check local notices"));
  }
  if (CLEAR.includes(t.code)) {
    activity.push(T("Trời quang đãng, thích hợp đi chơi ngoài trời và ngắm bình minh/hoàng hôn", "Clear skies — great for outdoors and sunrise/sunset"));
    gear.push(T("Nhớ chống nắng", "Remember sun protection"));
  }
  if (CLOUDY.includes(t.code)) {
    activity.push(T("Ánh sáng dịu, rất hợp chụp ảnh; không nắng gắt, thích hợp đi bộ lâu", "Soft light, great for photos; good for long walks"));
  }
  if (FOG.includes(t.code)) {
    risk.push(T("Tầm nhìn kém: thận trọng khi sang đường và kiểm tra điều kiện trước khi đi", "Poor visibility — take care at crossings and check conditions before travelling"));
    gear.push(T("Khẩu trang", "A mask"));
  }

  const uniq = (a: string[]) => Array.from(new Set(a));
  return { outfit: uniq(outfit), activity: uniq(activity), gear: uniq(gear), risk: uniq(risk) };
}

function normalize(data: any, lang: Lang): WeatherView {
  const c = data?.current, d = data?.daily;
  const finite = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  const keys = ["temperature_2m", "apparent_temperature", "relative_humidity_2m", "wind_speed_10m", "precipitation", "weather_code"];
  if (!c || !d || !keys.every(k => finite(c[k])) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(c.time ?? "")) throw new Error("Invalid current weather");
  const timestamp = Date.parse(c.time + "+07:00");
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 6 * 3600000) throw new Error("Outdated current weather");
  if (!Array.isArray(d.time) || d.time.length < 1 || d.time.length > 7 || !d.time.every((v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)))) throw new Error("Invalid forecast dates");
  for (const key of ["weather_code", "temperature_2m_max", "temperature_2m_min", "precipitation_probability_max", "uv_index_max"]) {
    if (!Array.isArray(d[key]) || d[key].length !== d.time.length || !d[key].every(finite)) throw new Error("Incomplete forecast");
  }
  if (c.relative_humidity_2m < 0 || c.relative_humidity_2m > 100 || c.precipitation < 0 || c.wind_speed_10m < 0 || d.precipitation_probability_max.some((n: number) => n < 0 || n > 100)) throw new Error("Invalid weather range");
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
    uv: Math.round(Number(daily.uv_index_max[0])),
    text: wmoText(code, lang),
    umbrella,
    umbrellaText:
      lang === "vi"
        ? (umbrella ? "Nên mang theo ô" : "Kiểm tra dự báo trước khi ra ngoài")
        : (umbrella ? "Bring an umbrella" : "Check the forecast before heading out"),
  };

  const today = {
    code: Number(daily.weather_code[0]),
    tMax: Math.round(Number(daily.temperature_2m_max[0])),
    tMin: Math.round(Number(daily.temperature_2m_min[0])),
    precipProb: probToday != null ? Math.round(Number(probToday)) : null,
    windKmh: current.windKmh,
    uv: Math.round(Number(daily.uv_index_max[0])),
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

  const updated = new Date(String(cur.time) + "+07:00");

  return {
    updatedLabel: fmtUpdated(updated, lang),
    current,
    today,
    advice: buildAdvice(today, lang),
    daily: days,
    stale: false,
  };
}

let cache: { ts: number; lang: Lang; data: WeatherView } | null = null;

export async function fetchWeather(lang: Lang): Promise<WeatherView> {
  const now = Date.now();
  if (cache && cache.lang === lang && now - cache.ts < 30 * 60 * 1000) {
    return cache.data;
  }
  const res = await fetch(OPEN_METEO_URL, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "hanmarket-guide/1.0" },
    });
    if (!res.ok) throw new Error("open-meteo " + res.status);
    const data = await res.json();
    const view = normalize(data, lang);
    cache = { ts: now, lang, data: view };
    return view;
}

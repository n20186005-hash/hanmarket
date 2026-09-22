// Cloudflare Worker: serve the statically generated Astro site through the ASSETS binding,
// plus a server-side, edge-cached weather endpoint backed by Open-Meteo.
import { fetchWeather } from "./lib/weather";

export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/weather") {
      const lang = url.searchParams.get("lang") === "vi" ? "vi" : "en";
      try {
        const data = await fetchWeather(lang);
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=1800, s-maxage=1800",
          },
        });
      } catch {
        return new Response(JSON.stringify({ error: "unavailable" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    return env.ASSETS.fetch(request);
  },
};

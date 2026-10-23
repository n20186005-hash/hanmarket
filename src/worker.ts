import { fetchWeather } from "./lib/weather";
export interface Env { ASSETS: { fetch(request: Request): Promise<Response> }; }
export default {
 async fetch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.protocol === "http:" && url.hostname === "hanmarket.org") {url.protocol="https:";return Response.redirect(url.toString(),308);}
  if (url.pathname === "/api/weather") {
   if (request.method !== "GET") return new Response(null,{status:405,headers:{Allow:"GET","Cache-Control":"no-store"}});
   try { const data=await fetchWeather(url.searchParams.get("lang")==="vi"?"vi":"en");return Response.json(data,{headers:{"Cache-Control":"public, max-age=1800, s-maxage=1800"}}); }
   catch {return Response.json({error:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});}
  }
  const response=await env.ASSETS.fetch(request);
  if (response.status === 404 || /^\/(?:en\/)?404(?:\.html|\/)?$/.test(url.pathname)) {
   // The Assets binding serves the designed error page at /404; /404.html redirects.
   const page=await env.ASSETS.fetch(new Request(new URL("/404",url),{method:"GET",headers:request.headers}));
   const headers=new Headers(page.headers);headers.delete("Location");headers.set("X-Robots-Tag","noindex, follow");headers.set("Cache-Control","no-store");
   return new Response(request.method === "HEAD" ? null : page.body,{status:404,headers});
  }
  return response;
 }
};

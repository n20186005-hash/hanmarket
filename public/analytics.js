(() => {
  const key = "han-market-analytics-consent", id = "G-HXM22WWPKP";
  let granted = false;
  let initialized = Boolean(document.querySelector("script[data-han-market-ga]"));
  try { granted = localStorage.getItem(key) === "granted"; } catch {}
  function command() { (window.dataLayer ||= []).push(arguments); }
  const apply = (allow) => {
    granted = allow;
    window["ga-disable-" + id] = !allow;
    if (!allow) {
      if (window.dataLayer) command("consent", "update", {analytics_storage:"denied", ad_storage:"denied", ad_user_data:"denied", ad_personalization:"denied"});
      for (const part of document.cookie.split(";")) {
        const name = part.trim().split("=")[0];
        if (!/^_ga(?:_|$)|^_gid$|^_gat/.test(name)) continue;
        for (const domain of ["", location.hostname, "." + location.hostname]) document.cookie = name + "=; Max-Age=0; path=/; SameSite=Lax" + (domain ? "; domain=" + domain : "");
      }
      return;
    }
    command("consent", "update", {analytics_storage:"granted", ad_storage:"denied", ad_user_data:"denied", ad_personalization:"denied"});
    if (initialized) return;
    initialized = true;
    const ga = document.createElement("script");
    ga.async = true; ga.src = "https://www.googletagmanager.com/gtag/js?id=" + id; ga.dataset.hanMarketGa = "true";
    command("js", new Date()); command("config", id, {anonymize_ip:true});
    document.head.appendChild(ga);
  };
  window.hanAnalytics = { get: () => granted, set: (allow) => {
    if (!allow) apply(false);
    const value = allow ? "granted" : "denied";
    try {
      localStorage.setItem(key, value);
      if (localStorage.getItem(key) !== value) { apply(false); return false; }
    } catch { apply(false); return false; }
    if (allow) apply(true);
    return true;
  }};
  window.addEventListener("storage", event => { if (event.key === key || event.key === null) apply(event.key === key && event.newValue === "granted"); });
  apply(granted);
})();

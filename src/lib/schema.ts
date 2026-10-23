// Structured data for Han Market, centralised for both language homepages.
// Only valid schema.org types are used ("@type": "Market" is not a valid schema.org type).
// Both languages share a single language-agnostic @id so Google resolves them to one entity.
import { market, text, type Language } from "../data/content";

const FALLBACK_ROOT = "https://hanmarket.org";

function root(siteBase?: string): string {
  return (siteBase || FALLBACK_ROOT).replace(/\/$/, "");
}

export function buildSchemas(lang: Language, siteBase?: string): Record<string, unknown>[] {
  const c = text[lang];
  const siteRoot = root(siteBase);
  const pageUrl = siteRoot + (lang === "vi" ? "/" : "/en/");


  const attraction: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["TouristAttraction", "Place"],
    "@id": `${siteRoot}/#attraction`,
    name: lang === "vi" ? "Chợ Hàn" : "Han Market",
    alternateName: lang === "vi" ? ["Han Market", "Đà Nẵng Chợ Hàn"] : ["Chợ Hàn", "Da Nang Han Market"],
    description: c.meta.description,
    url: pageUrl,
    image: [`${siteRoot}/images/han-market-overview.jpg`, `${siteRoot}/images/han-market-vegetables.jpg`, `${siteRoot}/images/han-market-produce.jpg`],
    address: {
      "@type": "PostalAddress",
      streetAddress: "119 Trần Phú",
      addressLocality: "Hải Châu",
      addressRegion: "Đà Nẵng",
      postalCode: "550000",
      addressCountry: "VN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: market.geo.latitude,
      longitude: market.geo.longitude,
    },
    hasMap: market.mapsShareUrl,
    sameAs: [market.mapsShareUrl],
  };

  const faq: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.items.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return [attraction, faq];
}

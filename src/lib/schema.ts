// Structured data for Han Market, centralised for both language homepages.
// Only valid schema.org types are used ("@type": "Market" is not a valid schema.org type).
// Both languages share a single language-agnostic @id so Google resolves them to one entity.
import { market, text, type Language } from "../data/content";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const FALLBACK_ROOT = "https://hanmarket.org";

function root(siteBase?: string): string {
  return (siteBase || FALLBACK_ROOT).replace(/\/$/, "");
}

export function buildSchemas(lang: Language, siteBase?: string): Record<string, unknown>[] {
  const c = text[lang];
  const siteRoot = root(siteBase);
  const pageUrl = siteRoot + (lang === "vi" ? "/" : "/en/");
  const [opens, closes] = market.hours.split(/[–-]/).map((s) => s.trim());

  const attraction: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["TouristAttraction", "LocalBusiness"],
    "@id": `${siteRoot}/#attraction`,
    name: lang === "vi" ? "Chợ Hàn" : "Han Market",
    alternateName: lang === "vi" ? ["Han Market", "Đà Nẵng Chợ Hàn"] : ["Chợ Hàn", "Da Nang Han Market"],
    description: c.meta.description,
    url: pageUrl,
    image: [`${siteRoot}/images/han-market-exterior.jpg`, `${siteRoot}/images/han-market-interior.jpg`, `${siteRoot}/images/han-river.jpg`],
    isAccessibleForFree: true,
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
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: DAYS, opens, closes },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: market.rating.value,
      reviewCount: market.rating.count,
      bestRating: "5",
    },
    sameAs: [market.mapsShareUrl, market.govTourismUrl],
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

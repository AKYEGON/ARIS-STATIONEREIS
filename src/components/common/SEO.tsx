import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  structuredData?: object | object[];
  noindex?: boolean;
  breadcrumbs?: { name: string; url: string }[];
}

const BASE_URL = "https://www.arisstationaries.co.ke";

const SEO = ({
  title,
  description,
  keywords = "ARIS Kenya, student platform Kenya, course kits Kenya, campus stationery Nairobi, UoN, KU, JKUAT, Strathmore, USIU, affordable stationery Kenya",
  canonicalUrl,
  ogImage = "/favicon.png",
  ogType = "website",
  structuredData,
  noindex = false,
  breadcrumbs,
}: SEOProps) => {
  const fullTitle = title.includes("ARIS") || title.includes("Aris")
    ? title
    : `${title} | ARIS`;
  const fullUrl = canonicalUrl ? `${BASE_URL}${canonicalUrl}` : BASE_URL;
  const fullOgImage = ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`;

  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: b.url.startsWith("http") ? b.url : `${BASE_URL}${b.url}`,
        })),
      }
    : null;

  const schemas: object[] = [];
  if (structuredData) {
    if (Array.isArray(structuredData)) schemas.push(...structuredData);
    else schemas.push(structuredData);
  }
  if (breadcrumbSchema) schemas.push(breadcrumbSchema);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1"} />

      {/* Canonical & locale */}
      <link rel="canonical" href={fullUrl} />
      <link rel="alternate" hrefLang="en-ke" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="ARIS" />
      <meta property="og:locale" content="en_KE" />

      {/* Twitter / WhatsApp */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* Structured Data */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;

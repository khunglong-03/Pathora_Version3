/**
 * SEOHead — injects JSON-LD structured data into the page <head>.
 *
 * Usage (in a Server Component layout/page):
 *   <SEOHead jsonLd={buildWebPageJsonLd({ title: "...", description: "..." })} />
 *
 * Can be called multiple times per page (e.g. WebPage + Breadcrumb + Product).
 */

interface SEOHeadProps {
  jsonLd: string | string[];
}

export default function SEOHead({ jsonLd }: SEOHeadProps) {
  const scripts = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

  return (
    <>
      {scripts.map((script, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: script }}
        />
      ))}
    </>
  );
}

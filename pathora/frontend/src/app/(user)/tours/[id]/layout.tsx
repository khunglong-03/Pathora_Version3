import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { API_GATEWAY_BASE_URL } from "@/configs/apiGateway";
import { SITE_NAME, SITE_URL } from "@/configs/site";
import { buildAlternates, buildWebPageJsonLd, buildBreadcrumbJsonLd } from "@/utils/seoMetadata";
import SEOHead from "@/components/seo/SEOHead";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

async function fetchTour(id: string) {
  try {
    const baseUrl = API_GATEWAY_BASE_URL.replace(/\/+$/, "");
    const res = await fetch(`${baseUrl}/api/tours/${id}`, {
      credentials: "include",
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result ?? data.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tour = await fetchTour(id);

  if (!tour) {
    return {
      title: "Tour Not Found",
      robots: { index: false, follow: false },
    };
  }

  const description =
    (tour.seoDescription ?? tour.shortDescription ?? "").slice(0, 160) ||
    `Explore ${tour.tourName} with Pathora. Book your tour now.`;

  const ogImageUrl =
    tour.thumbnail?.publicURL ?? tour.images?.[0]?.publicURL;

  const canonicalPath = `/tours/${id}`;
  const absoluteUrl = `${SITE_URL}${canonicalPath}`;

  return {
    title: tour.tourName,
    description,
    keywords: [tour.tourName, "tour", "travel", SITE_NAME],
    alternates: buildAlternates(canonicalPath),
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title: tour.tourName,
      description,
      url: absoluteUrl,
      images: ogImageUrl
        ? [{ url: ogImageUrl, alt: tour.tourName, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      site: `@${SITE_NAME.toLowerCase()}`,
      title: tour.tourName,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default async function TourDetailLayout({ children, params }: Props) {
  const { id } = await params;
  const tour = await fetchTour(id);

  if (!tour) notFound();

  const canonicalPath = `/tours/${id}`;
  const absoluteUrl = `${SITE_URL}${canonicalPath}`;

  const jsonLd = [
    buildWebPageJsonLd({
      url: absoluteUrl,
      title: tour.tourName,
      description:
        (tour.seoDescription ?? tour.shortDescription ?? "").slice(0, 160) ||
        `Explore ${tour.tourName} with Pathora.`,
      image: tour.thumbnail?.publicURL,
      type: "WebPage",
    }),
    buildBreadcrumbJsonLd([
      { name: "Home", url: "/" },
      { name: "Tours", url: "/tours" },
      { name: tour.tourName, url: absoluteUrl },
    ]),
  ];

  return (
    <>
      <SEOHead jsonLd={jsonLd} />
      {children}
    </>
  );
}

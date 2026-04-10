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

async function fetchTourInstance(id: string) {
  try {
    const baseUrl = API_GATEWAY_BASE_URL.replace(/\/+$/, "");
    const res = await fetch(`${baseUrl}/api/public/tour-instances/${id}`, {
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
  const instance = await fetchTourInstance(id);

  if (!instance) {
    return {
      title: "Tour Instance Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = instance.title || `Tour Instance ${id}`;
  const description = instance.location
    ? `Join our tour: ${title} in ${instance.location}. Book your spot now with Pathora.`
    : `Join our tour: ${title}. Book your spot now with Pathora.`;
  const ogImage = instance.thumbnail?.publicURL ?? instance.images?.[0]?.publicURL;

  const canonicalPath = `/tours/instances/${id}`;
  const absoluteUrl = `${SITE_URL}${canonicalPath}`;

  return {
    title,
    description,
    keywords: [title, "tour", "travel", "booking", SITE_NAME],
    alternates: buildAlternates(canonicalPath),
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      description,
      url: absoluteUrl,
      images: ogImage ? [{ url: ogImage, alt: title, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      site: `@${SITE_NAME.toLowerCase()}`,
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function TourInstanceDetailLayout({ children, params }: Props) {
  const { id } = await params;
  const instance = await fetchTourInstance(id);

  if (!instance) notFound();

  const title = instance.title || `Tour Instance ${id}`;
  const description = instance.location
    ? `Join our tour: ${title} in ${instance.location}. Book your spot now with Pathora.`
    : `Join our tour: ${title}. Book your spot now with Pathora.`;
  const canonicalPath = `/tours/instances/${id}`;
  const absoluteUrl = `${SITE_URL}${canonicalPath}`;

  const jsonLd = [
    buildWebPageJsonLd({
      url: absoluteUrl,
      title,
      description,
      image: instance.thumbnail?.publicURL,
      type: "WebPage",
    }),
    buildBreadcrumbJsonLd([
      { name: "Home", url: "/" },
      { name: "Tours", url: "/tours" },
      { name: title, url: absoluteUrl },
    ]),
  ];

  return (
    <>
      <SEOHead jsonLd={jsonLd} />
      {children}
    </>
  );
}

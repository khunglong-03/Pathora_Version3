import type { Metadata } from "next";
import { API_GATEWAY_BASE_URL } from "@/configs/apiGateway";

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
      title: "Tour Instance Not Found | Pathora",
      robots: { index: false, follow: false },
    };
  }

  const title = instance.title || `Tour Instance ${id}`;
  const description = instance.location
    ? `Join our tour: ${title} in ${instance.location}. Book your spot now with Pathora.`
    : `Join our tour: ${title}. Book your spot now with Pathora.`;
  const ogImage =
    instance.thumbnail?.publicURL ?? instance.images?.[0]?.publicURL;

  return {
    title: `${title} | Pathora`,
    description,
    keywords: [title, "tour", "travel", "booking", "Pathora"],
    openGraph: {
      title: `${title} | Pathora`,
      description,
      type: "article",
      images: ogImage ? [{ url: ogImage, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Pathora`,
      description,
    },
  };
}

export default function TourInstanceDetailLayout({ children }: Props) {
  return <>{children}</>;
}

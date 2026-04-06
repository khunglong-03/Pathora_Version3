import type { Metadata } from "next";
import { API_GATEWAY_BASE_URL } from "@/configs/apiGateway";

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
    // Extract result from ErrorOr<T> wrapper
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
      title: "Tour Not Found | Pathora",
      robots: { index: false, follow: false },
    };
  }

  const description =
    (tour.seoDescription ?? tour.shortDescription ?? "").slice(0, 160) ||
    `Explore ${tour.tourName} with Pathora. Book your tour now.`;
  const ogImage =
    tour.thumbnail?.publicURL ?? tour.images?.[0]?.publicURL;

  return {
    title: `${tour.tourName} | Pathora`,
    description,
    keywords: [tour.tourName, "tour", "travel", "Pathora"],
    openGraph: {
      title: `${tour.tourName} | Pathora`,
      description,
      type: "article",
      images: ogImage ? [{ url: ogImage, alt: tour.tourName }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${tour.tourName} | Pathora`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default function TourDetailLayout({ children }: Props) {
  return <>{children}</>;
}

export const PREMIUM_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop", // Halong Bay
  "https://images.unsplash.com/photo-1557315124-bcaabff02008?q=80&w=2070&auto=format&fit=crop", // Hanoi Temple
  "https://images.unsplash.com/photo-1540306129994-0cfce28328f4?q=80&w=2048&auto=format&fit=crop", // Bali Rice Terraces
  "https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=2000&auto=format&fit=crop", // Tokyo Cityscape / Shrine
  "https://images.unsplash.com/photo-1506452819137-0422416856b8?q=80&w=2000&auto=format&fit=crop", // Mountains / Asia
  "https://images.unsplash.com/photo-1550605330-804153eb268a?q=80&w=2127&auto=format&fit=crop", // Thai Islands
  "https://images.unsplash.com/photo-1562602833-0f4ab021fb15?q=80&w=2070&auto=format&fit=crop", // Old architecture
  "https://images.unsplash.com/photo-1520635441113-dcfd9ab5774a?q=80&w=2000&auto=format&fit=crop", // Kyoto
];

/**
 * Returns a consistent high-quality fallback image based on a string ID or deterministic index
 */
export const getFallbackImage = (idOrIndex: string | number): string => {
  if (typeof idOrIndex === "number") {
    return PREMIUM_FALLBACK_IMAGES[Math.max(0, idOrIndex) % PREMIUM_FALLBACK_IMAGES.length];
  }
  
  // Use a simple sum of char codes to consistently pick an image
  let hash = 0;
  for (let i = 0; i < idOrIndex.length; i++) {
    hash = idOrIndex.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PREMIUM_FALLBACK_IMAGES.length;
  return PREMIUM_FALLBACK_IMAGES[index];
};

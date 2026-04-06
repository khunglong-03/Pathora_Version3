/**
 * Format currency helper functions
 */

/**
 * Format a number as Vietnamese Dong (VND) currency
 * @param value - The number to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0 ₫";
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

/**
 * Calculate discount percentage between original price and sale price
 * @param originalPrice - The original price
 * @param salePrice - The sale price
 * @returns Discount percentage (0-100)
 */
export const calculateDiscount = (originalPrice: number, salePrice: number): number => {
  if (!originalPrice || !salePrice || originalPrice <= 0 || salePrice <= 0) {
    return 0;
  }
  if (salePrice >= originalPrice) {
    return 0;
  }
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

/**
 * Format date string to local date and time string
 * @param dateString - ISO date string (e.g., "2025-12-07T14:01:45.3036686+00:00")
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      ...options,
    };

    return new Intl.DateTimeFormat(navigator.language || "vi-VN", defaultOptions).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

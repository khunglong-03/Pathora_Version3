export interface ProviderRoomOption {
  roomType: string;
  label: string;
  totalRooms: number;
}

type ProviderRoomOptionLike = {
  roomType: string;
  label?: string | null;
  totalRooms: number;
};

type ProviderRoomOptionContainer = {
  roomOptions?: ProviderRoomOptionLike[] | null;
  accommodations?: ProviderRoomOptionLike[] | null;
};

const normalizeRoomType = (roomType?: string | null) => roomType?.trim() ?? "";

export const buildProviderRoomOptions = (
  items: ProviderRoomOptionLike[] | null | undefined,
): ProviderRoomOption[] => {
  const byRoomType = new Map<string, ProviderRoomOption>();

  for (const item of items ?? []) {
    const roomType = normalizeRoomType(item.roomType);
    if (!roomType) continue;

    const existing = byRoomType.get(roomType);
    if (existing) {
      existing.totalRooms += item.totalRooms;
      if (!existing.label.trim() && item.label?.trim()) {
        existing.label = item.label.trim();
      }
      continue;
    }

    byRoomType.set(roomType, {
      roomType,
      label: normalizeRoomType(item.label) || roomType,
      totalRooms: item.totalRooms,
    });
  }

  return Array.from(byRoomType.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
};

export const getProviderRoomOptions = (
  detail: ProviderRoomOptionContainer | null | undefined,
): ProviderRoomOption[] => {
  if (!detail) return [];

  const roomOptions = buildProviderRoomOptions(detail.roomOptions);
  if (roomOptions.length > 0) {
    return roomOptions;
  }

  return buildProviderRoomOptions(detail.accommodations);
};

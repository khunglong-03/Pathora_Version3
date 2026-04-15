import dynamic from "next/dynamic";

const StaffScheduleCalendar = dynamic(
  () => import("@/features/dashboard/components/StaffScheduleCalendar"),
);

export default function StaffSchedulePage() {
  return <StaffScheduleCalendar />;
}

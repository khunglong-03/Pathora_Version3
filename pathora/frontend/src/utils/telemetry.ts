type TelemetryPayload = Record<string, string | number | boolean | null | undefined>;

export const logTourOperatorEvent = (
  eventName:
    | "booking_flight_confirmed"
    | "booking_accommodation_assigned"
    | "booking_accommodation_requirements_set",
  payload: TelemetryPayload,
) => {
  const cleanedPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );

  console.info(`[telemetry] ${eventName}`, cleanedPayload);
};

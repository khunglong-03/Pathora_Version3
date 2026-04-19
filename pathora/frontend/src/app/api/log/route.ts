import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("==========================================");
    console.log("=== NEXT.JS SERVER LOG: TOUR PAYLOAD ===");
    console.log("==========================================");
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
        try {
          console.log(`[${key}]:`, JSON.parse(value));
        } catch {
          console.log(`[${key}]:`, value);
        }
      } else {
        console.log(`[${key}]:`, value);
      }
    });
    console.log("==========================================");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to parse log data:", error);
    return NextResponse.json({ error: "Failed to log" }, { status: 500 });
  }
}

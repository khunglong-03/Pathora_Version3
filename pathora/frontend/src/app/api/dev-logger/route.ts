import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Chỉ cho phép hoạt động ở môi trường dev để tránh rò rỉ log trên production
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  try {
    const data = await request.json();
    console.log(`\n\x1b[41m\x1b[37m 🔥 [API ERROR PAYLOAD] \x1b[0m \x1b[36m[${data.method || "UNKNOWN"}] ${data.url || "Unknown URL"}\x1b[0m`);
    
    // In toàn bộ object ra terminal dạng format cực kỳ dễ nhìn và copy
    console.dir(data.payload, { depth: null, colors: true });
    
    console.log("\x1b[90m--------------------------------------------------------\x1b[0m\n");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "last-mile-control-tower",
    timestamp: new Date().toISOString(),
  });
}

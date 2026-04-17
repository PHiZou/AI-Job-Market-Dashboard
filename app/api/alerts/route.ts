import { NextResponse } from "next/server";
import { loadAlerts } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await loadAlerts());
}

import { NextResponse } from "next/server";
import { loadForecasts } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await loadForecasts());
}

import { NextResponse } from "next/server";
import { loadTrends } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await loadTrends());
}

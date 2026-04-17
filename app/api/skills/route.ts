import { NextResponse } from "next/server";
import { loadSkills } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await loadSkills());
}

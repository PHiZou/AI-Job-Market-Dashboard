import { NextResponse } from "next/server";
import { loadCompanies } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await loadCompanies());
}

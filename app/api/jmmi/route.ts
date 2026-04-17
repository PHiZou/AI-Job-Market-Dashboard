import { NextResponse } from "next/server";
import { loadJMMI } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await loadJMMI());
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Diagnostic: env presence + which DB this deployment connects to.
export async function GET() {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  let dbHost = "";
  try {
    dbHost = new URL(process.env.DATABASE_URL ?? "").host; // host only, no creds
  } catch {}
  let dbOk = false;
  let dbErr = "";
  try {
    await prisma.user.count();
    dbOk = true;
  } catch (e) {
    dbErr = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json({
    googleConfigured: id.length > 0,
    dbHost,
    dbOk,
    dbErr,
  });
}

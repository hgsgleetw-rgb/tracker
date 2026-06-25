import { NextResponse } from "next/server";

// Tiny diagnostic: is NEXT_PUBLIC_GOOGLE_CLIENT_ID present in this deployment?
// Returns only presence + length (never the value).
export async function GET() {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  return NextResponse.json({
    googleConfigured: id.length > 0,
    googleLen: id.length,
    liffConfigured: (process.env.NEXT_PUBLIC_LIFF_ID ?? "").length > 0,
  });
}

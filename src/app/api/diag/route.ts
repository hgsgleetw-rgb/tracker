import { NextResponse } from "next/server";

// Diagnostic: is NEXT_PUBLIC_GOOGLE_CLIENT_ID present? (presence + length only)
export async function GET() {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  return NextResponse.json({
    googleConfigured: id.length > 0,
    googleLen: id.length,
    liffConfigured: (process.env.NEXT_PUBLIC_LIFF_ID ?? "").length > 0,
  });
}

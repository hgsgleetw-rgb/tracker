import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { loadAppState } from "@/lib/state";

// Full app state for the authenticated user.
export async function GET(request: Request) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  try {
    const state = await loadAppState(auth.user.id);
    return NextResponse.json(state);
  } catch (e) {
    console.error("[state]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { resolveGroupId, ensureInviteCode } from "@/lib/state";

// Generate (or return) the share-link invite code for a group. Members only.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  try {
    const dbGroupId = await resolveGroupId(auth.user.id, id);
    if (!dbGroupId) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const code = await ensureInviteCode(dbGroupId);
    return NextResponse.json({ code });
  } catch (e) {
    console.error("[invite]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

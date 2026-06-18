import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Patch user-level flags: tutorialDone, activeGroupId.
export async function PATCH(request: Request) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  try {
    const body = (await request.json()) as {
      tutorialDone?: boolean;
      activeGroupId?: string | null;
    };
    const data: { tutorialDone?: boolean; activeGroupId?: string | null } = {};
    if (typeof body.tutorialDone === "boolean") data.tutorialDone = body.tutorialDone;
    if ("activeGroupId" in body) data.activeGroupId = body.activeGroupId ?? null;

    await prisma.user.update({ where: { id: auth.user.id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[user PATCH]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

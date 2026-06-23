import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { persistGroup } from "@/lib/state";
import type { Group } from "@/app/_components/data";

// Create a new group (and make it active).
export async function POST(request: Request) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  try {
    const { group } = (await request.json()) as { group: Group };
    if (!group?.id) return NextResponse.json({ error: "Missing group" }, { status: 400 });

    const count = await prisma.group.count({ where: { userId: auth.user.id } });
    await persistGroup(auth.user.id, group, count);
    // The demo example is tutorial-only; retire it once a real group exists.
    await prisma.group.deleteMany({ where: { userId: auth.user.id, isDemo: true } });
    await prisma.user.update({
      where: { id: auth.user.id },
      data: { activeGroupId: group.id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[groups POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

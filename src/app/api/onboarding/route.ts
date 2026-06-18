import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { persistGroup } from "@/lib/state";
import type { Group } from "@/app/_components/data";

// Complete onboarding: set userName, persist the demo group, mark onboarded.
export async function POST(request: Request) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  try {
    const { userName, group } = (await request.json()) as {
      userName: string;
      group: Group;
    };
    if (!userName || !group?.id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Idempotent: clear any prior groups for this user before seeding.
    await prisma.group.deleteMany({ where: { userId: auth.user.id } });
    await persistGroup(auth.user.id, group, 0);
    await prisma.user.update({
      where: { id: auth.user.id },
      data: { userName, onboarded: true, tutorialDone: false, activeGroupId: group.id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[onboarding]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

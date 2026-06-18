import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { AppState, Group, Member, Expense } from "@/app/_components/data";

// Shape of a Group row with its members + expenses + splits included.
type GroupWithRelations = Prisma.GroupGetPayload<{
  include: {
    members: true;
    expenses: { include: { splits: true } };
  };
}>;

// isMe is viewer-relative: the member occupied by the requesting user.
function toClientGroup(g: GroupWithRelations, viewerUserId: string): Group {
  return {
    id: g.clientId,
    name: g.name,
    usePool: g.usePool,
    isDemo: g.isDemo,
    pool: g.pool,
    team: g.members.map((m) => ({
      id: m.clientId,
      name: m.name,
      zh: m.zh,
      tone: m.tone as Member["tone"],
      isMe: m.userId === viewerUserId,
    })),
    expenses: g.expenses.map((e) => ({
      id: e.clientId,
      at: e.at.getTime(),
      category: e.category,
      note: e.note,
      payerId: e.payerId,
      amount: e.amount,
      splitWith: e.splits.map((s) => s.memberId),
    })),
  };
}

/** Full client-shaped AppState — all groups the user participates in. */
export async function loadAppState(userId: string): Promise<AppState> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const groups = await prisma.group.findMany({
    where: { members: { some: { userId } } },
    orderBy: { position: "asc" },
    include: {
      members: { orderBy: { position: "asc" } },
      expenses: { orderBy: { at: "desc" }, include: { splits: true } },
    },
  });
  return {
    onboarded: user.onboarded,
    tutorialDone: user.tutorialDone,
    userName: user.userName,
    activeGroupId: user.activeGroupId,
    groups: groups.map((g) => toClientGroup(g, userId)),
  };
}

/**
 * Resolve a DB group id from a client group id, granting access to ANY
 * member of the group (not just its creator).
 */
export async function resolveGroupId(
  userId: string,
  clientGroupId: string
): Promise<string | null> {
  const g = await prisma.group.findFirst({
    where: { clientId: clientGroupId, members: { some: { userId } } },
    select: { id: true },
  });
  return g?.id ?? null;
}

/** Persist a client-built Group; link the "me" member to its creator. */
export async function persistGroup(
  creatorUserId: string,
  group: Group,
  position: number
): Promise<void> {
  await prisma.group.create({
    data: {
      userId: creatorUserId,
      clientId: group.id,
      name: group.name,
      usePool: !!group.usePool,
      isDemo: !!group.isDemo,
      pool: group.pool ?? 0,
      position,
      members: {
        create: group.team.map((m, i) => ({
          clientId: m.id,
          name: m.name,
          zh: m.zh,
          tone: m.tone,
          isMe: !!m.isMe,
          position: i,
          userId: m.isMe ? creatorUserId : null,
        })),
      },
      expenses: {
        create: group.expenses.map((e) => ({
          clientId: e.id,
          category: e.category,
          note: e.note ?? "",
          amount: e.amount,
          payerId: e.payerId,
          at: new Date(e.at),
          splits: { create: e.splitWith.map((memberId) => ({ memberId })) },
        })),
      },
    },
  });
}

/** Insert or update a single expense (used for both add and edit). */
export async function upsertExpense(dbGroupId: string, e: Expense): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findUnique({
      where: { groupId_clientId: { groupId: dbGroupId, clientId: e.id } },
      select: { id: true },
    });
    if (existing) {
      await tx.expenseSplit.deleteMany({ where: { expenseId: existing.id } });
      await tx.expense.update({
        where: { id: existing.id },
        data: {
          category: e.category,
          note: e.note ?? "",
          amount: e.amount,
          payerId: e.payerId,
          at: new Date(e.at),
          splits: { create: e.splitWith.map((memberId) => ({ memberId })) },
        },
      });
    } else {
      await tx.expense.create({
        data: {
          groupId: dbGroupId,
          clientId: e.id,
          category: e.category,
          note: e.note ?? "",
          amount: e.amount,
          payerId: e.payerId,
          at: new Date(e.at),
          splits: { create: e.splitWith.map((memberId) => ({ memberId })) },
        },
      });
    }
  });
}

const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars

/** Get the group's invite code, creating one if it doesn't exist yet. */
export async function ensureInviteCode(dbGroupId: string): Promise<string> {
  const g = await prisma.group.findUniqueOrThrow({
    where: { id: dbGroupId },
    select: { inviteCode: true },
  });
  if (g.inviteCode) return g.inviteCode;

  // Retry on the rare unique collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = "";
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    for (const b of bytes) code += INVITE_ALPHABET[b % INVITE_ALPHABET.length];
    try {
      const updated = await prisma.group.update({
        where: { id: dbGroupId },
        data: { inviteCode: code },
        select: { inviteCode: true },
      });
      return updated.inviteCode!;
    } catch {
      // collision — try a new code
    }
  }
  throw new Error("Could not generate invite code");
}

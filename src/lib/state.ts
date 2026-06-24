import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { AppState, Group, Member, Expense } from "@/app/_components/data";

// Shape of a Group row with its members + expenses + splits + requests included.
type GroupWithRelations = Prisma.GroupGetPayload<{
  include: {
    members: { include: { user: { select: { id: true; avatarVersion: true } } } };
    expenses: { include: { splits: true } };
    requests: true;
  };
}>;

function requestLabel(
  req: GroupWithRelations["requests"][number],
  members: GroupWithRelations["members"]
): string {
  if (req.claimMemberId) {
    const slot = members.find((m) => m.clientId === req.claimMemberId);
    return `${req.requesterName} 想成為「${slot?.name ?? req.claimMemberId}」`;
  }
  return `${req.requesterName} 想以「${req.newName ?? req.requesterName}」加入`;
}

// isMe is viewer-relative: the member occupied by the requesting user.
function toClientGroup(g: GroupWithRelations, viewerUserId: string): Group {
  const isAdmin = g.userId === viewerUserId;
  return {
    id: g.clientId,
    name: g.name,
    usePool: g.usePool,
    isDemo: g.isDemo,
    isAdmin,
    pool: g.pool,
    team: g.members.map((m) => ({
      id: m.clientId,
      name: m.name,
      zh: m.zh,
      tone: m.tone as Member["tone"],
      isMe: m.userId === viewerUserId,
      isUser: m.userId !== null,
      isAdmin: m.userId !== null && m.userId === g.userId,
      avatarUrl:
        m.user && m.user.avatarVersion > 0
          ? `/api/avatar/${m.user.id}?v=${m.user.avatarVersion}`
          : undefined,
    })),
    expenses: g.expenses.map((e) => ({
      id: e.clientId,
      at: e.at.getTime(),
      category: e.category,
      note: e.note,
      payerId: e.payerId,
      amount: e.amount,
      splitWith: e.splits.map((s) => s.memberId),
      fromPool: e.fromPool,
      editedAt: e.editedAt ? e.editedAt.getTime() : undefined,
      editedByName: e.editedByName ?? undefined,
    })),
    // Only the admin needs to see (and act on) pending requests.
    pendingRequests: isAdmin
      ? g.requests.map((r) => ({ id: r.id, label: requestLabel(r, g.members) }))
      : undefined,
  };
}

/** Full client-shaped AppState — all groups the user participates in. */
export async function loadAppState(userId: string): Promise<AppState> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const groups = await prisma.group.findMany({
    where: { members: { some: { userId } } },
    orderBy: { position: "asc" },
    include: {
      members: {
        orderBy: { position: "asc" },
        include: { user: { select: { id: true, avatarVersion: true } } },
      },
      expenses: { orderBy: { at: "desc" }, include: { splits: true } },
      requests: true,
    },
  });
  // Groups the user has applied to but isn't yet a member of.
  const pendingReqs = await prisma.joinRequest.findMany({
    where: { userId },
    include: { group: { select: { name: true } } },
  });
  return {
    onboarded: user.onboarded,
    tutorialDone: user.tutorialDone,
    userName: user.userName,
    activeGroupId: user.activeGroupId,
    groups: groups.map((g) => toClientGroup(g, userId)),
    pending: pendingReqs.map((r) => ({ groupName: r.group.name })),
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
          fromPool: !!e.fromPool,
          at: new Date(e.at),
          splits: { create: e.splitWith.map((memberId) => ({ memberId })) },
        })),
      },
    },
  });
}

/**
 * Decide whether `userId` may edit/delete an existing expense.
 * Returns "new" when no such expense exists yet (creating is always allowed
 * for members), "allowed", or "denied".
 *  - Fund expenses: anyone may edit (communal money).
 *  - Personal expenses: only the payer themselves; if the payer is an
 *    unclaimed label, the group admin may manage it.
 */
export async function canEditExpense(
  dbGroupId: string,
  clientId: string,
  userId: string
): Promise<"new" | "allowed" | "denied"> {
  const exp = await prisma.expense.findUnique({
    where: { groupId_clientId: { groupId: dbGroupId, clientId } },
    select: { fromPool: true, payerId: true },
  });
  if (!exp) return "new";
  if (exp.fromPool) return "allowed";
  const group = await prisma.group.findUnique({
    where: { id: dbGroupId },
    select: { userId: true },
  });
  const payer = await prisma.member.findUnique({
    where: { groupId_clientId: { groupId: dbGroupId, clientId: exp.payerId } },
    select: { userId: true },
  });
  if (payer?.userId === userId) return "allowed";
  if (!payer?.userId && group?.userId === userId) return "allowed";
  return "denied";
}

/**
 * Whether `userId` may DELETE an expense. Stricter than editing: deletion is
 * unlogged, so even fund expenses can only be removed by the person who
 * recorded them (the payer) — or by the admin for unclaimed-label expenses.
 */
export async function canDeleteExpense(
  dbGroupId: string,
  clientId: string,
  userId: string
): Promise<"missing" | "allowed" | "denied"> {
  const exp = await prisma.expense.findUnique({
    where: { groupId_clientId: { groupId: dbGroupId, clientId } },
    select: { payerId: true },
  });
  if (!exp) return "missing";
  const group = await prisma.group.findUnique({
    where: { id: dbGroupId },
    select: { userId: true },
  });
  const payer = await prisma.member.findUnique({
    where: { groupId_clientId: { groupId: dbGroupId, clientId: exp.payerId } },
    select: { userId: true },
  });
  if (payer?.userId === userId) return "allowed";
  if (!payer?.userId && group?.userId === userId) return "allowed";
  return "denied";
}

/** Insert or update a single expense (used for both add and edit). */
export async function upsertExpense(
  dbGroupId: string,
  e: Expense,
  editorName: string
): Promise<void> {
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
          fromPool: !!e.fromPool,
          // Record every edit (audit trail) — shown as 已編輯 in the UI.
          editedAt: new Date(),
          editedByName: editorName,
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
          fromPool: !!e.fromPool,
          at: new Date(e.at),
          splits: { create: e.splitWith.map((memberId) => ({ memberId })) },
        },
      });
    }
  });
}

/**
 * Add a user to a group as a member — by claiming an open slot or as a new
 * member. Used when an admin approves a join request.
 */
export async function addUserToGroup(
  dbGroupId: string,
  userId: string,
  displayName: string,
  opts: { claimMemberId?: string | null; newName?: string | null }
): Promise<void> {
  const members = await prisma.member.findMany({ where: { groupId: dbGroupId } });
  if (members.some((m) => m.userId === userId)) return; // already in

  if (opts.claimMemberId) {
    const target = members.find((m) => m.clientId === opts.claimMemberId);
    if (target && !target.userId) {
      await prisma.member.update({ where: { id: target.id }, data: { userId } });
      return;
    }
    // slot vanished or got claimed — fall through to joining as new
  }
  const name = (opts.newName || displayName || "我").trim().slice(0, 20);
  const tone = (members.length % 6) + 1;
  const clientId = `m_${userId.slice(-6)}_${members.length}`;
  await prisma.member.create({
    data: {
      groupId: dbGroupId,
      clientId,
      name,
      zh: name,
      tone,
      position: members.length,
      userId,
    },
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

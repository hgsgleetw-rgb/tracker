// Client-side API helper. All calls carry the LINE access token for auth.
import type { AppState, Group, Expense, Member } from "@/app/_components/data";

// Resolve the auth token freshly on every call so an expired/refreshed LINE
// token (e.g. after the app sits idle) is always picked up.
let tokenGetter: (() => string | null) | null = null;

export function setTokenGetter(fn: () => string | null) {
  tokenGetter = fn;
}

// Back-compat: a static token still works.
export function setAuthToken(token: string | null) {
  tokenGetter = () => token;
}

async function call<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = tokenGetter ? tokenGetter() : null;
  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`${res.status} ${path} ${msg}`);
  }
  return (await res.json()) as T;
}

export const api = {
  getState: () => call<AppState>("/api/state"),

  onboarding: (userName: string, group: Group) =>
    call("/api/onboarding", { method: "POST", body: { userName, group } }),

  patchUser: (data: { tutorialDone?: boolean; activeGroupId?: string | null }) =>
    call("/api/user", { method: "PATCH", body: data }),

  createGroup: (group: Group) =>
    call("/api/groups", { method: "POST", body: { group } }),

  deleteGroup: (groupId: string) =>
    call<{ ok: boolean; activeGroupId?: string | null }>(
      `/api/groups/${encodeURIComponent(groupId)}`,
      { method: "DELETE" }
    ),

  groupAction: (groupId: string, action: "topup" | "clear" | "markPaid", amount?: number) =>
    call(`/api/groups/${encodeURIComponent(groupId)}`, {
      method: "PATCH",
      body: { action, amount },
    }),

  renameGroup: (groupId: string, name: string) =>
    call(`/api/groups/${encodeURIComponent(groupId)}`, {
      method: "PATCH",
      body: { action: "rename", name },
    }),

  saveExpense: (groupId: string, expense: Expense) =>
    call(`/api/groups/${encodeURIComponent(groupId)}/expenses`, {
      method: "POST",
      body: { expense },
    }),

  deleteExpense: (groupId: string, expId: string) =>
    call(
      `/api/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expId)}`,
      { method: "DELETE" }
    ),

  addMember: (groupId: string, member: Member) =>
    call(`/api/groups/${encodeURIComponent(groupId)}/members`, {
      method: "POST",
      body: { member },
    }),

  removeMember: (groupId: string, memberId: string) =>
    call(
      `/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`,
      { method: "DELETE" }
    ),

  invite: (groupId: string) =>
    call<{ code: string }>(`/api/groups/${encodeURIComponent(groupId)}/invite`, {
      method: "POST",
    }),

  joinPreview: (code: string) =>
    call<{
      groupId: string;
      groupName: string;
      alreadyMember: boolean;
      pending: boolean;
      members: { clientId: string; name: string; claimed: boolean; isMine: boolean }[];
    }>(`/api/join/${encodeURIComponent(code)}`),

  join: (code: string, body: { claimMemberId?: string; newName?: string }) =>
    call<{ status: "member" | "pending"; groupId?: string; groupName?: string }>(
      `/api/join/${encodeURIComponent(code)}`,
      { method: "POST", body }
    ),

  requestAction: (groupId: string, reqId: string, action: "approve" | "reject") =>
    call(
      `/api/groups/${encodeURIComponent(groupId)}/requests/${encodeURIComponent(reqId)}`,
      { method: "POST", body: { action } }
    ),

  leaveGroup: (groupId: string) =>
    call(`/api/groups/${encodeURIComponent(groupId)}/leave`, { method: "POST" }),

  transferAdmin: (groupId: string, memberClientId: string) =>
    call(`/api/groups/${encodeURIComponent(groupId)}/transfer-admin`, {
      method: "POST",
      body: { memberClientId },
    }),

  uploadAvatar: (dataUrl: string) =>
    call<{ avatarUrl: string }>("/api/avatar", {
      method: "POST",
      body: { dataUrl },
    }),
};


// build: pick up NEXT_PUBLIC_GOOGLE_CLIENT_ID

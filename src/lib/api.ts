// Client-side API helper. All calls carry the LINE access token for auth.
import type { AppState, Group, Expense, Member } from "@/app/_components/data";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function call<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
};

// data.ts — types, seed data, state management

export interface Member {
  id: string;
  name: string;
  zh: string;
  tone: 1 | 2 | 3 | 4 | 5 | 6;
  isMe?: boolean;
  isUser?: boolean; // occupied by a real LINE account (not just a label)
  isAdmin?: boolean; // this member is the group's admin
  avatarUrl?: string; // uploaded avatar image URL (if any)
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  tone: string;
}

export interface Expense {
  id: string;
  at: number;
  category: string;
  note: string;
  payerId: string;
  amount: number;
  splitWith: string[];
  fromPool?: boolean; // paid from the shared fund (no personal debt)
  editedAt?: number; // last edit time (fund expenses only)
  editedByName?: string; // who last edited (fund expenses only)
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export interface JoinRequestInfo {
  id: string;
  label: string; // e.g. "Bob 想以新成員加入" / "Bob 想成為 Jerry"
}

export interface Group {
  id: string;
  name: string;
  usePool: boolean;
  isDemo?: boolean;
  isAdmin?: boolean; // viewer is the group creator/admin
  team: Member[];
  expenses: Expense[];
  pool: number;
  pendingRequests?: JoinRequestInfo[]; // populated for admins only
}

export interface PendingJoin {
  groupName: string;
}

export interface AppState {
  onboarded: boolean;
  tutorialDone: boolean;
  userName: string;
  activeGroupId: string | null;
  groups: Group[];
  pending?: PendingJoin[]; // groups the user has applied to but not yet approved
}

export const CATEGORIES: Category[] = [
  { id: "coffee", label: "咖啡",     icon: "coffee",  tone: "coffee" },
  { id: "tea",    label: "手搖",     icon: "tea",     tone: "tea" },
  { id: "lunch",  label: "午餐",     icon: "food",    tone: "food" },
  { id: "snack",  label: "點心",     icon: "snack",   tone: "snack" },
  { id: "dinner", label: "聚餐",     icon: "dinner",  tone: "food" },
  { id: "supply", label: "團務用品", icon: "supply",  tone: "snack" },
  { id: "fruit",  label: "水果",     icon: "fruit",   tone: "tea" },
  { id: "other",  label: "其他",     icon: "more",    tone: "other" },
];

export const CAT_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

export const fmt = (n: number | string): string => {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString("en-US");
};

export const fmtSigned = (n: number): string =>
  (n >= 0 ? "+" : "−") + fmt(Math.abs(n));

export function dayKey(d: number): string {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function dayLabel(d: number): string {
  const dt = new Date(d);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (dayKey(dt.getTime()) === dayKey(today.getTime())) return "今天";
  if (dayKey(dt.getTime()) === dayKey(yest.getTime())) return "昨天";
  return `${dt.getMonth() + 1}/${dt.getDate()} ${["週日","週一","週二","週三","週四","週五","週六"][dt.getDay()]}`;
}

export function timeLabel(d: number): string {
  const dt = new Date(d);
  const h = dt.getHours();
  const m = String(dt.getMinutes()).padStart(2, "0");
  const ap = h < 12 ? "上午" : "下午";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${ap} ${hh}:${m}`;
}

const now = Date.now();
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

const SEED_EXPENSES: Expense[] = [
  { id: "e1",  at: now - 1 * HOUR,         category: "coffee", note: "路易莎拿鐵",   payerId: "me",    amount: 285,  splitWith: ["me", "jerry", "tommy"] },
  { id: "e2",  at: now - 4 * HOUR,         category: "tea",    note: "五十嵐",       payerId: "alice", amount: 220,  splitWith: ["alice", "jerry", "tommy", "zhx"] },
  { id: "e3",  at: now - DAY - 2 * HOUR,   category: "lunch",  note: "鬍鬚張便當",   payerId: "tommy", amount: 540,  splitWith: ["me", "tommy", "alice", "andy", "zhx", "jerry"] },
  { id: "e4",  at: now - DAY - 5 * HOUR,   category: "coffee", note: "Cama 美式",   payerId: "me",    amount: 180,  splitWith: ["me", "andy"] },
  { id: "e5",  at: now - 2 * DAY - 3 * HOUR, category: "snack",note: "全聯零食",     payerId: "andy",  amount: 320,  splitWith: ["me", "tommy", "alice", "andy", "zhx", "jerry"] },
  { id: "e6",  at: now - 2 * DAY - 6 * HOUR, category: "fruit",note: "水果攤",      payerId: "zhx",   amount: 180,  splitWith: ["me", "tommy", "alice", "andy", "zhx", "jerry"] },
  { id: "e7",  at: now - 3 * DAY - 4 * HOUR, category: "dinner",note: "週五聚餐",   payerId: "jerry", amount: 1860, splitWith: ["me", "tommy", "alice", "andy", "zhx", "jerry"] },
  { id: "e8",  at: now - 3 * DAY - 8 * HOUR, category: "tea",  note: "可不可",       payerId: "alice", amount: 165,  splitWith: ["me", "alice", "jerry"] },
  { id: "e9",  at: now - 5 * DAY - 5 * HOUR, category: "supply",note: "濾紙、糖包", payerId: "me",    amount: 240,  splitWith: ["me", "tommy", "alice", "andy", "zhx", "jerry"] },
  { id: "e10", at: now - 6 * DAY - 4 * HOUR, category: "coffee",note: "Starbucks",  payerId: "tommy", amount: 620,  splitWith: ["me", "tommy", "alice", "jerry"] },
];

const TEAM_INIT: Member[] = [
  { id: "me",    name: "Herry", zh: "Herry", tone: 3, isMe: true },
  { id: "jerry", name: "Jerry", zh: "Jerry", tone: 1 },
  { id: "tommy", name: "Tommy", zh: "Tommy", tone: 2 },
  { id: "alice", name: "Alice", zh: "Alice", tone: 4 },
  { id: "andy",  name: "Andy",  zh: "Andy",  tone: 5 },
  { id: "zhx",   name: "宗倖",  zh: "宗倖",  tone: 6 },
];

export function buildDemoGroup(userName = "我"): Group {
  const team = TEAM_INIT.map((m) =>
    m.isMe ? { ...m, name: userName, zh: userName } : m
  );
  return {
    id: "demo-yr-coffee",
    name: "YR Coffee Club",
    usePool: true,
    isDemo: true,
    team,
    expenses: SEED_EXPENSES,
    pool: 1500,
  };
}

function makeId(prefix = "g"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function buildEmptyGroup({
  name,
  usePool,
  memberNames = [],
  userName = "我",
}: {
  name: string;
  usePool: boolean;
  memberNames?: string[];
  userName?: string;
}): Group {
  const tones: Member["tone"][] = [3, 1, 2, 4, 5, 6];
  const team: Member[] = [
    { id: "me", name: userName, zh: userName, tone: 3, isMe: true },
    ...memberNames.map((n, i) => ({
      id: makeId("m"),
      name: n,
      zh: n,
      tone: tones[(i + 1) % tones.length] as Member["tone"],
    })),
  ];
  return {
    id: makeId("g"),
    name,
    usePool: !!usePool,
    isDemo: false,
    team,
    expenses: [],
    pool: 0,
  };
}

export function computeBalances(
  team: Member[],
  expenses: Expense[]
): Record<string, number> {
  const map: Record<string, number> = Object.fromEntries(
    team.map((m) => [m.id, 0])
  );
  expenses.forEach((e) => {
    // Fund expenses are everyone's money — they create no personal debt.
    if (e.fromPool) return;
    if (!(e.payerId in map)) map[e.payerId] = 0;
    map[e.payerId] = (map[e.payerId] || 0) + e.amount;
    const share = e.amount / e.splitWith.length;
    e.splitWith.forEach((mid) => {
      if (!(mid in map)) map[mid] = 0;
      map[mid] -= share;
    });
  });
  Object.keys(map).forEach((k) => { map[k] = Math.round(map[k]); });
  return map;
}

// Available fund = total topped up minus what's been spent from the fund.
export function fundSpent(expenses: Expense[]): number {
  return expenses.reduce((a, e) => a + (e.fromPool ? e.amount : 0), 0);
}

export function computeFundBalance(pool: number, expenses: Expense[]): number {
  return pool - fundSpent(expenses);
}

export function computeSettlements(
  balances: Record<string, number>
): Transfer[] {
  const creditors: { id: string; v: number }[] = [];
  const debtors:   { id: string; v: number }[] = [];
  Object.entries(balances).forEach(([id, v]) => {
    if (v > 0)  creditors.push({ id, v });
    else if (v < 0) debtors.push({ id, v: -v });
  });
  creditors.sort((a, b) => b.v - a.v);
  debtors.sort((a, b) => b.v - a.v);
  const transfers: Transfer[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i], c = creditors[j];
    const amt = Math.min(d.v, c.v);
    if (amt > 0) {
      transfers.push({ from: d.id, to: c.id, amount: amt });
      d.v -= amt;
      c.v -= amt;
    }
    if (d.v === 0) i++;
    if (c.v === 0) j++;
  }
  return transfers;
}

const STORAGE_KEY = "yr-jizhang-v2";

export function defaultState(): AppState {
  return { onboarded: false, tutorialDone: false, userName: "", activeGroupId: null, groups: [] };
}

export function loadState(): AppState {
  try {
    if (typeof window === "undefined") return defaultState();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("no data");
    const s = JSON.parse(raw) as AppState;
    if (typeof s.onboarded !== "boolean") throw new Error("invalid");
    return s;
  } catch {
    return defaultState();
  }
}

export function saveState(s: AppState): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export function resetAll(): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("yr-jizhang-v1");
  } catch {}
}

export { makeId };

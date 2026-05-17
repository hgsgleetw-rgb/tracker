"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AppState,
  Group,
  Expense,
  Member,
  loadState,
  saveState,
  defaultState,
  buildDemoGroup,
  buildEmptyGroup,
  computeBalances,
  computeSettlements,
  CAT_BY_ID,
  fmt,
  makeId,
} from "./data";
import { Toast, ToastItem } from "./Shared";
import Dashboard from "./Dashboard";
import History from "./History";
import AddExpense from "./AddExpense";
import Settlement from "./Settlement";
import Members from "./Members";
import TopUp from "./TopUp";
import ExpenseDetail from "./ExpenseDetail";
import Onboarding from "./Onboarding";
import CreateGroup from "./CreateGroup";
import GroupSwitcher from "./GroupSwitcher";
import AppIcon from "./Icons";

type Tab = "home" | "history" | "settle" | "settings";
type Route =
  | { name: "tab" }
  | { name: "add" }
  | { name: "edit"; editing: Expense }
  | { name: "topup" }
  | { name: "expense"; expense: Expense };

export default function App() {
  const [state, setState] = useState<AppState>(() => defaultState());
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [route, setRoute] = useState<Route>({ name: "tab" });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);

  // Load from localStorage after mount
  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const activeGroup: Group | undefined = state.groups.find(
    (g) => g.id === state.activeGroupId
  );
  const team: Member[] = activeGroup?.team ?? [];
  const expenses: Expense[] = activeGroup?.expenses ?? [];
  const pool: number = activeGroup?.pool ?? 0;

  const balances = useMemo(
    () => computeBalances(team, expenses),
    [team, expenses]
  );
  const settleSuggestions = useMemo(
    () => computeSettlements(balances),
    [balances]
  );

  const pushToast = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((s) => [...s, { ...t, id }]);
      setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 2400);
    },
    []
  );

  const updateActiveGroup = (mut: (g: Group) => Partial<Group>) => {
    setState((s) => ({
      ...s,
      groups: s.groups.map((g) =>
        g.id === s.activeGroupId ? { ...g, ...mut(g) } : g
      ),
    }));
  };

  // ── Onboarding ──────────────────────────────────────────────
  const completeOnboarding = (userName: string) => {
    const demo = buildDemoGroup(userName);
    setState({
      onboarded: true,
      tutorialDone: true,
      userName,
      activeGroupId: demo.id,
      groups: [demo],
    });
  };

  // ── Group mutations ─────────────────────────────────────────
  const createGroup = ({
    name,
    usePool,
    memberNames,
  }: {
    name: string;
    usePool: boolean;
    memberNames: string[];
  }) => {
    const g = buildEmptyGroup({
      name,
      usePool,
      memberNames,
      userName: state.userName,
    });
    setState((s) => ({
      ...s,
      groups: [...s.groups, g],
      activeGroupId: g.id,
    }));
    setShowCreate(false);
    setTab("home");
    pushToast({ title: "群組已建立", desc: name });
  };

  const switchGroup = (id: string) => {
    setState((s) => ({ ...s, activeGroupId: id }));
    setShowSwitcher(false);
    setTab("home");
    setRoute({ name: "tab" });
  };

  const deleteGroup = (id: string) => {
    if (state.groups.length <= 1) {
      pushToast({ title: "無法刪除", desc: "至少要保留一個群組" });
      return;
    }
    if (!confirm("刪除這個群組？所有紀錄會一起消失。")) return;
    setState((s) => {
      const next = s.groups.filter((g) => g.id !== id);
      return {
        ...s,
        groups: next,
        activeGroupId: s.activeGroupId === id ? next[0].id : s.activeGroupId,
      };
    });
    setShowSwitcher(false);
  };

  // ── Expense mutations ───────────────────────────────────────
  const addExpense = (e: Expense) => {
    updateActiveGroup((g) => ({
      expenses: [e, ...g.expenses.filter((x) => x.id !== e.id)],
    }));
    pushToast({
      title: "已記帳",
      desc: `NT$${fmt(e.amount)} · ${CAT_BY_ID[e.category]?.label ?? e.category}`,
    });
    setRoute({ name: "tab" });
  };

  const deleteExpense = (id: string) => {
    updateActiveGroup((g) => ({
      expenses: g.expenses.filter((e) => e.id !== id),
    }));
    pushToast({ title: "已刪除" });
    setRoute({ name: "tab" });
  };

  const topUp = (amt: number) => {
    updateActiveGroup((g) => ({ pool: g.pool + amt }));
    pushToast({ title: "儲值成功", desc: `+NT$${fmt(amt)}` });
    setRoute({ name: "tab" });
  };

  const addMember = (name: string) => {
    const id = makeId("m");
    const tones: Member["tone"][] = [1, 2, 3, 4, 5, 6];
    updateActiveGroup((g) => ({
      team: [
        ...g.team,
        {
          id,
          name,
          zh: name,
          tone: tones[g.team.length % tones.length],
        },
      ],
    }));
    pushToast({ title: "已新增成員", desc: name });
  };

  const removeMember = (id: string) => {
    updateActiveGroup((g) => ({
      team: g.team.filter((m) => m.id !== id),
    }));
    pushToast({ title: "已移除" });
  };

  const clearAllData = () => {
    if (!confirm("確定要清除這個群組的所有紀錄？")) return;
    updateActiveGroup(() => ({ expenses: [], pool: 0 }));
    pushToast({ title: "已清除所有紀錄" });
  };

  const markAllPaid = () => {
    if (
      !confirm(
        "將所有支出歸零？這會清除歷史，但保留成員與池子餘額。"
      )
    )
      return;
    updateActiveGroup(() => ({ expenses: [] }));
    pushToast({ title: "已標記為已結算" });
    setRoute({ name: "tab" });
    setTab("home");
  };

  // ── Loading ─────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="app" style={{ justifyContent: "center", alignItems: "center" }}>
        <p style={{ color: "var(--yr-fg-subtle)", fontSize: 14 }}>載入中...</p>
      </div>
    );
  }

  // ── Onboarding gate ─────────────────────────────────────────
  if (!state.onboarded) {
    return (
      <div className="app">
        <Onboarding onComplete={completeOnboarding} />
      </div>
    );
  }

  // ── Create group screen ──────────────────────────────────────
  if (showCreate) {
    return (
      <div className="app">
        <CreateGroup
          onCancel={state.groups.length > 0 ? () => setShowCreate(false) : null}
          onCreate={createGroup}
        />
      </div>
    );
  }

  // ── Main screens ─────────────────────────────────────────────
  let screen: React.ReactNode = null;

  if (route.name === "add" || route.name === "edit") {
    screen = (
      <AddExpense
        team={team}
        editing={route.name === "edit" ? route.editing : null}
        onCancel={() => setRoute({ name: "tab" })}
        onSave={addExpense}
      />
    );
  } else if (route.name === "topup") {
    screen = (
      <TopUp
        team={team}
        pool={pool}
        onBack={() => setRoute({ name: "tab" })}
        onTopUp={topUp}
      />
    );
  } else {
    if (tab === "home") {
      screen = (
        <Dashboard
          team={team}
          expenses={expenses}
          pool={pool}
          balances={balances}
          settleSuggestions={settleSuggestions}
          groupName={activeGroup?.name ?? ""}
          usePool={activeGroup?.usePool ?? false}
          onTab={(t) => setTab(t as Tab)}
          onTopUp={() => setRoute({ name: "topup" })}
          onOpenExpense={(e) => setRoute({ name: "expense", expense: e })}
          openSettlement={() => setTab("settle")}
          openHistory={() => setTab("history")}
          onSwitchGroup={() => setShowSwitcher(true)}
        />
      );
    } else if (tab === "history") {
      screen = (
        <History
          team={team}
          expenses={expenses}
          onBack={() => setTab("home")}
          onOpen={(e) => setRoute({ name: "expense", expense: e })}
        />
      );
    } else if (tab === "settle") {
      screen = (
        <Settlement
          team={team}
          balances={balances}
          settleSuggestions={settleSuggestions}
          onBack={() => setTab("home")}
          onMarkPaid={markAllPaid}
          onAddMember={addMember}
          onRemoveMember={removeMember}
        />
      );
    } else if (tab === "settings") {
      screen = (
        <Members
          team={team}
          balances={balances}
          expenses={expenses}
          onBack={() => setTab("home")}
          onAdd={addMember}
          onRemove={removeMember}
          onClearData={clearAllData}
        />
      );
    }
  }

  const showTabBar = route.name === "tab";

  return (
    <div className="app">
      {screen}

      {showTabBar && (
        <div className="tabbar">
          <button
            data-tab="home"
            className={`tab ${tab === "home" ? "tab--active" : ""}`}
            onClick={() => setTab("home")}
          >
            <AppIcon name="home" size={22} />
            <span>總覽</span>
          </button>
          <button
            data-tab="history"
            className={`tab ${tab === "history" ? "tab--active" : ""}`}
            onClick={() => setTab("history")}
          >
            <AppIcon name="clock" size={22} />
            <span>紀錄</span>
          </button>
          <button
            data-tab="add"
            className="tab tab--fab"
            onClick={() => setRoute({ name: "add" })}
          >
            <div className="fab">
              <AppIcon name="plus" size={26} strokeWidth={2.4} />
            </div>
            <span>記帳</span>
          </button>
          <button
            data-tab="settle"
            className={`tab ${tab === "settle" ? "tab--active" : ""}`}
            onClick={() => setTab("settle")}
          >
            <AppIcon name="scale" size={22} />
            <span>結算</span>
          </button>
          <button
            data-tab="settings"
            className={`tab ${tab === "settings" ? "tab--active" : ""}`}
            onClick={() => setTab("settings")}
          >
            <AppIcon name="users" size={22} />
            <span>成員</span>
          </button>
        </div>
      )}

      {route.name === "expense" && route.expense && (
        <ExpenseDetail
          expense={expenses.find((e) => e.id === route.expense.id)}
          team={team}
          onClose={() => setRoute({ name: "tab" })}
          onEdit={() =>
            setRoute({
              name: "edit",
              editing: expenses.find((e) => e.id === route.expense.id)!,
            })
          }
          onDelete={() => deleteExpense(route.expense.id)}
        />
      )}

      {showSwitcher && (
        <GroupSwitcher
          groups={state.groups}
          activeId={state.activeGroupId}
          onClose={() => setShowSwitcher(false)}
          onSelect={switchGroup}
          onCreate={() => { setShowSwitcher(false); setShowCreate(true); }}
          onDelete={deleteGroup}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}

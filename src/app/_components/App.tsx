"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  AppState,
  Group,
  Expense,
  Member,
  defaultState,
  buildDemoGroup,
  buildEmptyGroup,
  computeBalances,
  computeSettlements,
  computeFundBalance,
  CAT_BY_ID,
  fmt,
  makeId,
} from "./data";
import { useLiff } from "@/providers/LiffProvider";
import { api } from "@/lib/api";
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
import JoinGroup from "./JoinGroup";
import LoginScreen from "./LoginScreen";
import GroupSwitcher from "./GroupSwitcher";
import TutorialOverlay from "./TutorialOverlay";
import AppIcon from "./Icons";

type Tab = "home" | "history" | "settle" | "settings";
type Route =
  | { name: "tab" }
  | { name: "add" }
  | { name: "edit"; editing: Expense }
  | { name: "topup" }
  | { name: "expense"; expense: Expense };

type LoadPhase = "loading" | "ready" | "error";

// Downscale an image file to a square-ish max edge and return a JPEG data URL.
function resizeImage(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas context"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}

export default function App() {
  const { liff, isReady, error: liffError, profile, needsLogin, logout } = useLiff();

  const [state, setState] = useState<AppState>(() => defaultState());
  const [phase, setPhase] = useState<LoadPhase>("loading");
  const [tab, setTab] = useState<Tab>("home");
  const [route, setRoute] = useState<Route>({ name: "tab" });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string>("");
  const [confirmReq, setConfirmReq] = useState<{
    message: string;
    resolve: (ok: boolean) => void;
  } | null>(null);
  const pendingSyncs = useRef(0);

  // In-app confirmation (native confirm() is unreliable in the LINE webview).
  const confirmAsync = useCallback(
    (message: string) =>
      new Promise<boolean>((resolve) => setConfirmReq({ message, resolve })),
    []
  );

  const pushToast = useCallback((t: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { ...t, id }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 2400);
  }, []);

  // Fire-and-forget server sync; surface a toast if it fails (optimistic UI).
  // Track in-flight syncs so polling never clobbers an unsynced local change.
  const sync = useCallback(
    (p: Promise<unknown>) => {
      pendingSyncs.current++;
      p.catch((e) => {
        console.error("[sync]", e);
        pushToast({ title: "⚠️ 同步失敗", desc: "稍後請重新整理確認" });
      }).finally(() => {
        pendingSyncs.current = Math.max(0, pendingSyncs.current - 1);
      });
    },
    [pushToast]
  );

  // Pick up an invite code from the LIFF launch URL (?join=... or liff.state).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    let code = sp.get("join");
    if (!code) {
      const ls = sp.get("liff.state");
      if (ls) code = new URLSearchParams(ls.startsWith("?") ? ls.slice(1) : ls).get("join");
    }
    if (code) setJoinCode(code);
  }, []);

  // Load state from the server once LINE login is ready.
  useEffect(() => {
    if (!isReady) return;
    if (liffError) {
      setPhase("error");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const s = await api.getState();
        if (!cancelled) {
          setState(s);
          setPhase("ready");
        }
      } catch (e) {
        console.error("[getState]", e);
        if (!cancelled) {
          setLoadErr(e instanceof Error ? e.message : String(e));
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isReady, liffError]);

  // Poll the server so members see each other's updates (~near real-time),
  // and so a pending applicant flips in automatically once approved.
  const hasRealGroup = state.groups.some((g) => !g.isDemo);
  const hasPending = !!state.pending?.length;
  useEffect(() => {
    if (phase !== "ready" || joinCode || (!hasRealGroup && !hasPending)) return;
    const iv = setInterval(async () => {
      if (pendingSyncs.current > 0) return; // don't overwrite unsynced edits
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const s = await api.getState();
        if (pendingSyncs.current === 0) setState(s);
      } catch {
        /* transient; next tick retries */
      }
    }, 4000);
    return () => clearInterval(iv);
  }, [phase, state.onboarded, joinCode, hasRealGroup, hasPending]);

  const activeGroup: Group | undefined = state.groups.find(
    (g) => g.id === state.activeGroupId
  );
  const team: Member[] = activeGroup?.team ?? [];
  const expenses: Expense[] = activeGroup?.expenses ?? [];
  const pool: number = activeGroup?.pool ?? 0;
  // Spendable fund = topped-up total minus what's been spent from the fund.
  const fundBalance = useMemo(
    () => computeFundBalance(pool, expenses),
    [pool, expenses]
  );

  const balances = useMemo(
    () => computeBalances(team, expenses),
    [team, expenses]
  );
  const settleSuggestions = useMemo(
    () => computeSettlements(balances),
    [balances]
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
      tutorialDone: false,
      userName,
      activeGroupId: demo.id,
      groups: [demo],
    });
    sync(api.onboarding(userName, demo));
  };

  const skipTutorial = () => {
    setState((s) => ({ ...s, tutorialDone: true }));
    sync(api.patchUser({ tutorialDone: true }));
  };

  const finishTutorial = () => {
    setState((s) => ({ ...s, tutorialDone: true }));
    sync(api.patchUser({ tutorialDone: true }));
    setShowCreate(true);
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
    // Creating a real group retires the demo example for good.
    setState((s) => ({
      ...s,
      groups: [...s.groups.filter((x) => !x.isDemo), g],
      activeGroupId: g.id,
    }));
    const created = api.createGroup(g); // server also drops any demo group
    sync(created);
    setShowCreate(false);
    setTab("home");
    pushToast({ title: "群組已建立", desc: name });
    return { group: g, created };
  };

  // Create the group, then immediately share/copy an invite link for it.
  const createGroupAndInvite = async (opts: {
    name: string;
    usePool: boolean;
    memberNames: string[];
  }) => {
    const { group, created } = createGroup(opts);
    try {
      await created; // the group must exist on the server before we ask for a code
    } catch {
      return; // sync() already surfaced the failure
    }
    await inviteToGroupId(group.id);
  };

  const switchGroup = (id: string) => {
    setState((s) => ({ ...s, activeGroupId: id }));
    sync(api.patchUser({ activeGroupId: id }));
    setShowSwitcher(false);
    setTab("home");
    setRoute({ name: "tab" });
  };

  const uploadAvatar = async (file: File) => {
    try {
      const dataUrl = await resizeImage(file, 256);
      await api.uploadAvatar(dataUrl);
      const s = await api.getState(); // refresh so the new photo shows everywhere
      setState(s);
      pushToast({ title: "大頭照已更新" });
    } catch (e) {
      console.error("[uploadAvatar]", e);
      pushToast({ title: "上傳失敗", desc: "請換一張圖片再試" });
    }
  };

  const renameGroupById = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState((s) => ({
      ...s,
      groups: s.groups.map((g) => (g.id === id ? { ...g, name: trimmed } : g)),
    }));
    sync(api.renameGroup(id, trimmed));
    pushToast({ title: "已更名", desc: trimmed });
  };

  const renameGroup = (name: string) => {
    if (state.activeGroupId) renameGroupById(state.activeGroupId, name);
  };

  const deleteGroup = async (id: string) => {
    if (state.groups.length <= 1) {
      pushToast({ title: "無法刪除", desc: "至少要保留一個群組" });
      return;
    }
    if (!(await confirmAsync("刪除這個群組？所有紀錄會一起消失。"))) return;
    setState((s) => {
      const next = s.groups.filter((g) => g.id !== id);
      return {
        ...s,
        groups: next,
        activeGroupId: s.activeGroupId === id ? next[0].id : s.activeGroupId,
      };
    });
    sync(api.deleteGroup(id));
    setShowSwitcher(false);
  };

  // ── Expense mutations ───────────────────────────────────────
  const addExpense = (e: Expense) => {
    const gid = state.activeGroupId;
    updateActiveGroup((g) => ({
      expenses: [e, ...g.expenses.filter((x) => x.id !== e.id)],
    }));
    if (gid) sync(api.saveExpense(gid, e));
    pushToast({
      title: "已記帳",
      desc: `NT$${fmt(e.amount)} · ${CAT_BY_ID[e.category]?.label ?? e.category}`,
    });
    setRoute({ name: "tab" });
  };

  const deleteExpense = (id: string) => {
    const gid = state.activeGroupId;
    updateActiveGroup((g) => ({
      expenses: g.expenses.filter((e) => e.id !== id),
    }));
    if (gid) sync(api.deleteExpense(gid, id));
    pushToast({ title: "已刪除" });
    setRoute({ name: "tab" });
  };

  const topUp = (amt: number) => {
    const gid = state.activeGroupId;
    updateActiveGroup((g) => ({ pool: g.pool + amt }));
    if (gid) sync(api.groupAction(gid, "topup", amt));
    pushToast({ title: "儲值成功", desc: `+NT$${fmt(amt)}` });
    setRoute({ name: "tab" });
  };

  const addMember = (name: string) => {
    const gid = state.activeGroupId;
    const id = makeId("m");
    const tones: Member["tone"][] = [1, 2, 3, 4, 5, 6];
    const member: Member = {
      id,
      name,
      zh: name,
      tone: tones[team.length % tones.length],
    };
    updateActiveGroup((g) => ({ team: [...g.team, member] }));
    if (gid) sync(api.addMember(gid, member));
    pushToast({ title: "已新增成員", desc: name });
  };

  const removeMember = async (id: string) => {
    const member = team.find((m) => m.id === id);
    if (!(await confirmAsync(`確定要移除成員${member ? `「${member.zh}」` : ""}？`))) return;
    const gid = state.activeGroupId;
    updateActiveGroup((g) => ({
      team: g.team.filter((m) => m.id !== id),
    }));
    if (gid) sync(api.removeMember(gid, id));
    pushToast({ title: "已移除", desc: member?.zh });
  };

  const markAllPaid = async () => {
    if (!(await confirmAsync("將所有支出歸零？這會清除歷史，但保留成員與池子餘額。")))
      return;
    const gid = state.activeGroupId;
    updateActiveGroup(() => ({ expenses: [] }));
    if (gid) sync(api.groupAction(gid, "markPaid"));
    pushToast({ title: "已標記為已結算" });
    setRoute({ name: "tab" });
    setTab("home");
  };

  // ── Invite / join ───────────────────────────────────────────
  const clearJoinFromUrl = () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("join");
    url.searchParams.delete("liff.state");
    window.history.replaceState({}, "", url.pathname + url.search);
  };

  const inviteToGroup = async () => {
    const gid = state.activeGroupId;
    if (!gid) return;
    await inviteToGroupId(gid);
  };

  const inviteToGroupId = async (gid: string) => {
    try {
      const { code } = await api.invite(gid);
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      const link = `https://liff.line.me/${liffId}/?join=${code}`;
      let shared = false;
      if (liff && liff.isApiAvailable("shareTargetPicker")) {
        shared = await liff
          .shareTargetPicker([{ type: "text", text: `一起來記帳吧！${link}` }])
          .then(() => true)
          .catch(() => false);
      }
      if (!shared) {
        await navigator.clipboard.writeText(link);
        pushToast({ title: "邀請連結已複製", desc: "貼到 LINE 傳給朋友" });
      }
    } catch (e) {
      console.error("[invite]", e);
      pushToast({ title: "產生邀請連結失敗" });
    }
  };

  const logoutAccount = async () => {
    if (
      !(await confirmAsync(
        "登出後會回到登入畫面，需要重新登入才能看到你的群組。確定要登出嗎？"
      ))
    )
      return;
    logout();
  };

  const handleJoined = async (groupId: string) => {
    setJoinCode(null);
    clearJoinFromUrl();
    try {
      const s = await api.getState();
      setState({ ...s, activeGroupId: groupId });
    } catch {
      /* polling/load will reconcile */
    }
    setTab("home");
    setRoute({ name: "tab" });
    pushToast({ title: "已加入群組" });
  };

  const cancelJoin = () => {
    setJoinCode(null);
    clearJoinFromUrl();
  };

  const approveRequest = async (reqId: string) => {
    const gid = state.activeGroupId;
    if (!gid) return;
    if (!(await confirmAsync("核准這位成員加入群組？"))) return;
    updateActiveGroup((g) => ({
      pendingRequests: (g.pendingRequests ?? []).filter((r) => r.id !== reqId),
    }));
    sync(api.requestAction(gid, reqId, "approve"));
    pushToast({ title: "已核准加入" });
  };

  const rejectRequest = async (reqId: string) => {
    const gid = state.activeGroupId;
    if (!gid) return;
    if (!(await confirmAsync("拒絕這個加入申請？"))) return;
    updateActiveGroup((g) => ({
      pendingRequests: (g.pendingRequests ?? []).filter((r) => r.id !== reqId),
    }));
    sync(api.requestAction(gid, reqId, "reject"));
    pushToast({ title: "已拒絕" });
  };

  const transferAdmin = async (memberId: string) => {
    const gid = state.activeGroupId;
    if (!gid) return;
    const m = team.find((x) => x.id === memberId);
    if (!(await confirmAsync(`要把管理員轉給「${m?.zh ?? ""}」？轉移後你會變成一般成員。`)))
      return;
    // Re-fetch so admin/member flags update for the whole group.
    sync(api.transferAdmin(gid, memberId).then(() => api.getState()).then(setState));
    pushToast({ title: "已轉移管理員", desc: m?.zh });
  };

  const leaveGroup = async () => {
    const gid = state.activeGroupId;
    if (!gid) return;
    const gname = activeGroup?.name ?? "這個群組";
    if (
      !(await confirmAsync(
        `確定要退出「${gname}」？\n你的名字與紀錄會保留給其他成員，但你將無法再看到這個群組。`
      ))
    )
      return;
    setState((s) => {
      const next = s.groups.filter((g) => g.id !== gid);
      return { ...s, groups: next, activeGroupId: next[0]?.id ?? null };
    });
    sync(api.leaveGroup(gid));
    setShowSwitcher(false);
    setTab("home");
    setRoute({ name: "tab" });
    pushToast({ title: "已退出群組" });
  };

  // Admin leaving: hand admin to another member, then leave.
  const handoverAndLeave = async (memberId: string) => {
    const gid = state.activeGroupId;
    if (!gid) return;
    const m = team.find((x) => x.id === memberId);
    if (
      !(await confirmAsync(
        `把管理員交給「${m?.zh ?? ""}」並退出群組？\n你的名字與紀錄會保留給其他成員。`
      ))
    )
      return;
    setState((s) => {
      const next = s.groups.filter((g) => g.id !== gid);
      return { ...s, groups: next, activeGroupId: next[0]?.id ?? null };
    });
    sync(api.transferAdmin(gid, memberId).then(() => api.leaveGroup(gid)));
    setShowSwitcher(false);
    setTab("home");
    setRoute({ name: "tab" });
    pushToast({ title: "已交棒並退出", desc: m?.zh });
  };

  // ── Login choice (browser, not yet authenticated) ──────────
  if (needsLogin) {
    return (
      <div className="app">
        <LoginScreen />
      </div>
    );
  }

  // ── Loading / error gates ───────────────────────────────────
  if (!isReady || phase === "loading") {
    return (
      <div className="app" style={{ justifyContent: "center", alignItems: "center" }}>
        <p style={{ color: "var(--yr-fg-subtle)", fontSize: 14 }}>載入中...</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div
        className="app"
        style={{ justifyContent: "center", alignItems: "center", gap: 16, padding: 24 }}
      >
        <p style={{ color: "var(--yr-fg-subtle)", fontSize: 14, textAlign: "center" }}>
          {liffError ? "LINE 登入失敗" : "載入資料失敗"}，請重新整理再試一次。
        </p>
        {(liffError || loadErr) && (
          <p
            style={{
              color: "var(--yr-fg-disabled)",
              fontSize: 11,
              textAlign: "center",
              maxWidth: 320,
              wordBreak: "break-all",
            }}
          >
            {liffError || loadErr}
          </p>
        )}
        <button
          onClick={() => location.reload()}
          style={{
            padding: "10px 20px",
            borderRadius: 12,
            border: "none",
            background: "var(--yr-accent, #4f46e5)",
            color: "#fff",
            fontSize: 14,
          }}
        >
          重新整理
        </button>
      </div>
    );
  }

  // ── Join via invite link (takes priority over onboarding) ──
  if (joinCode) {
    return (
      <div className="app">
        <JoinGroup code={joinCode} onJoined={handleJoined} onCancel={cancelJoin} />
      </div>
    );
  }

  // ── Waiting for approval (applicant with no groups yet) ──────
  if (state.groups.length === 0 && hasPending) {
    return (
      <div className="app">
        <div className="onb">
          <div className="onb-body">
            <div className="onb-step" style={{ textAlign: "center", paddingTop: 40 }}>
              <div className="onb-mark">
                <AppIcon name="clock" size={32} color="#fff" />
              </div>
              <h2 className="onb-h2">等待核准中</h2>
              <p className="onb-p">
                「{state.pending?.[0]?.groupName}」的管理員核准後，會自動帶你進群組。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Onboarding gate ─────────────────────────────────────────
  if (!state.onboarded) {
    return (
      <div className="app">
        <Onboarding
          onComplete={completeOnboarding}
          defaultName={profile?.displayName ?? ""}
        />
      </div>
    );
  }

  // ── Create group screen ──────────────────────────────────────
  if (showCreate) {
    return (
      <div className="app">
        <CreateGroup
          onCancel={
            state.groups.some((g) => !g.isDemo) ? () => setShowCreate(false) : null
          }
          onCreate={createGroup}
          onCreateAndInvite={createGroupAndInvite}
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
        usePool={activeGroup?.usePool ?? false}
        onCancel={() => setRoute({ name: "tab" })}
        onSave={addExpense}
      />
    );
  } else if (route.name === "topup") {
    screen = (
      <TopUp
        team={team}
        pool={fundBalance}
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
          pool={fundBalance}
          balances={balances}
          settleSuggestions={settleSuggestions}
          groupName={activeGroup?.name ?? ""}
          usePool={activeGroup?.usePool ?? false}
          isAdmin={activeGroup?.isAdmin ?? false}
          onTab={(t) => setTab(t as Tab)}
          onAdd={() => setRoute({ name: "add" })}
          onTopUp={() => setRoute({ name: "topup" })}
          onOpenExpense={(e) => setRoute({ name: "expense", expense: e })}
          openSettlement={() => setTab("settle")}
          openHistory={() => setTab("history")}
          onSwitchGroup={() => setShowSwitcher(true)}
          onRenameGroup={renameGroup}
          onUploadAvatar={uploadAvatar}
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
          expenses={expenses}
          isAdmin={activeGroup?.isAdmin ?? false}
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
          isAdmin={activeGroup?.isAdmin ?? false}
          pendingRequests={activeGroup?.pendingRequests ?? []}
          onBack={() => setTab("home")}
          onAdd={addMember}
          onRemove={removeMember}
          onInvite={inviteToGroup}
          onApprove={approveRequest}
          onReject={rejectRequest}
          onLeave={leaveGroup}
          onHandoverLeave={handoverAndLeave}
          onTransferAdmin={transferAdmin}
          onUploadAvatar={uploadAvatar}
          onLogout={logoutAccount}
        />
      );
    }
  }

  const showTabBar = route.name === "tab";
  const showTutorial =
    !state.tutorialDone &&
    activeGroup?.isDemo &&
    tab === "home" &&
    route.name === "tab" &&
    !showSwitcher;

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
          isAdmin={activeGroup?.isAdmin ?? false}
          onClose={() => setRoute({ name: "tab" })}
          onEdit={() => {
            const exp = expenses.find((e) => e.id === route.expense.id);
            if (exp) setRoute({ name: "edit", editing: exp });
          }}
          onDelete={() => deleteExpense(route.expense.id)}
        />
      )}

      {showSwitcher && (
        <GroupSwitcher
          groups={state.groups.filter((g) => !g.isDemo)}
          activeId={state.activeGroupId}
          onClose={() => setShowSwitcher(false)}
          onSelect={switchGroup}
          onCreate={() => { setShowSwitcher(false); setShowCreate(true); }}
          onDelete={deleteGroup}
          onRename={renameGroupById}
        />
      )}

      {showTutorial && (
        <TutorialOverlay onSkip={skipTutorial} onFinish={finishTutorial} />
      )}

      {confirmReq && (
        <div
          className="confirm-back"
          onClick={() => {
            confirmReq.resolve(false);
            setConfirmReq(null);
          }}
        >
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-msg">{confirmReq.message}</div>
            <div className="confirm-actions">
              <button
                className="btn btn--secondary"
                onClick={() => {
                  confirmReq.resolve(false);
                  setConfirmReq(null);
                }}
              >
                取消
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  confirmReq.resolve(true);
                  setConfirmReq(null);
                }}
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} />
    </div>
  );
}

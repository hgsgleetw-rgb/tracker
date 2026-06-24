"use client";

import { useState } from "react";
import {
  Member,
  Expense,
  Transfer,
  CAT_BY_ID,
  fmt,
  fmtSigned,
  dayLabel,
} from "./data";
import { Avatar, AvatarStack, CategoryIcon, BreakdownChart } from "./Shared";
import AppIcon from "./Icons";
import SettleBreakdown from "./SettleBreakdown";

const CAT_COLORS = ["#3E76B9", "#FB6514", "#12B76A", "#7CB9EC", "#717BBC"];

interface DashboardProps {
  team: Member[];
  expenses: Expense[];
  pool: number;
  balances: Record<string, number>;
  settleSuggestions: Transfer[];
  groupName: string;
  usePool: boolean;
  isAdmin: boolean;
  onTab: (tab: string) => void;
  onAdd: () => void;
  onTopUp: () => void;
  onOpenExpense: (e: Expense) => void;
  openSettlement: () => void;
  openHistory: () => void;
  onSwitchGroup: () => void;
  onRenameGroup: (name: string) => void;
  onUploadAvatar: (file: File) => void;
}

export default function Dashboard({
  team,
  expenses,
  pool,
  balances,
  settleSuggestions,
  groupName,
  usePool,
  isAdmin,
  onTab,
  onAdd,
  onTopUp,
  onOpenExpense,
  openSettlement,
  openHistory,
  onSwitchGroup,
  onRenameGroup,
  onUploadAvatar,
}: DashboardProps) {
  const me = team.find((m) => m.isMe);
  const myNet = me ? balances[me.id] || 0 : 0;
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(groupName);
  const [settleDetail, setSettleDetail] = useState<Transfer | null>(null);
  const [showTrend, setShowTrend] = useState(false);

  const commitName = () => {
    setEditingName(false);
    const v = nameDraft.trim();
    if (v && v !== groupName) onRenameGroup(v);
  };

  // This month — total spending (all expenses), separate from the fund.
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthExpenses = expenses.filter((e) => e.at >= monthStart.getTime());
  const monthTotal = monthExpenses.reduce((a, e) => a + e.amount, 0);
  // Of which, how much came from the shared fund (for the hero line).
  const monthFundSpent = monthExpenses.reduce(
    (a, e) => a + (e.fromPool ? e.amount : 0),
    0
  );

  // Last month comparison (total spending)
  const lastMonthStart = new Date(monthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthTotal = expenses
    .filter(
      (e) => e.at >= lastMonthStart.getTime() && e.at < monthStart.getTime()
    )
    .reduce((a, e) => a + e.amount, 0);
  const monthDiff =
    lastMonthTotal === 0
      ? 0
      : Math.round(((monthTotal - lastMonthTotal) / lastMonthTotal) * 100);

  // Top categories
  const catTotals: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });
  const sortedCats = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const catSum = sortedCats.reduce((a, [, v]) => a + v, 0) || 1;

  // Recent 5
  const recent = [...expenses].sort((a, b) => b.at - a.at).slice(0, 5);
  const needSettle = settleSuggestions.length;

  // Progress bar width
  const progressWidth =
    usePool && pool + monthFundSpent > 0
      ? Math.min(100, (monthFundSpent / (pool + monthFundSpent)) * 100)
      : 0;

  return (
    <>
      {/* ── Hero zone ─────────────────────────────────────── */}
      <div className="hero-zone">
        <div className="hero-top">
          <div className="hero-top-left">
            <label
              className="hero-avatar"
              style={{ cursor: "pointer" }}
              title="更換大頭照"
            >
              <Avatar member={me} size="lg" />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadAvatar(f);
                  e.target.value = "";
                }}
              />
            </label>
            <div>
              {editingName ? (
                <input
                  className="hero-greet"
                  value={nameDraft}
                  autoFocus
                  maxLength={30}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  style={{
                    background: "rgba(255,255,255,0.16)",
                    border: "none",
                    borderRadius: 6,
                    color: "#fff",
                    padding: "1px 6px",
                    maxWidth: 200,
                  }}
                />
              ) : (
                <div
                  className="hero-greet"
                  onClick={() => {
                    if (!isAdmin) return;
                    setNameDraft(groupName);
                    setEditingName(true);
                  }}
                  title={isAdmin ? "點一下改名" : undefined}
                  style={{ cursor: isAdmin ? "text" : "default" }}
                >
                  {groupName || "我的群組"}
                </div>
              )}
              <div className="hero-status">
                <span className="dot" />
                {(() => {
                  const todayStart = new Date();
                  todayStart.setHours(0, 0, 0, 0);
                  const todayCount = expenses.filter(
                    (e) => e.at >= todayStart.getTime()
                  ).length;
                  if (todayCount > 0) return `今天有 ${todayCount} 筆新支出`;
                  if (needSettle > 0) return `${needSettle} 筆待結算`;
                  return `${team.length} 人 · 目前無待結算`;
                })()}
              </div>
            </div>
          </div>
          <button
            className="hero-icon-btn"
            onClick={onSwitchGroup}
            aria-label="切換群組"
          >
            <AppIcon name="more" size={18} color="#fff" />
          </button>
        </div>

        <div
          className="hero-balance"
          onClick={usePool ? onTopUp : undefined}
          style={{ cursor: usePool ? "pointer" : "default" }}
        >
          <div className="hero-bal-lbl">
            {usePool ? "目前基金" : "本月支出總額"}
          </div>
          <div className="hero-bal-amt">
            <span className="cur">NT$</span>
            {(() => {
              const v = usePool ? pool : monthTotal;
              // Use a real minus sign (−) tight to the digits, not a hyphen.
              return v < 0 ? `−${fmt(Math.abs(v))}` : fmt(v);
            })()}
          </div>
        </div>

        {usePool ? (
          <div className="hero-progress">
            <div className="hero-prog-row">
              <span>本月用掉基金</span>
              <span className="v">NT${fmt(monthFundSpent)}</span>
            </div>
            <div className="hero-bar">
              <span style={{ width: `${progressWidth}%` }} />
            </div>
            <div className="hero-prog-row sub">
              <span>
                我的淨額{" "}
                {myNet === 0 ? "—" : fmtSigned(myNet)}
              </span>
              <span>待結算 {needSettle} 筆</span>
            </div>
          </div>
        ) : (
          <div className="hero-progress">
            <div className="hero-prog-row sub" style={{ marginTop: 0 }}>
              <span>
                我的淨額{" "}
                {myNet === 0 ? "—" : fmtSigned(myNet)}
              </span>
              <span>待結算 {needSettle} 筆</span>
            </div>
          </div>
        )}

        <div className="hero-quick">
          {usePool && (
            <button className="qa" onClick={onTopUp}>
              <div className="qa-ico">
                <AppIcon name="plus" size={20} strokeWidth={2.2} />
              </div>
              <span>儲值</span>
            </button>
          )}
          <button className="qa" onClick={openHistory}>
            <div className="qa-ico">
              <AppIcon name="clock" size={20} />
            </div>
            <span>紀錄</span>
          </button>
          <button className="qa" onClick={openSettlement}>
            <div className="qa-ico">
              <AppIcon name="scale" size={20} />
            </div>
            <span>結算</span>
          </button>
          <button className="qa" onClick={() => onTab("settings")}>
            <div className="qa-ico">
              <AppIcon name="users" size={20} />
            </div>
            <span>成員</span>
          </button>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="main main--hero">
        {expenses.length === 0 && (
          <button
            type="button"
            className="empty empty--cta"
            onClick={onAdd}
            style={{ marginBottom: 8, display: "block", width: "100%", border: 0, background: "transparent", cursor: "pointer" }}
          >
            <div className="e-ico">
              <AppIcon name="plus" size={26} strokeWidth={2.4} />
            </div>
            <div className="e-t">記下第一筆吧</div>
            <div className="e-d">
              點這裡記錄第一筆支出，系統會自動算誰欠誰
            </div>
          </button>
        )}

        {expenses.length > 0 && (
          <>
            {/* KPI */}
            <div className="sec-title">
              <h3>這個月花了多少</h3>
            </div>
            <div className="kpis">
              <div
                className="kpi kpi--spend"
                onClick={() => monthExpenses.length > 0 && setShowTrend(true)}
                style={{ cursor: monthExpenses.length > 0 ? "pointer" : "default" }}
              >
                <div className="l">
                  <div className="kpi-ico">
                    <AppIcon name="wallet" size={14} strokeWidth={2.2} />
                  </div>
                  <span>本月支出{monthExpenses.length > 0 ? " · 看走勢" : ""}</span>
                </div>
                <div className="v">NT${fmt(monthTotal)}</div>
                {lastMonthTotal === 0 ? (
                  <div className="sub trend-pill trend-pill--neutral">
                    本月首次紀錄
                  </div>
                ) : monthDiff === 0 ? (
                  <div className="sub trend-pill trend-pill--neutral">
                    與上月持平
                  </div>
                ) : (
                  <div
                    className={`sub trend-pill ${monthDiff > 0 ? "trend-pill--up" : "trend-pill--down"}`}
                  >
                    <AppIcon
                      name={monthDiff > 0 ? "arrow-up" : "arrow-down"}
                      size={11}
                      strokeWidth={2.6}
                    />
                    較上月{monthDiff > 0 ? "多" : "少"}{" "}
                    {Math.abs(monthDiff)}%
                  </div>
                )}
              </div>
              <div className="kpi kpi--income">
                <div className="l">
                  <div className="kpi-ico">
                    <AppIcon name="clock" size={14} strokeWidth={2.2} />
                  </div>
                  <span>本月筆數</span>
                </div>
                <div className="v">{monthExpenses.length}</div>
                <div className="sub">
                  平均 NT$
                  {fmt(
                    monthExpenses.length
                      ? monthTotal / monthExpenses.length
                      : 0
                  )}
                  /筆
                </div>
              </div>
            </div>

            {/* Settlements */}
            {needSettle > 0 && (
              <>
                <div className="sec-title">
                  <h3>結算建議</h3>
                  <button className="more" onClick={openSettlement}>
                    查看全部 →
                  </button>
                </div>
                <div className="card" style={{ padding: 0 }}>
                  {settleSuggestions.slice(0, 2).map((t, i) => {
                    const from = team.find((m) => m.id === t.from);
                    const to = team.find((m) => m.id === t.to);
                    if (!from || !to) return null;
                    return (
                      <button
                        className="settle"
                        key={i}
                        onClick={() => setSettleDetail(t)}
                        style={{
                          width: "100%",
                          background: "none",
                          border: 0,
                          cursor: "pointer",
                        }}
                      >
                        <div className="who">
                          <Avatar member={from} />
                          <div className="nm">{from.zh}</div>
                        </div>
                        <div className="arrow">
                          <div className="amt">NT${fmt(t.amount)}</div>
                          <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>
                            看明細
                          </div>
                        </div>
                        <div className="who">
                          <Avatar member={to} />
                          <div className="nm">{to.zh}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Category breakdown */}
            {sortedCats.length > 0 && (
              <>
                <div className="sec-title">
                  <h3>本月分類</h3>
                </div>
                <div className="card">
                  <BreakdownChart data={sortedCats} total={catSum} />
                </div>
              </>
            )}

            {/* Recent activity */}
            <div className="sec-title">
              <h3>最近活動</h3>
              <button className="more" onClick={openHistory}>
                查看全部 →
              </button>
            </div>
            <div className="list">
              {recent.map((e) => {
                const cat = CAT_BY_ID[e.category];
                const payer = team.find((m) => m.id === e.payerId);
                const splitMembers = e.splitWith
                  .map((id) => team.find((m) => m.id === id))
                  .filter((m): m is Member => !!m);
                return (
                  <button
                    className="list-row"
                    key={e.id}
                    onClick={() => onOpenExpense(e)}
                  >
                    <CategoryIcon category={e.category} />
                    <div className="lr-main">
                      <div className="lr-title">
                        {e.note || cat?.label || e.category}
                      </div>
                      <div className="lr-meta">
                        {e.note && <span>{cat?.label} · </span>}
                        {e.fromPool ? (
                          <span>公基金{payer?.zh ? ` · ${payer.zh} 記` : ""}</span>
                        ) : (
                          <>
                            <span>{payer?.zh} 付</span>
                            <AvatarStack members={splitMembers} max={4} />
                          </>
                        )}
                        {e.editedAt && (
                          <span style={{ marginLeft: 6, color: "var(--yr-fg-subtle)" }}>
                            · 已編輯
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="lr-amt">
                      <div className="v">NT${fmt(e.amount)}</div>
                      <div className="s">{dayLabel(e.at)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {settleDetail && (
        <SettleBreakdown
          transfer={settleDetail}
          team={team}
          expenses={expenses}
          onClose={() => setSettleDetail(null)}
        />
      )}

      {showTrend && (() => {
        const today = new Date();
        const days = today.getDate(); // 1..today
        const daily = new Array(days).fill(0);
        monthExpenses.forEach((e) => {
          const d = new Date(e.at).getDate();
          if (d >= 1 && d <= days) daily[d - 1] += e.amount;
        });
        const max = Math.max(...daily, 1);
        const peak = Math.max(...daily, 0);
        return (
          <>
            <div className="sheet-back" onClick={() => setShowTrend(false)} />
            <div className="sheet">
              <div className="sheet__handle" />
              <div
                style={{
                  font: "700 16px/1.3 var(--yr-font-sans)",
                  color: "var(--yr-fg)",
                  textAlign: "center",
                }}
              >
                本月花費走勢
              </div>
              <div
                className="muted"
                style={{ fontSize: 12, textAlign: "center", marginBottom: 16 }}
              >
                共 NT${fmt(monthTotal)} · {monthExpenses.length} 筆 · 單日最高 NT${fmt(peak)}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: days > 20 ? 2 : 4,
                  height: 150,
                  padding: "0 4px",
                }}
              >
                {daily.map((v, i) => (
                  <div
                    key={i}
                    title={`${i + 1}日 · NT$${fmt(v)}`}
                    style={{ flex: 1, display: "flex", alignItems: "flex-end", height: "100%" }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: `${Math.max(v > 0 ? 4 : 0, (v / max) * 100)}%`,
                        background:
                          i === days - 1
                            ? "var(--yr-brand-500)"
                            : "var(--yr-brand-300)",
                        borderRadius: "3px 3px 0 0",
                        transition: "height 200ms var(--yr-ease-standard)",
                      }}
                    />
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 6,
                  padding: "0 4px",
                  font: "500 10px/1 var(--yr-font-sans)",
                  color: "var(--yr-fg-subtle)",
                }}
              >
                <span>1 日</span>
                <span>{days} 日（今天）</span>
              </div>
              <div style={{ height: 10 }} />
            </div>
          </>
        );
      })()}
    </>
  );
}

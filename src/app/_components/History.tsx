"use client";

import { useState } from "react";
import {
  Member,
  Expense,
  CAT_BY_ID,
  fmt,
  dayKey,
  dayLabel,
  timeLabel,
} from "./data";
import { CategoryIcon, AvatarStack } from "./Shared";
import AppIcon from "./Icons";

interface HistoryProps {
  team: Member[];
  expenses: Expense[];
  onBack: () => void;
  onOpen: (e: Expense) => void;
}

export default function History({
  team,
  expenses,
  onBack,
  onOpen,
}: HistoryProps) {
  const [filter, setFilter] = useState<"all" | "mine" | "month">("all");
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const me = team.find((m) => m.isMe);

  let filtered = [...expenses].sort((a, b) => b.at - a.at);

  if (filter === "mine" && me) {
    filtered = filtered.filter(
      (e) => e.payerId === me.id || e.splitWith.includes(me.id)
    );
  }
  if (filter === "month") {
    const ms = new Date();
    ms.setDate(1);
    ms.setHours(0, 0, 0, 0);
    filtered = filtered.filter((e) => e.at >= ms.getTime());
  }
  if (q.trim()) {
    const needle = q.trim().toLowerCase();
    filtered = filtered.filter((e) => {
      const cat = CAT_BY_ID[e.category];
      const payer = team.find((m) => m.id === e.payerId);
      return (
        (e.note || "").toLowerCase().includes(needle) ||
        (cat?.label || "").toLowerCase().includes(needle) ||
        (payer?.zh || "").toLowerCase().includes(needle) ||
        String(e.amount).includes(needle)
      );
    });
  }

  // Group by day
  const groups: Record<
    string,
    { label: string; items: Expense[]; total: number }
  > = {};
  filtered.forEach((e) => {
    const k = dayKey(e.at);
    if (!groups[k])
      groups[k] = { label: dayLabel(e.at), items: [], total: 0 };
    groups[k].items.push(e);
    groups[k].total += e.amount;
  });
  const dayOrder = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  const total = filtered.reduce((a, e) => a + e.amount, 0);

  return (
    <>
      <div className="sub-top">
        <button className="back" onClick={onBack}>
          <AppIcon name="back" size={22} />
        </button>
        <div className="title">
          歷史紀錄
          <small>
            {filtered.length} 筆 · 共 NT${fmt(total)}
          </small>
        </div>
        <button
          className="act"
          onClick={() => setSearching((s) => !s)}
          aria-label="search"
        >
          <AppIcon
            name={searching ? "x" : "search"}
            size={20}
            color="var(--yr-fg-muted)"
          />
        </button>
      </div>

      <div className="main">
        {searching && (
          <div className="card" style={{ padding: 10, marginBottom: 12 }}>
            <input
              className="input"
              placeholder="搜尋備註、分類、付款人或金額"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        )}

        <div className="seg" style={{ marginBottom: 14 }}>
          <button
            className={filter === "all" ? "on" : ""}
            onClick={() => setFilter("all")}
          >
            全部
          </button>
          <button
            className={filter === "mine" ? "on" : ""}
            onClick={() => setFilter("mine")}
          >
            有我
          </button>
          <button
            className={filter === "month" ? "on" : ""}
            onClick={() => setFilter("month")}
          >
            本月
          </button>
        </div>

        {dayOrder.length === 0 && (
          <div className="empty">
            <div className="e-ico">
              <AppIcon name="clock" size={26} />
            </div>
            <div className="e-t">尚無紀錄</div>
            <div className="e-d">調整篩選條件試試</div>
          </div>
        )}

        {dayOrder.map((k) => {
          const g = groups[k];
          return (
            <div key={k} style={{ marginBottom: 14 }}>
              <div className="day-hdr">
                <span className="day-label">{g.label}</span>
                <span className="day-total">
                  <span className="lbl">共</span>
                  <span className="amt yr-mono">NT${fmt(g.total)}</span>
                </span>
              </div>
              <div className="list">
                {g.items.map((e) => {
                  const cat = CAT_BY_ID[e.category];
                  const payer = team.find((m) => m.id === e.payerId);
                  const splitMembers = e.splitWith
                    .map((id) => team.find((m) => m.id === id))
                    .filter((m): m is Member => !!m);
                  return (
                    <button
                      className="list-row"
                      key={e.id}
                      onClick={() => onOpen(e)}
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
                        <div className="s">{timeLabel(e.at)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

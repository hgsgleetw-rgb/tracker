"use client";

import { useState } from "react";
import { Member, Transfer, Expense, fmt, fmtSigned } from "./data";
import { Avatar } from "./Shared";
import AppIcon from "./Icons";
import SettleBreakdown from "./SettleBreakdown";

interface SettlementProps {
  team: Member[];
  balances: Record<string, number>;
  settleSuggestions: Transfer[];
  expenses: Expense[];
  isAdmin: boolean;
  onBack: () => void;
  onMarkPaid: () => void;
  onAddMember: (name: string) => void;
  onRemoveMember: (id: string) => void;
}

export default function Settlement({
  team,
  balances,
  settleSuggestions,
  expenses,
  isAdmin,
  onBack,
  onMarkPaid,
  onAddMember,
  onRemoveMember,
}: SettlementProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [detail, setDetail] = useState<Transfer | null>(null);
  const sorted = [...team].sort(
    (a, b) => (balances[b.id] || 0) - (balances[a.id] || 0)
  );
  const totalToSettle = settleSuggestions.reduce((a, t) => a + t.amount, 0);

  const submitNew = () => {
    const n = newName.trim();
    if (!n) return;
    onAddMember(n);
    setNewName("");
    setAdding(false);
  };

  return (
    <>
      <div className="sub-top">
        <button className="back" onClick={onBack}>
          <AppIcon name="back" size={22} />
        </button>
        <div className="title">
          結算
          <small>
            {settleSuggestions.length} 筆轉帳 · 共 NT${fmt(totalToSettle)}
          </small>
        </div>
        <div className="act" />
      </div>

      <div className="main">
        <div className="sec-title">
          <h3>每人淨額（{team.length}人）</h3>
          <button className="more" onClick={() => setAdding(true)}>
            + 新增成員
          </button>
        </div>

        {adding && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card__sub">新增成員</div>
            <input
              className="input"
              placeholder="姓名"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitNew(); }}
            />
            <div className="btn-row" style={{ marginTop: 10 }}>
              <button
                className="btn btn--secondary"
                onClick={() => { setAdding(false); setNewName(""); }}
              >
                取消
              </button>
              <button
                className="btn btn--primary"
                disabled={!newName.trim()}
                onClick={submitNew}
              >
                新增
              </button>
            </div>
          </div>
        )}

        <div className="list">
          {sorted.map((m) => {
            const net = balances[m.id] || 0;
            const removable = isAdmin && !m.isMe && net === 0;
            return (
              <div key={m.id} className="mem-row">
                <Avatar member={m} size="lg" />
                <div className="nm">
                  {m.zh}
                  {m.isMe ? " (我)" : ""}
                  <small>
                    {net > 0 ? "別人欠他" : net < 0 ? "他欠別人" : "已結清"}
                  </small>
                </div>
                <div
                  className={`net ${net > 0 ? "pos" : net < 0 ? "neg" : ""}`}
                  style={{ minWidth: 60, textAlign: "right" }}
                >
                  {net === 0 ? "—" : fmtSigned(net)}
                </div>
                {removable ? (
                  <button
                    className="icon-btn"
                    style={{
                      width: 32,
                      height: 32,
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (confirm(`移除 ${m.zh}？`)) onRemoveMember(m.id);
                    }}
                    aria-label="remove"
                  >
                    <AppIcon
                      name="trash"
                      size={16}
                      color="var(--yr-fg-subtle)"
                    />
                  </button>
                ) : (
                  <div style={{ width: 32 }} />
                )}
              </div>
            );
          })}
        </div>
        <div
          className="muted"
          style={{ fontSize: 11, marginTop: 8, padding: "0 6px" }}
        >
          只能移除已結清（淨額為 0）的成員，避免漏記未結算的款項。
        </div>

        <div className="sec-title">
          <h3>建議轉帳（最少筆數）</h3>
        </div>

        {settleSuggestions.length === 0 ? (
          <div className="card empty">
            <div
              className="e-ico"
              style={{
                background: "var(--yr-success-50)",
                color: "var(--yr-success-700)",
              }}
            >
              <AppIcon name="check" size={28} strokeWidth={2.4} />
            </div>
            <div className="e-t">大家都結清了</div>
            <div className="e-d">沒有人欠別人錢，繼續加油</div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {settleSuggestions.map((t, i) => {
              const from = team.find((m) => m.id === t.from);
              const to = team.find((m) => m.id === t.to);
              if (!from || !to) return null;
              return (
                <button
                  className="settle"
                  key={i}
                  onClick={() => setDetail(t)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: 0,
                    borderBottom: "1px solid var(--yr-border)",
                    cursor: "pointer",
                  }}
                >
                  <div className="who">
                    <Avatar member={from} />
                    <div className="nm">{from.zh}</div>
                  </div>
                  <div className="arrow">
                    <div className="amt">NT${fmt(t.amount)}</div>
                    <div
                      className="muted"
                      style={{ fontSize: 10, marginTop: 2 }}
                    >
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
            <div style={{ padding: 14 }}>
              <button
                className="btn btn--secondary btn--block"
                onClick={onMarkPaid}
              >
                <AppIcon name="check" size={16} /> 全部標記為已結算
              </button>
            </div>
          </div>
        )}

        <div style={{ height: 16 }} />
        <div
          className="card"
          style={{
            background: "var(--yr-brand-50)",
            borderColor: "var(--yr-brand-100)",
          }}
        >
          <div className="row-flex">
            <div>
              <div
                style={{
                  font: "600 13px/1.2 var(--yr-font-sans)",
                  color: "var(--yr-brand-600)",
                }}
              >
                提示
              </div>
              <div
                style={{
                  font: "500 12px/1.4 var(--yr-font-sans)",
                  color: "var(--yr-fg-strong)",
                  marginTop: 4,
                }}
              >
                結算建議用最少的轉帳次數讓所有人歸零，省下大家的時間。
              </div>
            </div>
          </div>
        </div>
      </div>

      {detail && (
        <SettleBreakdown
          transfer={detail}
          team={team}
          expenses={expenses}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}

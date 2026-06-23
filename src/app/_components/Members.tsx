"use client";

import { useState } from "react";
import { Member, Expense, JoinRequestInfo, fmt, fmtSigned } from "./data";
import { Avatar } from "./Shared";
import AppIcon from "./Icons";

interface MembersProps {
  team: Member[];
  balances: Record<string, number>;
  expenses: Expense[];
  isAdmin: boolean;
  pendingRequests: JoinRequestInfo[];
  onBack: () => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onClearData: () => void;
  onInvite: () => void;
  onApprove: (reqId: string) => void;
  onReject: (reqId: string) => void;
  onLeave: () => void;
  onTransferAdmin: (id: string) => void;
}

export default function Members({
  team,
  balances,
  expenses,
  isAdmin,
  pendingRequests,
  onBack,
  onAdd,
  onRemove,
  onClearData,
  onInvite,
  onApprove,
  onReject,
  onLeave,
  onTransferAdmin,
}: MembersProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const stats = (mid: string) => {
    let paid = 0, owed = 0, count = 0;
    expenses.forEach((e) => {
      if (e.payerId === mid) { paid += e.amount; count++; }
      if (e.splitWith.includes(mid) && e.splitWith.length > 0) owed += e.amount / e.splitWith.length;
    });
    return { paid, owed: Math.round(owed), count };
  };

  return (
    <>
      <div className="sub-top">
        <button className="back" onClick={onBack}>
          <AppIcon name="back" size={22} />
        </button>
        <div className="title">
          成員管理<small>{team.length} 人</small>
        </div>
        <button className="act" onClick={() => setAdding(true)}>
          <AppIcon
            name="plus"
            size={20}
            color="var(--yr-brand-500)"
            strokeWidth={2.2}
          />
        </button>
      </div>

      <div className="main">
        <div className="list">
          {team.map((m) => {
            const s = stats(m.id);
            const net = balances[m.id] || 0;
            return (
              <div key={m.id} className="mem-row">
                <Avatar member={m} size="lg" />
                <div className="nm">
                  {m.zh}
                  {m.isMe ? " (我)" : ""}
                  {m.isAdmin && (
                    <span className="badge badge--brand" style={{ marginLeft: 6 }}>
                      管理員
                    </span>
                  )}
                  <small>
                    付款 {s.count} 次 · 共 NT${fmt(s.paid)}
                  </small>
                  {isAdmin && m.isUser && !m.isMe && !m.isAdmin && (
                    <button
                      onClick={() => onTransferAdmin(m.id)}
                      style={{
                        display: "block",
                        marginTop: 4,
                        padding: 0,
                        background: "none",
                        border: 0,
                        color: "var(--yr-brand-500)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      設為管理員
                    </button>
                  )}
                </div>
                <div
                  className={`net ${net > 0 ? "pos" : net < 0 ? "neg" : ""}`}
                  style={{ minWidth: 60, textAlign: "right" }}
                >
                  {net === 0 ? "—" : fmtSigned(net)}
                </div>
                {isAdmin && !m.isMe ? (
                  <button
                    className="icon-btn"
                    style={{
                      width: 32,
                      height: 32,
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                    }}
                    onClick={() => onRemove(m.id)}
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

        {adding && (
          <div className="card" style={{ marginTop: 14 }}>
            <div className="card__sub">新增成員</div>
            <input
              className="input"
              placeholder="姓名"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
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
                onClick={() => {
                  onAdd(newName.trim());
                  setAdding(false);
                  setNewName("");
                }}
              >
                新增
              </button>
            </div>
          </div>
        )}

        {isAdmin && pendingRequests.length > 0 && (
          <>
            <div className="sec-title">
              <h3>待核准 ({pendingRequests.length})</h3>
            </div>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingRequests.map((r) => (
                <div
                  key={r.id}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <div style={{ flex: 1, fontSize: 13 }}>{r.label}</div>
                  <button
                    className="btn btn--secondary"
                    style={{ padding: "6px 12px" }}
                    onClick={() => onReject(r.id)}
                  >
                    拒絕
                  </button>
                  <button
                    className="btn btn--primary"
                    style={{ padding: "6px 12px" }}
                    onClick={() => onApprove(r.id)}
                  >
                    核准
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="sec-title">
          <h3>邀請</h3>
        </div>
        <div className="card">
          <button className="btn btn--primary btn--block" onClick={onInvite}>
            <AppIcon name="users" size={16} /> 邀請朋友加入
          </button>
          <div
            className="muted"
            style={{ fontSize: 11, marginTop: 8, textAlign: "center" }}
          >
            複製連結後貼到 LINE 傳給朋友，對方點開申請、由你核准就能一起記帳
          </div>
        </div>

        {isAdmin ? (
          <>
            <div className="sec-title">
              <h3>資料</h3>
            </div>
            <div className="card">
              <button
                className="btn btn--danger btn--block"
                onClick={onClearData}
              >
                <AppIcon name="trash" size={16} /> 清除所有紀錄
              </button>
              <div
                className="muted"
                style={{ fontSize: 11, marginTop: 8, textAlign: "center" }}
              >
                將清除所有支出與儲值資料（無法復原）
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="sec-title">
              <h3>群組</h3>
            </div>
            <div className="card">
              <button className="btn btn--danger btn--block" onClick={onLeave}>
                <AppIcon name="back" size={16} /> 退出群組
              </button>
              <div
                className="muted"
                style={{ fontSize: 11, marginTop: 8, textAlign: "center" }}
              >
                你將離開這個群組，紀錄會保留給其他成員
              </div>
            </div>
          </>
        )}

        <div style={{ height: 30 }} />
        <div
          style={{
            textAlign: "center",
            color: "var(--yr-fg-subtle)",
            fontSize: 11,
          }}
        >
          記帳 · 員榮設計系統 · v1.0
        </div>
      </div>
    </>
  );
}

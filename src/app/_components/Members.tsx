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
  onInvite: () => void;
  onApprove: (reqId: string) => void;
  onReject: (reqId: string) => void;
  onLeave: () => void;
  onHandoverLeave: (memberId: string) => void;
  onTransferAdmin: (id: string) => void;
  onUploadAvatar: (file: File) => void;
  onLogout: () => void;
  provider: "line" | "google" | null;
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
  onInvite,
  onApprove,
  onReject,
  onLeave,
  onHandoverLeave,
  onTransferAdmin,
  onUploadAvatar,
  onLogout,
  provider,
}: MembersProps) {
  const me = team.find((m) => m.isMe);
  const providerLabel =
    provider === "google"
      ? "透過 Google 登入"
      : provider === "line"
      ? "透過 LINE 登入"
      : "已登入";
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [showHandover, setShowHandover] = useState(false);
  const [showLeaveInfo, setShowLeaveInfo] = useState(false);
  // Members (real accounts, not me) who could take over as admin.
  const successors = team.filter((m) => m.isUser && !m.isMe && !m.isAdmin);

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
                  {m.isMe && (
                    <label
                      style={{
                        display: "block",
                        marginTop: 4,
                        color: "var(--yr-brand-500)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      更換大頭照
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

            <div className="sec-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <h3>群組</h3>
              <button
                onClick={() => setShowLeaveInfo((s) => !s)}
                aria-label="說明"
                style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: "1px solid var(--yr-border-strong)",
                  background: "none", color: "var(--yr-fg-subtle)",
                  fontSize: 11, lineHeight: 1, cursor: "pointer",
                }}
              >
                i
              </button>
            </div>
            <div className="card">
              <button
                className="btn btn--danger btn--block"
                onClick={() => setShowHandover(true)}
              >
                <AppIcon name="back" size={16} /> 退出群組
              </button>
              {showLeaveInfo && (
                <div
                  className="muted"
                  style={{ fontSize: 11, marginTop: 8, textAlign: "center", lineHeight: 1.6 }}
                >
                  你是管理員，退出前需先把管理員交給其他成員（會自動帶你選），
                  或在群組切換頁刪除整個群組。
                </div>
              )}
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

        <div className="sec-title">
          <h3>帳號</h3>
        </div>
        <div className="account-box">
          <div className="account-id">
            <Avatar member={me} size="lg" />
            <div className="account-id-text">
              <div className="account-id-name">{me?.zh || me?.name || "我"}</div>
              <div className="account-id-sub">
                <span className={`account-badge account-badge--${provider ?? "none"}`}>
                  {provider === "google" ? "G" : provider === "line" ? "L" : "·"}
                </span>
                {providerLabel}
              </div>
            </div>
          </div>
          <button className="account-logout" onClick={onLogout}>
            <AppIcon name="back" size={15} /> 登出
          </button>
        </div>
        <p className="account-hint">
          登出後群組與紀錄都會保留，用同一個帳號重新登入即可看到
        </p>

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

      {showHandover && (
        <>
          <div className="sheet-back" onClick={() => setShowHandover(false)} />
          <div className="sheet">
            <div className="sheet__handle" />
            <div
              style={{
                font: "700 16px/1.3 var(--yr-font-sans)",
                color: "var(--yr-fg)",
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              退出前先交棒
            </div>
            <div
              className="muted"
              style={{ fontSize: 12, textAlign: "center", marginBottom: 14 }}
            >
              你是管理員，選一位成員接手管理員後就會帶你退出。
            </div>
            {successors.length === 0 ? (
              <div
                className="muted"
                style={{ textAlign: "center", padding: "12px 0", lineHeight: 1.6 }}
              >
                目前沒有其他可接手的成員。
                <br />
                請改用「群組切換頁 → 刪除整個群組」。
              </div>
            ) : (
              <div className="list">
                {successors.map((m) => (
                  <button
                    key={m.id}
                    className="list-row"
                    onClick={() => {
                      setShowHandover(false);
                      onHandoverLeave(m.id);
                    }}
                    style={{ width: "100%", border: 0, background: "none", cursor: "pointer" }}
                  >
                    <Avatar member={m} size="lg" />
                    <div className="lr-main">
                      <div className="lr-title">交給 {m.zh}</div>
                      <div className="lr-meta">
                        <span>由 {m.zh} 接手管理員，你退出</span>
                      </div>
                    </div>
                    <AppIcon name="arrow-right" size={18} color="var(--yr-fg-subtle)" />
                  </button>
                ))}
              </div>
            )}
            <div style={{ height: 8 }} />
          </div>
        </>
      )}
    </>
  );
}

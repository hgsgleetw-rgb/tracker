"use client";

import { Member, CAT_BY_ID, fmt } from "./data";
import AppIcon from "./Icons";

// ── Avatar ──────────────────────────────────────────────────
export function Avatar({
  member,
  size = "md",
}: {
  member: Member | undefined;
  size?: "md" | "lg";
}) {
  if (!member) return null;
  const cls = `avatar ${size === "lg" ? "avatar--lg" : ""} tone-${member.tone}`;
  if (member.avatarUrl) {
    return (
      <div className={cls} style={{ padding: 0, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={member.avatarUrl}
          alt={member.zh || member.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }
  const initial =
    member.zh && /[一-龥]/.test(member.zh)
      ? member.zh.slice(0, 1)
      : (member.name || "?").slice(0, 1).toUpperCase();
  return <div className={cls}>{initial}</div>;
}

// ── AvatarStack ─────────────────────────────────────────────
export function AvatarStack({
  members,
  max = 4,
}: {
  members: Member[];
  max?: number;
}) {
  const shown = members.slice(0, max);
  const rest = members.length - shown.length;
  return (
    <div className="avstack">
      {shown.map((m, i) => (
        <div key={`${m.id}-${i}`} className={`av tone-${m.tone}`} style={{ zIndex: 10 - i }}>
          {m.zh && /[一-龥]/.test(m.zh)
            ? m.zh.slice(0, 1)
            : (m.name || "?").slice(0, 1).toUpperCase()}
        </div>
      ))}
      {rest > 0 && <div className="av more">+{rest}</div>}
    </div>
  );
}

// ── CategoryIcon ────────────────────────────────────────────
export function CategoryIcon({
  category,
  size = 20,
}: {
  category: string;
  size?: number;
}) {
  const cat = CAT_BY_ID[category] || CAT_BY_ID.other;
  return (
    <div className={`cat-ico cat-ico--${cat.tone}`}>
      <AppIcon name={cat.icon} size={size} strokeWidth={1.8} />
    </div>
  );
}

// ── Toast ───────────────────────────────────────────────────
export interface ToastItem {
  id: number;
  title: string;
  desc?: string;
  type?: "err" | "ok";
}

export function Toast({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.type === "err" ? "toast--err" : ""}`}
          style={{ pointerEvents: "auto" }}
        >
          <div className="ti">
            <AppIcon
              name={t.type === "err" ? "x" : "check"}
              size={14}
              strokeWidth={2.5}
            />
          </div>
          <div>
            <div className="tt">{t.title}</div>
            {t.desc && <div className="td">{t.desc}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── BreakdownChart (category bars) ─────────────────────────
const CAT_COLORS = ["#3E76B9", "#FB6514", "#12B76A", "#7CB9EC", "#717BBC"];

export function BreakdownChart({
  data,
  total,
}: {
  data: [string, number][];
  total: number;
}) {
  const max = data.length > 0 ? data[0][1] : 1;
  return (
    <div className="brk">
      <div className="brk-hd">
        <div>
          <div className="lbl">本月總支出</div>
          <div className="amt">
            <span className="cur">NT$</span>
            {fmt(total)}
          </div>
        </div>
        <div className="meta">{data.length} 個類別</div>
      </div>
      <div className="brk-list">
        {data.map(([cat, v], i) => {
          const c = CAT_BY_ID[cat] || CAT_BY_ID.other;
          const pct = Math.round((v / total) * 100);
          const width = Math.max(4, Math.round((v / max) * 100));
          return (
            <div className="brk-row" key={cat}>
              <div className="brk-row-top">
                <span className="nm">
                  {c.label}
                  <span className="pct">{pct}%</span>
                </span>
                <span className="amt">NT${fmt(v)}</span>
              </div>
              <div className="track">
                <span
                  style={{
                    width: `${width}%`,
                    background: CAT_COLORS[i % CAT_COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

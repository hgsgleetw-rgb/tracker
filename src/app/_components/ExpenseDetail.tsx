"use client";

import { Member, Expense, CAT_BY_ID, fmt, dayLabel, timeLabel } from "./data";
import { Avatar, CategoryIcon } from "./Shared";
import AppIcon from "./Icons";

interface ExpenseDetailProps {
  expense: Expense | undefined;
  team: Member[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ExpenseDetail({
  expense,
  team,
  onClose,
  onEdit,
  onDelete,
}: ExpenseDetailProps) {
  if (!expense) return null;

  const cat = CAT_BY_ID[expense.category] || CAT_BY_ID.other;
  const payer = team.find((m) => m.id === expense.payerId);
  const splitMembers = expense.splitWith
    .map((id) => team.find((m) => m.id === id))
    .filter((m): m is Member => !!m);
  const perPerson = splitMembers.length > 0 ? Math.round(expense.amount / splitMembers.length) : 0;

  return (
    <>
      <div className="sheet-back" onClick={onClose} />
      <div className="sheet">
        <div className="sheet__handle" />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "8px 4px 16px",
            borderBottom: "1px solid var(--yr-border)",
          }}
        >
          <CategoryIcon category={expense.category} size={22} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                font: "600 16px/1.2 var(--yr-font-sans)",
                color: "var(--yr-fg)",
              }}
            >
              {expense.note || cat.label}
            </div>
            <div
              style={{
                font: "500 12px/1 var(--yr-font-sans)",
                color: "var(--yr-fg-muted)",
                marginTop: 4,
              }}
            >
              <span className="badge badge--brand">{cat.label}</span>
              <span style={{ marginLeft: 8 }}>
                {dayLabel(expense.at)} {timeLabel(expense.at)}
              </span>
            </div>
          </div>
          <div
            style={{
              font: "700 22px/1 var(--yr-font-mono)",
              color: "var(--yr-fg)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            NT${fmt(expense.amount)}
          </div>
        </div>

        <div style={{ padding: "14px 4px 4px" }}>
          <div className="row-flex" style={{ marginBottom: 14 }}>
            <span className="muted" style={{ fontSize: 12 }}>
              付款人
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar member={payer} />
              <span
                style={{ font: "600 14px/1 var(--yr-font-sans)" }}
              >
                {payer?.zh}
              </span>
            </div>
          </div>

          <div className="row-flex" style={{ marginBottom: 14 }}>
            <span className="muted" style={{ fontSize: 12 }}>
              每人分攤
            </span>
            <span
              className="yr-mono"
              style={{
                font: "700 14px/1 var(--yr-font-mono)",
                color: "var(--yr-brand-500)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              NT${fmt(perPerson)}
            </span>
          </div>

          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
            分給 {splitMembers.length} 人
          </div>
          <div className="mem-pick" style={{ marginBottom: 16 }}>
            {splitMembers.map((m) => (
              <div
                key={m.id}
                className="mem-pill on"
                style={{ cursor: "default" }}
              >
                <Avatar member={m} />
                <span>
                  {m.zh}
                  {m.isMe ? " (我)" : ""}
                </span>
              </div>
            ))}
          </div>

          <div className="btn-row">
            <button className="btn btn--danger" onClick={onDelete}>
              <AppIcon name="trash" size={16} /> 刪除
            </button>
            <button className="btn btn--primary" onClick={onEdit}>
              編輯
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

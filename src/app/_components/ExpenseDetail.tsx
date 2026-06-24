"use client";

import { useRef, useState } from "react";
import { Member, Expense, CAT_BY_ID, fmt, dayLabel, timeLabel } from "./data";
import { Avatar, CategoryIcon } from "./Shared";
import AppIcon from "./Icons";

interface ExpenseDetailProps {
  expense: Expense | undefined;
  team: Member[];
  isAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ExpenseDetail({
  expense,
  team,
  isAdmin,
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

  // Edit — fund: anyone (logged); personal: only the payer (or admin for an
  // unclaimed label).
  const canEdit = expense.fromPool
    ? true
    : !!payer?.isMe || (!payer?.isUser && isAdmin);
  // Delete is unlogged → only the recorder (payer), or admin for a label.
  const canDelete = !!payer?.isMe || (!payer?.isUser && isAdmin);

  // Drag-to-dismiss: drag the sheet down past a threshold to close it.
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current == null) return;
    setDrag(Math.max(0, e.clientY - startY.current));
  };
  const onPointerUp = () => {
    if (startY.current == null) return;
    if (drag > 110) onClose();
    else setDrag(0);
    startY.current = null;
  };

  return (
    <>
      <div className="sheet-back" onClick={onClose} />
      <div
        className="sheet"
        style={{
          transform: `translate(-50%, ${drag}px)`,
          transition: startY.current == null ? "transform 200ms var(--yr-ease-standard)" : "none",
        }}
      >
        <div
          className="sheet-grab"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ padding: "4px 0 8px", cursor: "grab", touchAction: "none" }}
        >
          <div className="sheet__handle" />
        </div>

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
          {expense.fromPool ? (
            <>
              <div className="row-flex" style={{ marginBottom: 14 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  付款來源
                </span>
                <span
                  className="badge badge--brand"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <AppIcon name="wallet" size={14} /> 公基金支付
                </span>
              </div>
              {payer && (
                <div className="row-flex" style={{ marginBottom: 14 }}>
                  <span className="muted" style={{ fontSize: 12 }}>
                    記錄者
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar member={payer} />
                    <span style={{ font: "600 14px/1 var(--yr-font-sans)" }}>
                      {payer.zh}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="row-flex" style={{ marginBottom: 14 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  付款人
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar member={payer} />
                  <span style={{ font: "600 14px/1 var(--yr-font-sans)" }}>
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
            </>
          )}

          {expense.editedAt && (
            <div
              className="muted"
              style={{ fontSize: 11, marginBottom: 12, textAlign: "center" }}
            >
              已編輯{expense.editedByName ? ` · ${expense.editedByName}` : ""} ·{" "}
              {dayLabel(expense.editedAt)} {timeLabel(expense.editedAt)}
              {expense.prevAmount != null && (
                <>
                  {" · 原 NT$"}
                  {fmt(expense.prevAmount)}
                </>
              )}
            </div>
          )}

          {canEdit || canDelete ? (
            <div className="btn-row">
              {canDelete && (
                <button className="btn btn--danger" onClick={onDelete}>
                  <AppIcon name="trash" size={16} /> 刪除
                </button>
              )}
              {canEdit && (
                <button className="btn btn--primary" onClick={onEdit}>
                  編輯
                </button>
              )}
            </div>
          ) : (
            <div
              className="muted"
              style={{ fontSize: 12, textAlign: "center", padding: "4px 0" }}
            >
              只有付款本人能修改這筆
            </div>
          )}
        </div>
      </div>
    </>
  );
}

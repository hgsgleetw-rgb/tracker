"use client";

import { Member, Transfer, Expense, CAT_BY_ID, fmt, settleBreakdown } from "./data";
import { CategoryIcon } from "./Shared";

interface SettleBreakdownProps {
  transfer: Transfer;
  team: Member[];
  expenses: Expense[];
  onClose: () => void;
}

// Bottom sheet explaining what a settlement transfer is made of.
export default function SettleBreakdown({
  transfer,
  team,
  expenses,
  onClose,
}: SettleBreakdownProps) {
  const from = team.find((m) => m.id === transfer.from);
  const to = team.find((m) => m.id === transfer.to);
  const items = settleBreakdown(expenses, transfer.from, transfer.to);
  // Sum of the two people's direct expenses. May differ from the suggested
  // transfer, which nets across the whole group (greedy min-transactions).
  const directNet = items.reduce((a, { signed }) => a + signed, 0);
  const matchesSuggestion = Math.abs(directNet) === transfer.amount;

  return (
    <>
      <div className="sheet-back" onClick={onClose} />
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
          {from?.zh} → {to?.zh}：NT${fmt(transfer.amount)}
        </div>
        <div
          className="muted"
          style={{ fontSize: 12, textAlign: "center", marginBottom: 14 }}
        >
          這筆款項的來源明細
        </div>
        {items.length === 0 ? (
          <div
            className="muted"
            style={{ textAlign: "center", padding: "12px 6px 4px", lineHeight: 1.7 }}
          >
            你和 {to?.zh} 之間沒有直接的個人支出。
            <br />
            建議轉的 NT${fmt(transfer.amount)} 是系統為了讓大家用最少筆數還清、
            跨成員互相抵銷後的結果。
          </div>
        ) : (
          <div className="list">
            {items.map(({ e, signed }) => {
              const cat = CAT_BY_ID[e.category];
              const payer = team.find((m) => m.id === e.payerId);
              return (
                <div className="list-row" key={e.id} style={{ cursor: "default" }}>
                  <CategoryIcon category={e.category} />
                  <div className="lr-main">
                    <div className="lr-title">{e.note || cat?.label || e.category}</div>
                    <div className="lr-meta">
                      <span>
                        {e.note ? `${cat?.label} · ` : ""}
                        {payer?.zh} 付 · 全額 NT${fmt(e.amount)}
                      </span>
                      <span
                        style={{
                          display: "block",
                          marginTop: 2,
                          color: "var(--yr-fg-subtle)",
                          fontSize: 11,
                        }}
                      >
                        NT${fmt(e.amount)} ÷ {e.splitWith.length}人 = NT$
                        {fmt(Math.round(e.amount / e.splitWith.length))}/人
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      minWidth: 72,
                      textAlign: "right",
                      color:
                        signed >= 0
                          ? "var(--yr-brand-600)"
                          : "var(--yr-fg-muted)",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: 10,
                        fontWeight: 600,
                        opacity: 0.75,
                      }}
                    >
                      {signed >= 0 ? "分擔" : "已抵"}
                    </span>
                    NT${fmt(Math.abs(signed))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {items.length > 0 && (
          <div className="settle-recon">
            <div className="settle-recon-row">
              <span>你們之間明細合計</span>
              <span className="v">NT${fmt(Math.abs(directNet))}</span>
            </div>
            {matchesSuggestion ? (
              <div className="settle-recon-note ok">
                = 建議轉 NT${fmt(transfer.amount)} · 與明細相符 ✓
              </div>
            ) : (
              <div className="settle-recon-note">
                建議轉 NT${fmt(transfer.amount)} 是系統跨成員抵銷、用最少筆數還清的結果；差額由其他人的債務轉嫁而來。
              </div>
            )}
          </div>
        )}
        <div style={{ height: 8 }} />
      </div>
    </>
  );
}

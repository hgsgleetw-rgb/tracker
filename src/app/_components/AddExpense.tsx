"use client";

import { useState } from "react";
import { Member, Expense, CATEGORIES, CAT_BY_ID, fmt, makeId } from "./data";
import { Avatar } from "./Shared";
import AppIcon from "./Icons";

interface AddExpenseProps {
  team: Member[];
  editing?: Expense | null;
  usePool: boolean;
  onCancel: () => void;
  onSave: (e: Expense) => void;
}

export default function AddExpense({
  team,
  editing,
  usePool,
  onCancel,
  onSave,
}: AddExpenseProps) {
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [category, setCategory] = useState(editing?.category ?? "coffee");
  const [note, setNote] = useState(editing?.note ?? "");
  // In a fund group, new expenses default to paying from the fund.
  const [fromPool, setFromPool] = useState(
    editing ? !!editing.fromPool : usePool
  );
  const [payerId, setPayerId] = useState(
    editing?.payerId ?? team.find((m) => m.isMe)?.id ?? ""
  );
  const [splitWith, setSplitWith] = useState<string[]>(
    editing?.splitWith ?? team.map((m) => m.id)
  );
  const [focus, setFocus] = useState(true);

  const toggle = (id: string) =>
    setSplitWith((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  const allOn = splitWith.length === team.length;
  const toggleAll = () =>
    setSplitWith(
      allOn
        ? [team.find((m) => m.isMe)?.id ?? ""].filter(Boolean)
        : team.map((m) => m.id)
    );

  const amt = parseInt(amount, 10) || 0;
  const perPerson = splitWith.length ? Math.round(amt / splitWith.length) : 0;
  const valid = fromPool
    ? amt > 0
    : amt > 0 && splitWith.length > 0 && !!payerId;

  const submit = () => {
    if (!valid) return;
    onSave({
      id: editing ? editing.id : `e_${makeId()}`,
      at: editing ? editing.at : Date.now(),
      category,
      note: note.trim(),
      payerId: fromPool ? (team.find((m) => m.isMe)?.id ?? payerId) : payerId,
      amount: amt,
      splitWith: fromPool ? [] : [...splitWith],
      fromPool,
    });
  };

  return (
    <>
      <div className="sub-top">
        <button className="back" onClick={onCancel}>
          <AppIcon name="x" size={20} />
        </button>
        <div className="title">
          {editing ? "編輯支出" : "新增支出"}
          <small>{editing ? "修改紀錄" : "幫團隊買單"}</small>
        </div>
        <button
          className="act"
          onClick={submit}
          disabled={!valid}
          style={{ opacity: valid ? 1 : 0.4 }}
        >
          <AppIcon
            name="check"
            size={20}
            color="var(--yr-brand-500)"
            strokeWidth={2.2}
          />
        </button>
      </div>

      <div className="main" style={{ paddingBottom: 20 }}>
        {/* Amount */}
        <div className="card">
          <div className="card__sub">金額</div>
          <div className={`amt-wrap ${focus ? "focus" : ""}`}>
            <span className="pfx">NT$</span>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value.replace(/[^0-9]/g, ""))
              }
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              placeholder="0"
            />
          </div>
        </div>
        {!fromPool && (
          <div className="pp-chip-row">
            <div
              className={`pp-chip ${amt > 0 && splitWith.length > 0 ? "" : "pp-chip--dim"}`}
            >
              <span>每人</span>
              <strong className="yr-mono">NT${fmt(perPerson)}</strong>
            </div>
          </div>
        )}

        {/* Payment source (fund groups only) */}
        {usePool && (
          <>
            <div className="sec-title">
              <h3>付款來源</h3>
            </div>
            <div className="onb-toggle-row">
              <button
                className={`onb-pill ${fromPool ? "on" : ""}`}
                onClick={() => setFromPool(true)}
              >
                <AppIcon name="wallet" size={18} />
                <div>
                  <b>公基金</b>
                  <small>從共同基金扣款</small>
                </div>
              </button>
              <button
                className={`onb-pill ${!fromPool ? "on" : ""}`}
                onClick={() => setFromPool(false)}
              >
                <AppIcon name="scale" size={18} />
                <div>
                  <b>個人付</b>
                  <small>私人代墊、互相分帳</small>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Category */}
        <div className="sec-title">
          <h3>分類</h3>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`cat-chip ${category === c.id ? "on" : ""}`}
              onClick={() => setCategory(c.id)}
            >
              <div className={`cic cat-ico--${c.tone}`}>
                <AppIcon name={c.icon} size={20} strokeWidth={1.8} />
              </div>
              <div>{c.label}</div>
            </button>
          ))}
        </div>

        {/* Note */}
        <div className="sec-title">
          <h3>備註</h3>
        </div>
        <div className="card" style={{ padding: 12 }}>
          <textarea
            className="input"
            placeholder="例：路易莎拿鐵、五十嵐珍奶..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {fromPool ? (
          <div
            className="card"
            style={{ marginTop: 14, fontSize: 13, color: "var(--yr-fg-muted)" }}
          >
            這筆由<b style={{ color: "var(--yr-fg)" }}>公基金</b>支付，會從基金餘額扣除，不會產生個人欠款。
          </div>
        ) : (
          <>
            {/* Payer */}
            <div className="sec-title">
              <h3>誰付的錢</h3>
            </div>
            <div className="mem-pick">
              {team.map((m) => (
                <button
                  key={m.id}
                  className={`mem-pill ${payerId === m.id ? "on" : ""}`}
                  onClick={() => setPayerId(m.id)}
                >
                  <Avatar member={m} />
                  <span>
                    {m.zh}
                    {m.isMe ? " (我)" : ""}
                  </span>
                </button>
              ))}
            </div>

            {/* Split */}
            <div className="sec-title">
              <h3>分給誰（{splitWith.length}人）</h3>
              <button className="more" onClick={toggleAll}>
                {allOn ? "清空" : "全選"}
              </button>
            </div>
            <div className="mem-pick">
              {team.map((m) => (
                <button
                  key={m.id}
                  className={`mem-pill ${splitWith.includes(m.id) ? "on" : ""}`}
                  onClick={() => toggle(m.id)}
                >
                  <Avatar member={m} />
                  <span>
                    {m.zh}
                    {m.isMe ? " (我)" : ""}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="sticky-cta">
        <button
          className="btn btn--primary btn--block btn--lg"
          onClick={submit}
          disabled={!valid}
          style={{ opacity: valid ? 1 : 0.5 }}
        >
          {editing ? "儲存修改" : `記下 NT$${fmt(amt)}`}
        </button>
      </div>
    </>
  );
}

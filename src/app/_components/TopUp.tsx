"use client";

import { useState } from "react";
import { Member, fmt } from "./data";
import { Avatar } from "./Shared";
import AppIcon from "./Icons";

interface TopUpProps {
  team: Member[];
  pool: number;
  onBack: () => void;
  onTopUp: (amt: number) => void;
}

const PRESETS = [200, 500, 1000, 2000];

export default function TopUp({ team, pool, onBack, onTopUp }: TopUpProps) {
  const [amount, setAmount] = useState("");
  const [byId, setById] = useState(team.find((m) => m.isMe)?.id ?? "");
  const [focus, setFocus] = useState(true);

  const amt = parseInt(amount, 10) || 0;
  const valid = amt > 0 && byId;

  const submit = () => { if (valid) onTopUp(amt); };

  return (
    <>
      <div className="sub-top">
        <button className="back" onClick={onBack}>
          <AppIcon name="back" size={22} />
        </button>
        <div className="title">
          儲值池子<small>加錢進共同基金</small>
        </div>
        <div className="act" />
      </div>

      <div className="main">
        <div className="hero">
          <div className="hero__lbl">目前池子餘額</div>
          <div className="hero__amt">
            <span className="currency">NT$</span>
            {fmt(pool)}
          </div>
          <div className="hero__sub">儲值後將加入此餘額</div>
        </div>

        <div className="sec-title">
          <h3>金額</h3>
        </div>
        <div className="card">
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              marginTop: 12,
            }}
          >
            {PRESETS.map((p) => (
              <button
                key={p}
                className="btn btn--secondary"
                style={{ height: 36, padding: 0, fontSize: 13 }}
                onClick={() => setAmount(String(p))}
              >
                ${p}
              </button>
            ))}
          </div>
        </div>

        <div className="sec-title">
          <h3>誰儲值</h3>
        </div>
        <div className="mem-pick">
          {team.map((m) => (
            <button
              key={m.id}
              className={`mem-pill ${byId === m.id ? "on" : ""}`}
              onClick={() => setById(m.id)}
            >
              <Avatar member={m} />
              <span>
                {m.zh}
                {m.isMe ? " (我)" : ""}
              </span>
            </button>
          ))}
        </div>

        {amt > 0 && (
          <div
            className="card"
            style={{
              marginTop: 14,
              background: "var(--yr-success-50)",
              borderColor: "#A6F4C5",
            }}
          >
            <div className="row-flex">
              <span
                style={{
                  font: "500 13px/1.3 var(--yr-font-sans)",
                  color: "var(--yr-success-700)",
                }}
              >
                儲值後池子餘額
              </span>
              <span
                className="yr-mono"
                style={{
                  font: "700 18px/1 var(--yr-font-mono)",
                  color: "var(--yr-success-700)",
                }}
              >
                NT${fmt(pool + amt)}
              </span>
            </div>
          </div>
        )}
        <div style={{ height: 100 }} />
      </div>

      <div className="sticky-cta">
        <button
          className="btn btn--primary btn--block btn--lg"
          onClick={submit}
          disabled={!valid}
          style={{ opacity: valid ? 1 : 0.5 }}
        >
          確認儲值 NT${fmt(amt)}
        </button>
      </div>
    </>
  );
}

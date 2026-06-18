"use client";

import { useState } from "react";
import AppIcon from "./Icons";

interface OnboardingProps {
  onComplete: (userName: string) => void;
  defaultName?: string;
}

export default function Onboarding({ onComplete, defaultName = "" }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(defaultName);

  const finish = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onComplete(trimmed);
  };

  return (
    <div className="onb">
      <div className="onb-hero" />

      <div className="onb-body">
        {step === 0 && (
          <div className="onb-step onb-step--welcome">
            <div className="onb-mark">
              <AppIcon name="wallet" size={32} color="#fff" />
            </div>
            <h1 className="onb-title">我是記帳的</h1>
            <p className="onb-sub">
              和朋友、家人或同事一起管錢，
              <br />
              誰付了多少、誰欠誰多少，一目了然。
            </p>

            <ul
              className="onb-feats"
              style={{
                alignItems: "stretch",
                justifyContent: "flex-start",
                padding: "16px",
                gap: "24px",
              }}
            >
              <li>
                <span
                  className="onb-feat-ico"
                  style={{
                    background: "var(--yr-brand-50)",
                    color: "var(--yr-brand-600)",
                  }}
                >
                  <AppIcon name="users" size={18} />
                </span>
                <div>
                  <b>多人協作</b>
                  <small>邀請朋友一起記帳</small>
                </div>
              </li>
              <li>
                <span
                  className="onb-feat-ico"
                  style={{ background: "#ECFDF3", color: "#12B76A" }}
                >
                  <AppIcon name="scale" size={18} />
                </span>
                <div>
                  <b>自動結算</b>
                  <small>用最少筆數轉帳搞定</small>
                </div>
              </li>
              <li>
                <span
                  className="onb-feat-ico"
                  style={{ background: "#FEF6E7", color: "#DC6803" }}
                >
                  <AppIcon name="wallet" size={18} />
                </span>
                <div>
                  <b>共同基金</b>
                  <small>有共用錢包的群組也適用</small>
                </div>
              </li>
            </ul>
          </div>
        )}

        {step === 1 && (
          <div className="onb-step">
            <h2 className="onb-h2">你叫什麼名字？</h2>
            <p className="onb-p">
              這是其他成員會看到的稱呼，之後可以更改。
            </p>
            <input
              className="input onb-input"
              placeholder="例如：Herry、小明、Alice"
              autoFocus
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") finish(); }}
            />
            <div className="onb-inline-actions">
              <button
                className="btn btn--secondary"
                onClick={() => setStep(0)}
              >
                上一步
              </button>
              <button
                className="btn btn--primary"
                disabled={!name.trim()}
                onClick={finish}
              >
                下一步
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="onb-foot">
        {step === 0 && (
          <button
            className="btn btn--primary btn--block btn--lg"
            onClick={() => setStep(1)}
          >
            開始
          </button>
        )}
      </div>
    </div>
  );
}

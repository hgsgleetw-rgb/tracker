"use client";

import { useState, useLayoutEffect } from "react";
import AppIcon from "./Icons";

const STEPS = [
  {
    target: ".hero-zone",
    placement: "below" as const,
    title: "目前基金",
    body: "這裡顯示群組的共同基金，誰都可以儲值或從中支出。",
  },
  {
    target: ".hero-quick",
    placement: "below" as const,
    title: "快速操作",
    body: "從這裡可以儲值、看歷史、結算或管理成員。",
  },
  {
    target: ".tab--fab",
    placement: "above" as const,
    title: "記帳",
    body: "點正中間的 ＋ 按鈕記錄一筆支出，可以選付款人和分帳成員。",
  },
  {
    target: '.tab[data-tab="settle"]',
    placement: "above" as const,
    title: "結算",
    body: "看每個人的淨額，系統會自動算出最少轉帳筆數。",
  },
  {
    target: null,
    placement: null,
    title: "準備好開始了嗎？",
    body: "你剛剛看到的是示範群組「YR Coffee Club」。\n建立你自己的第一個群組吧！",
    cta: "建立我的群組",
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TutorialOverlayProps {
  onSkip: () => void;
  onFinish: () => void;
}

export default function TutorialOverlay({ onSkip, onFinish }: TutorialOverlayProps) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const step = STEPS[i];

  useLayoutEffect(() => {
    if (!step.target) { setRect(null); return; }
    const el = document.querySelector(step.target);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    const app = document.querySelector(".app")?.getBoundingClientRect();
    if (!app) { setRect(null); return; }
    setRect({
      top: r.top - app.top,
      left: r.left - app.left,
      width: r.width,
      height: r.height,
    });
  }, [i, step.target]);

  const last = i === STEPS.length - 1;

  let tipStyle: React.CSSProperties = {};
  if (rect) {
    if (step.placement === "above") {
      tipStyle = { bottom: `calc(100% - ${rect.top}px + 12px)`, left: 16, right: 16 };
    } else {
      tipStyle = { top: rect.top + rect.height + 12, left: 16, right: 16 };
    }
  } else {
    tipStyle = { top: "50%", left: 24, right: 24, transform: "translateY(-50%)" };
  }

  return (
    <div className="tut">
      {rect ? (
        <>
          <div className="tut-mask" style={{ top: 0, left: 0, right: 0, height: rect.top - 6 }} />
          <div className="tut-mask" style={{ top: rect.top - 6, left: 0, width: rect.left - 6, height: rect.height + 12 }} />
          <div className="tut-mask" style={{ top: rect.top - 6, left: rect.left + rect.width + 6, right: 0, height: rect.height + 12 }} />
          <div className="tut-mask" style={{ top: rect.top + rect.height + 6, left: 0, right: 0, bottom: 0 }} />
          <div className="tut-ring" style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }} />
        </>
      ) : (
        <div className="tut-mask tut-mask--full" />
      )}

      <div className="tut-tip" style={tipStyle}>
        <div className="tut-progress">
          {STEPS.map((_, idx) => (
            <span key={idx} className={`tut-dot ${idx === i ? "tut-dot--on" : ""}`} />
          ))}
        </div>
        <h3 className="tut-title">{step.title}</h3>
        <p className="tut-body">{step.body}</p>
        <div className="tut-actions">
          <button className="tut-skip" onClick={onSkip}>跳過教學</button>
          <div style={{ display: "flex", gap: 8 }}>
            {i > 0 && (
              <button className="btn btn--secondary btn--sm" onClick={() => setI(i - 1)}>上一步</button>
            )}
            <button className="btn btn--primary btn--sm" onClick={() => last ? onFinish() : setI(i + 1)}>
              {last ? (step.cta ?? "完成") : "下一步"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

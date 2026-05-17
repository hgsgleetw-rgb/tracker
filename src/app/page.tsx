"use client";

import { useEffect, useState } from "react";
import { useLiff } from "@/providers/LiffProvider";

type Summary = {
  income: number;
  expense: number;
  balance: number;
  expenseCount: number;
  avgExpense: number;
  firstDate: string | null;
};

type Tab = "overview" | "records" | "ledger" | "settle" | "members";

const MOCK_FUND = 1600;
const MOCK_SETTLEMENTS = [
  { from: "Alice", fromColor: "#F87171", to: "Jerry", toColor: "#FB923C", amount: 403 },
  { from: "宗偉", fromColor: "#FBBF24", to: "Jerry", toColor: "#FB923C", amount: 398 },
];
const MOCK_CATEGORIES = [
  { name: "聚餐", pct: 48, amount: 1860, color: "#3D6CB9" },
  { name: "咖啡", pct: 28, amount: 1085, color: "#F97316" },
  { name: "午餐", pct: 14, amount: 540, color: "#22C55E" },
  { name: "手搖", pct: 10, amount: 385, color: "#60A5FA" },
];
const MOCK_ACTIVITIES = [
  { name: "路易莎", icon: "☕", iconBg: "#F97316", payer: "Herry", members: ["H","J","T"], amount: 285, date: "5/14 週四" },
  { name: "五十嵐", icon: "🧋", iconBg: "#14B8A6", payer: "Alice", members: ["A","J","T","宗"], amount: 220, date: "5/14 週四" },
  { name: "鬍鬚張便當", icon: "🍱", iconBg: "#F97316", payer: "Tommy", members: ["H","T","A","A","+2"], amount: 540, date: "5/13 週三" },
  { name: "Cama", icon: "☕", iconBg: "#F97316", payer: "Herry", members: ["H","A"], amount: 180, date: "5/13 週三" },
  { name: "全聯零食", icon: "🛒", iconBg: "#1E3A5F", payer: "Andy", members: ["H","T","A","A","+2"], amount: 320, date: "5/12 週二" },
];

const MEMBER_COLORS: Record<string, string> = {
  H: "#6B7280", J: "#FB923C", T: "#A78BFA", A: "#34D399", "宗": "#FBBF24",
};

function MemberBadge({ label }: { label: string }) {
  const bg = MEMBER_COLORS[label] ?? "#9CA3AF";
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold text-white"
      style={{ backgroundColor: bg }}
    >
      {label}
    </span>
  );
}

export default function Home() {
  const { profile, ledgerId, ledgerName, isReady, error } = useLiff();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!ledgerId) return;
    fetch(`/api/ledger/${ledgerId}/summary`)
      .then((r) => r.json())
      .then(setSummary);
  }, [ledgerId]);

  if (!isReady) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-[#3D6CB9]">
        <p className="text-white/60 text-sm">載入中...</p>
      </main>
    );
  }
  if (error) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-[#f2f4f8] p-6">
        <p className="text-red-500 text-sm text-center">{error}</p>
      </main>
    );
  }

  const initials = profile?.displayName?.[0]?.toUpperCase() ?? "?";
  const fund = MOCK_FUND;
  const monthlyExpense = summary?.expense ?? 0;
  const myNet = summary ? summary.income - summary.expense : 0;
  const pendingCount = MOCK_SETTLEMENTS.length + 3;
  const now = new Date();
  const firstDateLabel = summary?.firstDate
    ? `${now.getMonth() + 1}月${new Date(summary.firstDate).getDate()}日首次記錄`
    : `${now.getMonth() + 1}月尚無記錄`;

  return (
    <div className="flex flex-col min-h-screen bg-[#f2f4f8]">
      {/* Hero */}
      <div className="bg-[#3D6CB9] px-5 pt-14 pb-8 relative">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-5">
          {profile?.pictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.pictureUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-white font-bold">
              {initials}
            </div>
          )}
          <div className="flex-1">
            <p className="text-white font-semibold text-base leading-tight">{ledgerName ?? "YR Coffee Club"}</p>
            <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 inline-block" />
              {pendingCount} 筆待結算
            </p>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <span className="text-white text-lg leading-none tracking-tighter">···</span>
          </button>
        </div>

        {/* Fund */}
        <p className="text-white/70 text-xs mb-1">目前基金</p>
        <p className="text-white font-bold mb-3">
          <span className="text-base mr-1">NT$</span>
          <span className="text-4xl">{fund.toLocaleString()}</span>
        </p>

        {/* Progress */}
        <div className="flex justify-between text-xs text-white/70 mb-1">
          <span>本月已支出</span>
          <span className="font-medium text-white">NT${monthlyExpense.toLocaleString()}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/25 mb-1">
          <div
            className="h-full rounded-full bg-white"
            style={{ width: fund > 0 ? `${Math.min((monthlyExpense / (fund * 3)) * 100, 100)}%` : "75%" }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/60">
          <span>我的淨額 {myNet}</span>
          <span>待結算 {pendingCount} 筆</span>
        </div>

        {/* Action buttons */}
        <div className="flex justify-around mt-6">
          {[
            { icon: "+", label: "儲值" },
            { icon: "🕐", label: "紀錄" },
            { icon: "⇄", label: "結算" },
            { icon: "👤", label: "成員" },
          ].map(({ icon, label }) => (
            <button key={label} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-light">
                {icon}
              </div>
              <span className="text-white/80 text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* White content sheet */}
      <div className="flex-1 bg-[#f2f4f8] -mt-4 rounded-t-3xl overflow-hidden">
        <div className="px-4 pt-5 space-y-5 pb-28">

          {/* 這個月花了多少 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">這個月花了多少</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                  <span>📅</span><span>本月支出</span>
                </div>
                <p className="text-xl font-bold text-gray-900">NT${monthlyExpense.toLocaleString()}</p>
                <span className="inline-block mt-2 text-[11px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                  {firstDateLabel}
                </span>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                  <span>🕐</span><span>本月筆數</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{summary?.expenseCount ?? 0}</p>
                <p className="text-xs text-gray-400 mt-2">平均 NT${(summary?.avgExpense ?? 0).toLocaleString()}/筆</p>
              </div>
            </div>
          </section>

          {/* 結算建議 */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-gray-900">結算建議</h2>
              <button className="text-xs text-[#3D6CB9] font-medium">查看全部 →</button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
              {MOCK_SETTLEMENTS.map((s, i) => (
                <div key={i} className="flex items-center px-4 py-4 gap-2">
                  <div className="flex flex-col items-center gap-1 w-12">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: s.fromColor }}>
                      {s.from[0]}
                    </div>
                    <span className="text-[10px] text-gray-500">{s.from}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                    <span className="border border-gray-200 rounded-full px-2 py-0.5 text-xs font-medium text-gray-600 bg-white whitespace-nowrap">
                      NT${s.amount}
                    </span>
                    <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                    <span className="text-gray-300 text-sm">›</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 w-12">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: s.toColor }}>
                      {s.to[0]}
                    </div>
                    <span className="text-[10px] text-gray-500">{s.to}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 本月分類 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">本月分類</h2>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-gray-400">本月總支出</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">
                    NT$ {MOCK_CATEGORIES.reduce((s, c) => s + c.amount, 0).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{MOCK_CATEGORIES.length} 個類別</span>
              </div>
              <div className="space-y-3">
                {MOCK_CATEGORIES.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{cat.name} <span className="text-gray-400 text-xs">{cat.pct}%</span></span>
                      <span className="font-medium text-gray-900">NT${cat.amount.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full rounded-full" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 最近活動 */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-gray-900">最近活動</h2>
              <button className="text-xs text-[#3D6CB9] font-medium">查看全部 →</button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
              {MOCK_ACTIVITIES.map((act, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: act.iconBg }}>
                    <span>{act.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{act.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-gray-400">{act.payer} 付</span>
                      <div className="flex gap-0.5">
                        {act.members.map((m, j) => <MemberBadge key={j} label={m} />)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">NT${act.amount}</p>
                    <p className="text-xs text-gray-400">{act.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-end justify-around px-4 pt-2 pb-6 shadow-lg z-50">
        {(
          [
            { tab: "overview", icon: "🏠", label: "總覽" },
            { tab: "records", icon: "🕐", label: "紀錄" },
            { tab: "ledger", icon: null, label: "記帳" },
            { tab: "settle", icon: "⇄", label: "結算" },
            { tab: "members", icon: "👥", label: "成員" },
          ] as const
        ).map(({ tab, icon, label }) =>
          tab === "ledger" ? (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex flex-col items-center -mt-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#3D6CB9] flex items-center justify-center shadow-md">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <span className="text-[10px] text-[#3D6CB9] font-medium mt-1">{label}</span>
            </button>
          ) : (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center gap-0.5 px-2 ${activeTab === tab ? "text-[#3D6CB9]" : "text-gray-400"}`}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-[10px]">{label}</span>
            </button>
          )
        )}
      </nav>
    </div>
  );
}

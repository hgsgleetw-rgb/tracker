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
      <main className="flex flex-1 items-center justify-center min-h-screen bg-[#f5f6fa]">
        <p className="text-gray-400 text-sm">載入中...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center min-h-screen bg-[#f5f6fa] p-6">
        <p className="text-red-500 text-sm text-center">{error}</p>
      </main>
    );
  }

  const now = new Date();
  const monthLabel = `${now.getMonth() + 1}月`;
  const firstDateLabel = summary?.firstDate
    ? `${monthLabel}首次記錄 ${new Date(summary.firstDate).getDate()}日`
    : `${monthLabel}尚無記錄`;

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f6fa]">
      {/* Hero card */}
      <div className="bg-[#1b3a5c] text-white px-5 pt-12 pb-6 rounded-b-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {profile?.pictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.pictureUrl}
              alt={profile.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {profile?.displayName?.[0] ?? "?"}
            </div>
          )}
          <div className="flex-1">
            <p className="font-semibold text-base leading-tight">{ledgerName ?? "我的帳本"}</p>
            <p className="text-white/60 text-xs">{summary?.expenseCount ?? 0} 筆記錄</p>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>

        {/* Balance */}
        <p className="text-white/60 text-xs mb-1">本月收支</p>
        <p className="text-4xl font-bold mb-4">
          NT${(summary?.balance ?? 0).toLocaleString()}
        </p>

        {/* Progress bar */}
        <div className="flex justify-between text-xs text-white/60 mb-1">
          <span>本月支出</span>
          <span>NT${(summary?.expense ?? 0).toLocaleString()}</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full mb-1">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{
              width: summary && summary.income > 0
                ? `${Math.min((summary.expense / summary.income) * 100, 100)}%`
                : summary?.expense ? "100%" : "0%",
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/60 mt-1">
          <span>收入 NT${(summary?.income ?? 0).toLocaleString()}</span>
          <span>共 {summary?.expenseCount ?? 0} 筆</span>
        </div>

        {/* Action buttons */}
        <div className="flex justify-around mt-6">
          {[
            { icon: "📥", label: "收入" },
            { icon: "📤", label: "支出" },
            { icon: "📊", label: "統計" },
            { icon: "⚙️", label: "設定" },
          ].map(({ icon, label }) => (
            <button key={label} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-xl">
                {icon}
              </div>
              <span className="text-xs text-white/80">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats section */}
      <div className="px-4 mt-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">這個月花了多少</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
              <span>📅</span><span>本月支出</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              NT${(summary?.expense ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">{firstDateLabel}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
              <span>🕐</span><span>本月筆數</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{summary?.expenseCount ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">
              平均 NT${(summary?.avgExpense ?? 0).toLocaleString()}/筆
            </p>
          </div>
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div className="px-4 mt-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-gray-700">最近記錄</h2>
          <button className="text-xs text-blue-500">查看全部 →</button>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center gap-2 text-gray-400">
          <span className="text-3xl">📋</span>
          <p className="text-sm">尚無記錄</p>
          <p className="text-xs text-center">點下方「支出」或「收入」按鈕開始記帳</p>
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="flex-1" />

      {/* Bottom navigation */}
      <nav className="sticky bottom-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 shadow-lg">
        {(
          [
            { tab: "overview", icon: "🏠", label: "總覽" },
            { tab: "records", icon: "🕐", label: "記錄" },
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
              <div className="w-14 h-14 rounded-full bg-[#ff6b2b] flex items-center justify-center shadow-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <span className="text-[10px] text-gray-500 mt-1">{label}</span>
            </button>
          ) : (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${activeTab === tab ? "text-[#1b3a5c]" : "text-gray-400"}`}
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

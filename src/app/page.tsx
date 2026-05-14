"use client";

import { useLiff } from "@/providers/LiffProvider";

export default function Home() {
  const { profile, isReady, error } = useLiff();

  if (!isReady) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-gray-500 text-sm">載入中...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-red-500 text-sm text-center">{error}</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      {profile?.pictureUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.pictureUrl}
          alt={profile.displayName}
          className="w-16 h-16 rounded-full"
        />
      )}
      <h1 className="text-xl font-semibold">
        Hi, {profile?.displayName ?? "用戶"} 👋
      </h1>
      <p className="text-gray-500 text-sm">記帳 App 已準備就緒</p>
    </main>
  );
}

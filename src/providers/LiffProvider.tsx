"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type Liff from "@line/liff";

type LiffProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

type LiffContextType = {
  liff: typeof Liff | null;
  profile: LiffProfile | null;
  ledgerId: string | null;
  ledgerName: string | null;
  isReady: boolean;
  error: string | null;
};

const LiffContext = createContext<LiffContextType>({
  liff: null,
  profile: null,
  ledgerId: null,
  ledgerName: null,
  isReady: false,
  error: null,
});

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [liff, setLiff] = useState<typeof Liff | null>(null);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [ledgerId, setLedgerId] = useState<string | null>(null);
  const [ledgerName, setLedgerName] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { initLiff, getLiffProfile } = await import("@/lib/liff");
        const liffObj = await initLiff();
        setLiff(liffObj);
        const p = await getLiffProfile();
        setProfile({
          userId: p.userId,
          displayName: p.displayName,
          pictureUrl: p.pictureUrl ?? undefined,
        });

        const res = await fetch("/api/user/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lineUserId: p.userId,
            displayName: p.displayName,
            pictureUrl: p.pictureUrl ?? null,
          }),
        });
        if (!res.ok) throw new Error(`user/sync failed: ${res.status}`);
        const data = await res.json();
        setLedgerId(data.ledgerId);
        setLedgerName(data.ledgerName);
      } catch (e) {
        setError(e instanceof Error ? e.message : "LIFF init failed");
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  return (
    <LiffContext.Provider value={{ liff, profile, ledgerId, ledgerName, isReady, error }}>
      {children}
    </LiffContext.Provider>
  );
}

export const useLiff = () => useContext(LiffContext);

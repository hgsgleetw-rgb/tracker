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
  isReady: boolean;
  error: string | null;
};

const LiffContext = createContext<LiffContextType>({
  liff: null,
  profile: null,
  isReady: false,
  error: null,
});

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [liff, setLiff] = useState<typeof Liff | null>(null);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
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
      } catch (e) {
        setError(e instanceof Error ? e.message : "LIFF init failed");
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  return (
    <LiffContext.Provider value={{ liff, profile, isReady, error }}>
      {children}
    </LiffContext.Provider>
  );
}

export const useLiff = () => useContext(LiffContext);

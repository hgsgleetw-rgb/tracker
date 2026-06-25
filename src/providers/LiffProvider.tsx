"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type Liff from "@line/liff";
import { setTokenGetter } from "@/lib/api";

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
  needsLogin: boolean; // browser, waiting for the user to pick a provider
  googleClientId: string;
  loginLine: () => void;
  onGoogleCredential: (credential: string) => void;
};

const LiffContext = createContext<LiffContextType>({
  liff: null,
  profile: null,
  isReady: false,
  error: null,
  needsLogin: false,
  googleClientId: "",
  loginLine: () => {},
  onGoogleCredential: () => {},
});

// Decode a JWT payload (base64url, unicode-safe).
function decodeJwt(token: string): Record<string, unknown> {
  const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(b64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(json);
}

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [liff, setLiff] = useState<typeof Liff | null>(null);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  useEffect(() => {
    (async () => {
      try {
        const { initLiff } = await import("@/lib/liff");
        const liffObj = await initLiff(); // init only; no auto-login
        setLiff(liffObj);

        const useLineSession = async () => {
          const p = await liffObj.getProfile();
          setTokenGetter(() => liffObj.getAccessToken());
          setProfile({
            userId: p.userId,
            displayName: p.displayName,
            pictureUrl: p.pictureUrl ?? undefined,
          });
          setIsReady(true);
        };

        // Inside the LINE app → always use LINE (Google is blocked in webviews).
        if (liffObj.isInClient()) {
          if (!liffObj.isLoggedIn()) {
            liffObj.login();
            return; // redirects
          }
          await useLineSession();
          return;
        }

        // Regular browser: restore a previous LINE session, else show choice.
        const saved =
          typeof window !== "undefined"
            ? localStorage.getItem("auth-provider")
            : null;
        if (saved === "line" && liffObj.isLoggedIn()) {
          await useLineSession();
          return;
        }
        setNeedsLogin(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "登入初始化失敗");
        setIsReady(true);
      }
    })();
  }, []);

  const loginLine = () => {
    try {
      localStorage.setItem("auth-provider", "line");
    } catch {}
    liff?.login();
  };

  const onGoogleCredential = (credential: string) => {
    try {
      localStorage.setItem("auth-provider", "google");
    } catch {}
    setTokenGetter(() => `google:${credential}`);
    try {
      const payload = decodeJwt(credential);
      setProfile({
        userId: String(payload.sub ?? ""),
        displayName: String(payload.name ?? payload.email ?? "我"),
        pictureUrl: payload.picture ? String(payload.picture) : undefined,
      });
    } catch {
      setProfile({ userId: "", displayName: "我" });
    }
    setNeedsLogin(false);
    setIsReady(true);
  };

  return (
    <LiffContext.Provider
      value={{
        liff,
        profile,
        isReady,
        error,
        needsLogin,
        googleClientId,
        loginLine,
        onGoogleCredential,
      }}
    >
      {children}
    </LiffContext.Provider>
  );
}

export const useLiff = () => useContext(LiffContext);

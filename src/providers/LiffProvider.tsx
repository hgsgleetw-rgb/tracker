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

// A Google ID token is valid for ~1h. Treat it as expired 60s early.
function isJwtExpired(token: string): boolean {
  try {
    const exp = Number(decodeJwt(token).exp);
    return !exp || exp * 1000 < Date.now() + 60_000;
  } catch {
    return true;
  }
}

function profileFromJwt(token: string): LiffProfile {
  try {
    const p = decodeJwt(token);
    return {
      userId: String(p.sub ?? ""),
      displayName: String(p.name ?? p.email ?? "我"),
      pictureUrl: p.picture ? String(p.picture) : undefined,
    };
  } catch {
    return { userId: "", displayName: "我" };
  }
}

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [liff, setLiff] = useState<typeof Liff | null>(null);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  // Inlined at build time from the Vercel env var (NEXT_PUBLIC_*).
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
        // Restore a previous Google session if the saved token is still valid
        // (~1h) — skip the login screen entirely, no re-click needed.
        if (saved === "google") {
          const cred = localStorage.getItem("google-credential");
          if (cred && !isJwtExpired(cred)) {
            setTokenGetter(() => `google:${cred}`);
            setProfile(profileFromJwt(cred));
            setIsReady(true);
            return;
          }
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
      localStorage.setItem("google-credential", credential);
    } catch {}
    setTokenGetter(() => `google:${credential}`);
    setProfile(profileFromJwt(credential));
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

// rebuild 991625e

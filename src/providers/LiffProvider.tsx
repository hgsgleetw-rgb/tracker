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
  lastGoogle: LiffProfile | null; // last Google account used on this device
  provider: "line" | "google" | null; // how the current session signed in
  loginLine: () => void;
  onGoogleCredential: (credential: string) => void;
  logout: () => void;
};

const LiffContext = createContext<LiffContextType>({
  liff: null,
  profile: null,
  isReady: false,
  error: null,
  needsLogin: false,
  googleClientId: "",
  lastGoogle: null,
  provider: null,
  loginLine: () => {},
  onGoogleCredential: () => {},
  logout: () => {},
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

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)")
  );
  return m ? decodeURIComponent(m[1]) : null;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
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
  const [lastGoogle, setLastGoogle] = useState<LiffProfile | null>(null);
  const [provider, setProvider] = useState<"line" | "google" | null>(null);

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
          setProvider("line");
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

        // Returning from the Google redirect flow: the credential was handed
        // back to us in a short-lived cookie. Sign in with it.
        const gcred = readCookie("g_cred");
        if (gcred) {
          deleteCookie("g_cred");
          try {
            localStorage.setItem("auth-provider", "google");
            localStorage.setItem("google-credential", gcred);
          } catch {}
          setProvider("google");
          setTokenGetter(() => `google:${gcred}`);
          setProfile(profileFromJwt(gcred));
          setIsReady(true);
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
        // Restore a previous Google session.
        if (saved === "google") {
          const cred = localStorage.getItem("google-credential");
          if (cred) {
            // Remember who they are so the login screen can greet them.
            setLastGoogle(profileFromJwt(cred));
            // If the token is still valid (~1h), skip the login screen
            // entirely — no re-click needed.
            if (!isJwtExpired(cred)) {
              setProvider("google");
              setTokenGetter(() => `google:${cred}`);
              setProfile(profileFromJwt(cred));
              setIsReady(true);
              return;
            }
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

  const logout = () => {
    try {
      localStorage.removeItem("auth-provider");
      localStorage.removeItem("google-credential");
    } catch {}
    try {
      // Disable Google auto sign-in so the chooser shows next time.
      window.google?.accounts?.id?.disableAutoSelect?.();
    } catch {}
    try {
      if (liff?.isLoggedIn()) liff.logout();
    } catch {}
    // Reload so the provider re-runs and lands on the login screen.
    if (typeof window !== "undefined") window.location.reload();
  };

  const onGoogleCredential = (credential: string) => {
    try {
      localStorage.setItem("auth-provider", "google");
      localStorage.setItem("google-credential", credential);
    } catch {}
    setProvider("google");
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
        lastGoogle,
        provider,
        loginLine,
        onGoogleCredential,
        logout,
      }}
    >
      {children}
    </LiffContext.Provider>
  );
}

export const useLiff = () => useContext(LiffContext);

// rebuild 991625e

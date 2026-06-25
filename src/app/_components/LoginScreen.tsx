"use client";

import { useEffect, useRef } from "react";
import { useLiff } from "@/providers/LiffProvider";
import AppIcon from "./Icons";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { google?: any } }

export default function LoginScreen() {
  const { googleClientId, lastGoogle, loginLine, onGoogleCredential } = useLiff();
  const googleDiv = useRef<HTMLDivElement>(null);

  // Re-trigger Google sign-in for the remembered account.
  const continueGoogle = () => {
    window.google?.accounts?.id?.prompt();
  };

  useEffect(() => {
    if (!googleClientId) return;

    const init = () => {
      const g = window.google;
      if (!g?.accounts?.id || !googleDiv.current) return;
      g.accounts.id.initialize({
        client_id: googleClientId,
        callback: (resp: { credential?: string }) => {
          if (resp.credential) onGoogleCredential(resp.credential);
        },
        auto_select: true,
        // Use the browser's native FedCM sign-in — far more reliable on
        // mobile, where the old iframe flow can hang on accounts.google.com.
        use_fedcm_for_prompt: true,
        itp_support: true,
      });
      g.accounts.id.renderButton(googleDiv.current, {
        theme: "outline",
        size: "large",
        width: 260,
        text: "continue_with",
        shape: "pill",
      });
      // Returning users get auto-signed-in without a click.
      g.accounts.id.prompt();
    };

    if (window.google?.accounts?.id) {
      init();
      return;
    }
    const SRC = "https://accounts.google.com/gsi/client";
    let s = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", init);
    return () => s?.removeEventListener("load", init);
  }, [googleClientId, onGoogleCredential]);

  return (
    <div className="login">
      <div className="login-mark">
        <AppIcon name="wallet" size={34} color="#fff" />
      </div>
      <h1 className="login-title">記帳</h1>
      <p className="login-sub">選擇登入方式，開始和大家一起記帳</p>

      <button className="login-line" onClick={loginLine}>
        用 LINE 登入
      </button>

      {googleClientId ? (
        <>
          <div className="login-or">或</div>

          {lastGoogle ? (
            <button className="login-remember" onClick={continueGoogle}>
              {lastGoogle.pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="login-remember-avatar"
                  src={lastGoogle.pictureUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="login-remember-avatar login-remember-fallback">
                  {(lastGoogle.displayName || "?").charAt(0).toUpperCase()}
                </span>
              )}
              <span className="login-remember-text">
                <span className="login-remember-name">
                  以 {lastGoogle.displayName} 進入
                </span>
                <span className="login-remember-sub">繼續使用 Google 登入</span>
              </span>
              <span className="login-remember-arrow">→</span>
            </button>
          ) : null}

          {/* Real Google sign-in button — also the "use another account" path. */}
          <div
            ref={googleDiv}
            className="login-google"
            style={lastGoogle ? { marginTop: 4, opacity: 0.85 } : undefined}
          />
          {lastGoogle ? (
            <p className="login-remember-hint">換帳號請點上方 Google 按鈕</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

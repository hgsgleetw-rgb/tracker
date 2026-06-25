"use client";

import { useEffect, useRef } from "react";
import { useLiff } from "@/providers/LiffProvider";
import AppIcon from "./Icons";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { google?: any } }

export default function LoginScreen() {
  const { googleClientId, loginLine, onGoogleCredential } = useLiff();
  const googleDiv = useRef<HTMLDivElement>(null);

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
        auto_select: false,
        itp_support: true,
        // Redirect (not popup) so mobile doesn't hang on gsi/transform —
        // Google posts the credential to our server route, which bounces it
        // back to the app.
        ux_mode: "redirect",
        login_uri: `${window.location.origin}/api/auth/google`,
      });
      g.accounts.id.renderButton(googleDiv.current, {
        theme: "outline",
        size: "large",
        width: 280,
        text: "continue_with",
        shape: "pill",
        locale: "zh_TW",
      });
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

      <div className="login-actions">
        <button className="login-btn" onClick={loginLine}>
          <span className="login-btn-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <rect width="24" height="24" rx="6" fill="#06C755" />
              <path
                d="M12 5.6c-3.9 0-7 2.5-7 5.6 0 2.8 2.5 5.1 5.9 5.5.2 0 .5.1.6.3.1.2 0 .5 0 .6l-.1.6c0 .2-.1.7.6.4.7-.3 3.9-2.3 5.3-3.9 1-1 1.5-2.1 1.5-3.5C20.3 8.1 17.2 5.6 12 5.6z"
                fill="#fff"
              />
            </svg>
          </span>
          <span className="login-btn-label">用 LINE 登入</span>
        </button>

        {googleClientId ? (
          <>
            <div className="login-or">或</div>
            <div ref={googleDiv} className="login-google" />
          </>
        ) : null}
      </div>
    </div>
  );
}

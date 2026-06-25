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
        auto_select: true,
      });
      g.accounts.id.renderButton(googleDiv.current, {
        theme: "outline",
        size: "large",
        width: 260,
        text: "signin_with",
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
          <div ref={googleDiv} className="login-google" />
        </>
      ) : null}
    </div>
  );
}

"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100dvh",
          padding: "24px",
          gap: "12px",
          fontFamily: "sans-serif",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 32 }}>⚠️</p>
        <p style={{ fontWeight: 600, fontSize: 16 }}>發生錯誤</p>
        <p style={{ fontSize: 13, color: "#888", wordBreak: "break-all" }}>
          {error.message}
        </p>
        <button
          onClick={() => this.setState({ error: null })}
          style={{
            marginTop: 8,
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            background: "#333",
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          重試
        </button>
      </div>
    );
  }
}

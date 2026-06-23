"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLiff } from "@/providers/LiffProvider";
import AppIcon from "./Icons";

interface JoinGroupProps {
  code: string;
  onJoined: (groupId: string) => void;
  onCancel: () => void;
}

type Preview = Awaited<ReturnType<typeof api.joinPreview>>;

export default function JoinGroup({ code, onJoined, onCancel }: JoinGroupProps) {
  const { profile } = useLiff();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newName, setNewName] = useState(profile?.displayName ?? "");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await api.joinPreview(code);
        if (!cancelled) setPreview(p);
      } catch {
        if (!cancelled) setError("邀請連結無效或已失效");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const doJoin = async (body: { claimMemberId?: string; newName?: string }) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.join(code, body);
      if (res.status === "member" && res.groupId) {
        onJoined(res.groupId);
      } else {
        setSubmitted(true); // pending admin approval
        setBusy(false);
      }
    } catch {
      setError("加入失敗，請再試一次");
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="onb">
        <div className="onb-body">
          <div className="onb-step" style={{ textAlign: "center", paddingTop: 40 }}>
            <h2 className="onb-h2">{error}</h2>
            <p className="onb-p">請向分享連結的人重新索取。</p>
          </div>
        </div>
        <div className="onb-foot">
          <button className="btn btn--secondary btn--block" onClick={onCancel}>
            返回
          </button>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="onb" style={{ justifyContent: "center", alignItems: "center" }}>
        <p style={{ color: "var(--yr-fg-subtle)", fontSize: 14 }}>載入中...</p>
      </div>
    );
  }

  if (preview.alreadyMember) {
    return (
      <div className="onb">
        <div className="onb-body">
          <div className="onb-step" style={{ textAlign: "center", paddingTop: 40 }}>
            <div className="onb-mark">
              <AppIcon name="users" size={32} color="#fff" />
            </div>
            <h2 className="onb-h2">{preview.groupName}</h2>
            <p className="onb-p">你已經在這個群組裡了。</p>
          </div>
        </div>
        <div className="onb-foot">
          <button
            className="btn btn--primary btn--block btn--lg"
            disabled={busy}
            onClick={() => doJoin({})}
          >
            進入群組
          </button>
        </div>
      </div>
    );
  }

  // Request submitted (or already pending) — waiting for admin approval.
  if (submitted || preview.pending) {
    return (
      <div className="onb">
        <div className="onb-body">
          <div className="onb-step" style={{ textAlign: "center", paddingTop: 40 }}>
            <div className="onb-mark">
              <AppIcon name="clock" size={32} color="#fff" />
            </div>
            <h2 className="onb-h2">申請已送出</h2>
            <p className="onb-p">
              「{preview.groupName}」的管理員核准後，你就會自動進入群組。
            </p>
          </div>
        </div>
        <div className="onb-foot">
          <button className="btn btn--primary btn--block btn--lg" onClick={onCancel}>
            知道了
          </button>
        </div>
      </div>
    );
  }

  const open = preview.members.filter((m) => !m.claimed);

  return (
    <div className="onb">
      <div className="onb-body">
        <div className="onb-step">
          <div className="onb-step-num">加入群組</div>
          <h2 className="onb-h2">{preview.groupName}</h2>
          <p className="onb-p">你是哪一位？選一個既有成員，或以新成員加入。</p>

          {open.length > 0 && (
            <div className="onb-chips" style={{ marginTop: 8 }}>
              {open.map((m) => (
                <button
                  key={m.clientId}
                  className="onb-pill"
                  style={{ flex: "0 0 auto" }}
                  disabled={busy}
                  onClick={() => doJoin({ claimMemberId: m.clientId })}
                >
                  <AppIcon name="users" size={16} />
                  <div>
                    <b>我是 {m.name}</b>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div style={{ height: 24 }} />
          <h3 className="onb-sub-h">或以新成員加入</h3>
          <input
            className="input onb-input"
            placeholder="你的名字"
            maxLength={20}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
      </div>

      <div className="onb-foot">
        <button className="btn btn--secondary" disabled={busy} onClick={onCancel}>
          返回
        </button>
        <button
          className="btn btn--primary"
          disabled={busy || !newName.trim()}
          onClick={() => doJoin({ newName: newName.trim() })}
        >
          以「{newName.trim() || "新成員"}」加入
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import AppIcon from "./Icons";

interface CreateGroupProps {
  onCancel?: (() => void) | null;
  onCreate: (opts: { name: string; usePool: boolean; memberNames: string[] }) => void;
}

export default function CreateGroup({ onCancel, onCreate }: CreateGroupProps) {
  const [name, setName] = useState("");
  const [usePool, setUsePool] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [memberDraft, setMemberDraft] = useState("");

  const addMember = () => {
    const n = memberDraft.trim();
    if (!n || members.includes(n)) { setMemberDraft(""); return; }
    setMembers([...members, n]);
    setMemberDraft("");
  };

  const submit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), usePool, memberNames: members });
  };

  return (
    <div className="onb">
      <div className="onb-body">
        <div className="onb-step">
          <div className="onb-step-num">建立你的群組</div>
          <h2 className="onb-h2">命名這個群組</h2>
          <p className="onb-p">
            例如「室友三人組」、「日本旅遊」、「公司咖啡」。
          </p>
          <input
            className="input onb-input"
            placeholder="群組名稱"
            autoFocus
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div style={{ height: 24 }} />
          <h3 className="onb-sub-h">使用共同基金？</h3>
          <p className="onb-p" style={{ marginTop: -2, marginBottom: 12 }}>
            有共用錢包（例如某人先付一筆給大家用），就開啟。
            <br />
            如果只是純粹分帳，可以關閉。
          </p>
          <div className="onb-toggle-row">
            <button
              className={`onb-pill ${!usePool ? "on" : ""}`}
              onClick={() => setUsePool(false)}
            >
              <AppIcon name="scale" size={18} />
              <div>
                <b>純分帳</b>
                <small>誰付誰記，月底結算</small>
              </div>
            </button>
            <button
              className={`onb-pill ${usePool ? "on" : ""}`}
              onClick={() => setUsePool(true)}
            >
              <AppIcon name="wallet" size={18} />
              <div>
                <b>共同基金</b>
                <small>有共用錢包，從中扣款</small>
              </div>
            </button>
          </div>

          <div style={{ height: 24 }} />
          <h3 className="onb-sub-h">先加幾個成員（可跳過）</h3>
          <p className="onb-p" style={{ marginTop: -2, marginBottom: 12 }}>
            可以之後再加。
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="輸入名字後按 +"
              maxLength={20}
              value={memberDraft}
              onChange={(e) => setMemberDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addMember(); }}
            />
            <button
              className="btn btn--secondary"
              onClick={addMember}
              disabled={!memberDraft.trim()}
            >
              +
            </button>
          </div>
          {members.length > 0 && (
            <div className="onb-chips">
              {members.map((n) => (
                <span key={n} className="onb-chip">
                  {n}
                  <button
                    onClick={() =>
                      setMembers(members.filter((x) => x !== n))
                    }
                    aria-label="remove"
                  >
                    <AppIcon name="x" size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="onb-foot">
        {onCancel && (
          <button className="btn btn--secondary" onClick={onCancel}>
            返回
          </button>
        )}
        <button
          className="btn btn--primary"
          disabled={!name.trim()}
          onClick={submit}
        >
          建立群組
        </button>
      </div>
    </div>
  );
}

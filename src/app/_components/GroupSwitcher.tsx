"use client";

import { useState } from "react";
import { Group } from "./data";
import AppIcon from "./Icons";

interface GroupSwitcherProps {
  groups: Group[];
  activeId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export default function GroupSwitcher({
  groups,
  activeId,
  onClose,
  onSelect,
  onCreate,
  onDelete,
  onRename,
}: GroupSwitcherProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (g: Group) => {
    setDraft(g.name);
    setEditingId(g.id);
  };
  const save = (id: string) => {
    const v = draft.trim();
    if (v) onRename(id, v);
    setEditingId(null);
  };

  return (
    <div className="gs-sheet" onClick={onClose}>
      <div className="gs-card" onClick={(e) => e.stopPropagation()}>
        <div className="gs-handle" />
        <div className="gs-title">切換群組</div>

        <div className="grp-list">
          {groups.map((g) => {
            const isActive = g.id === activeId;

            if (editingId === g.id) {
              return (
                <div key={g.id} className="grp-row grp-row--on">
                  <div className="grp-ico">
                    <AppIcon name={g.usePool ? "wallet" : "scale"} size={20} />
                  </div>
                  <input
                    className="input"
                    style={{ flex: 1, height: 40, margin: "0 8px" }}
                    autoFocus
                    maxLength={30}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") save(g.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <button
                    className="grp-del"
                    onClick={() => setEditingId(null)}
                    aria-label="cancel"
                  >
                    <AppIcon name="x" size={16} color="var(--yr-fg-subtle)" />
                  </button>
                  <button className="grp-del" onClick={() => save(g.id)} aria-label="save">
                    <AppIcon name="check" size={18} color="var(--yr-brand-500)" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={g.id}
                className={`grp-row ${isActive ? "grp-row--on" : ""}`}
              >
                <button className="grp-row-main" onClick={() => onSelect(g.id)}>
                  <div className="grp-ico">
                    <AppIcon name={g.usePool ? "wallet" : "scale"} size={20} />
                  </div>
                  <div className="grp-meta">
                    <div className="grp-name">
                      {g.name}
                      {g.isDemo && (
                        <span className="badge badge--brand" style={{ marginLeft: 6 }}>
                          示範
                        </span>
                      )}
                    </div>
                    <div className="grp-sub">
                      {g.team.length} 人 ·{" "}
                      {g.usePool ? "共同基金" : "純分帳"} ·{" "}
                      {g.expenses.length} 筆紀錄
                    </div>
                  </div>
                  {isActive && (
                    <AppIcon name="check" size={18} color="var(--yr-brand-500)" />
                  )}
                </button>
                {g.isAdmin && !g.isDemo && (
                  <button
                    className="grp-del"
                    onClick={() => startEdit(g)}
                    aria-label="rename"
                  >
                    <AppIcon name="edit" size={16} color="var(--yr-fg-subtle)" />
                  </button>
                )}
                {!isActive && groups.length > 1 && (
                  <button
                    className="grp-del"
                    onClick={() => onDelete(g.id)}
                    aria-label="delete"
                  >
                    <AppIcon name="trash" size={16} color="var(--yr-fg-subtle)" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          className="btn btn--primary btn--block"
          style={{ marginTop: 12 }}
          onClick={onCreate}
        >
          <AppIcon name="plus" size={18} /> 建立新群組
        </button>
      </div>
    </div>
  );
}

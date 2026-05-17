"use client";

import { Group } from "./data";
import AppIcon from "./Icons";

interface GroupSwitcherProps {
  groups: Group[];
  activeId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export default function GroupSwitcher({
  groups,
  activeId,
  onClose,
  onSelect,
  onCreate,
  onDelete,
}: GroupSwitcherProps) {
  return (
    <div className="gs-sheet" onClick={onClose}>
      <div className="gs-card" onClick={(e) => e.stopPropagation()}>
        <div className="gs-handle" />
        <div className="gs-title">切換群組</div>

        <div className="grp-list">
          {groups.map((g) => {
            const isActive = g.id === activeId;
            return (
              <div
                key={g.id}
                className={`grp-row ${isActive ? "grp-row--on" : ""}`}
              >
                <button
                  className="grp-row-main"
                  onClick={() => onSelect(g.id)}
                >
                  <div className="grp-ico">
                    <AppIcon
                      name={g.usePool ? "wallet" : "scale"}
                      size={20}
                    />
                  </div>
                  <div className="grp-meta">
                    <div className="grp-name">
                      {g.name}
                      {g.isDemo && (
                        <span
                          className="badge badge--brand"
                          style={{ marginLeft: 6 }}
                        >
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
                    <AppIcon
                      name="check"
                      size={18}
                      color="var(--yr-brand-500)"
                    />
                  )}
                </button>
                {!isActive && groups.length > 1 && (
                  <button
                    className="grp-del"
                    onClick={() => onDelete(g.id)}
                    aria-label="delete"
                  >
                    <AppIcon
                      name="trash"
                      size={16}
                      color="var(--yr-fg-subtle)"
                    />
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

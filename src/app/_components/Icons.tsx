"use client";

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function AppIcon({
  name,
  size = 22,
  color = "currentColor",
  strokeWidth = 1.75,
}: IconProps) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "coffee":
      return (
        <svg {...p}>
          <path d="M17 8h1a3 3 0 0 1 0 6h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
          <path d="M6 2v3M10 2v3M14 2v3" />
        </svg>
      );
    case "tea":
      return (
        <svg {...p}>
          <path d="M5 6h12l-1 12a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3L5 6z" />
          <path d="M5 6 4 3M17 6l1-3" />
          <path d="M9 10h4" />
        </svg>
      );
    case "food":
    case "dinner":
      return (
        <svg {...p}>
          <path d="M3 11L5 3" />
          <path d="M21 3c0 6-3 9-6 9s-6-3-6-9" />
          <path d="M12 12v9" />
          <path d="M8 21h8" />
        </svg>
      );
    case "snack":
      return (
        <svg {...p}>
          <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" />
          <circle cx="12" cy="9" r="3" />
        </svg>
      );
    case "supply":
      return (
        <svg {...p}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "fruit":
      return (
        <svg {...p}>
          <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2H2v2z" />
          <path d="M12 2a5 5 0 0 0-5 5c0 2 1 3 3 4h4c2-1 3-2 3-4a5 5 0 0 0-5-5z" />
          <path d="M12 2v6" />
          <path d="M2 18h20v-5a6 6 0 0 0-6-6H8a6 6 0 0 0-6 6v5z" />
        </svg>
      );
    case "home":
      return (
        <svg {...p}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "clock":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "scale":
      return (
        <svg {...p}>
          <path d="M2 20h20" />
          <path d="M12 2v18" />
          <path d="M5 8L2 20" />
          <path d="M19 8l3 12" />
          <path d="M2 9c0 0 3.5-2 10-2s10 2 10 2" />
        </svg>
      );
    case "users":
      return (
        <svg {...p}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "plus":
      return (
        <svg {...p}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...p}>
          <rect x="1" y="4" width="22" height="16" rx="3" ry="3" />
          <line x1="1" y1="10" x2="23" y2="10" />
          <path d="M17 14h.01" />
        </svg>
      );
    case "x":
      return (
        <svg {...p}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case "check":
      return (
        <svg {...p}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "back":
      return (
        <svg {...p}>
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...p}>
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    case "arrow-up":
      return (
        <svg {...p}>
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      );
    case "arrow-down":
      return (
        <svg {...p}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      );
    case "trash":
      return (
        <svg {...p}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      );
    case "search":
      return (
        <svg {...p}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "edit":
      return (
        <svg {...p}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      );
    case "more":
      return (
        <svg {...p}>
          <circle cx="5" cy="12" r="1" fill={color} />
          <circle cx="12" cy="12" r="1" fill={color} />
          <circle cx="19" cy="12" r="1" fill={color} />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

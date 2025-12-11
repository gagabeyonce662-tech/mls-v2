// components/map/SearchPortal.tsx
import React from "react";
import ReactDOM from "react-dom";

export type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

interface ResultsPortalProps {
  anchorRect: DOMRect | null;
  results: NominatimResult[];
  onSelect: (r: NominatimResult) => void;
}

export const ResultsPortal: React.FC<ResultsPortalProps> = ({
  anchorRect,
  results,
  onSelect,
}) => {
  if (typeof window === "undefined" || !anchorRect) return null;

  const style: React.CSSProperties = {
    position: "absolute",
    left: Math.max(8, anchorRect.left) + "px",
    top: anchorRect.bottom + window.scrollY + 6 + "px",
    width: Math.min(anchorRect.width, window.innerWidth - 16) + "px",
    maxHeight: "320px",
    overflow: "auto",
    background: "white",
    borderRadius: 8,
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    zIndex: 999999,
    border: "1px solid rgba(0,0,0,0.06)",
  };

  return ReactDOM.createPortal(
    <div style={style} role="listbox">
      {results.map((r) => (
        <button
          key={r.place_id}
          onClick={() => onSelect(r)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "10px 12px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <div style={{ fontSize: 14, color: "#111" }}>{r.display_name}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            {`${r.lat.slice(0, 9)}, ${r.lon.slice(0, 9)}`}
          </div>
        </button>
      ))}
    </div>,
    document.body
  );
};
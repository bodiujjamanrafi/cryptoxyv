import { useState, useEffect, useMemo } from "react";

/* Crisp, premium SVG Donut Chart with sharp vector rendering,
   clean non-blurry strokes, accurate directional pointer,
   and clear center metrics matching the design reference. */
export default function Donut({
  segments = [],
  size = 190,
  stroke = 15,
  activeLabel,
  onHover,
  onSelect,
}) {
  const [internalHover, setInternalHover] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(timer);
  }, []);

  const currentHover = activeLabel !== undefined ? activeLabel : internalHover;

  const r = (size - stroke - 12) / 2;
  const cx = size / 2;
  const c = 2 * Math.PI * r;

  // Calculate angles and offsets for each coin segment
  const { segmentData, activeItem, activeMidAngle } = useMemo(() => {
    if (!segments || segments.length === 0) {
      return { segmentData: [], activeItem: null, activeMidAngle: 0 };
    }

    let cumulativeOffset = 0;
    let cumulativePct = 0;

    const data = segments.map((s, idx) => {
      const val = Math.max(0, s.value);
      const segLength = (val / 100) * c;
      const startAngle = (cumulativePct / 100) * 360; // 0 is 12 o'clock (top)
      const spanAngle = (val / 100) * 360;
      const midAngle = startAngle + spanAngle / 2;
      const offset = cumulativeOffset;

      cumulativeOffset += segLength;
      cumulativePct += val;

      return {
        ...s,
        val,
        segLength,
        offset,
        startAngle,
        spanAngle,
        midAngle,
        index: idx,
      };
    });

    const active = data.find((s) => s.label === currentHover) || data[0];
    return {
      segmentData: data,
      activeItem: active,
      activeMidAngle: active ? active.midAngle : 0,
    };
  }, [segments, currentHover, c]);

  if (!segments || segments.length === 0) return null;

  const activeColor = activeItem?.color || "#22d3ee";

  return (
    <div className="donut-compact-container" style={{ width: size, height: size }}>
      <svg
        className="donut-compact-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Crisp background track */}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={stroke}
        />

        {/* Clean, sharp coin segments starting at 12 o'clock */}
        <g transform={`rotate(-90 ${cx} ${cx})`}>
          {segmentData.map((s) => {
            const isSelected = activeItem?.label === s.label;
            const isDimmed = Boolean(currentHover && !isSelected);
            const drawLength = mounted ? s.segLength : 0;

            return (
              <circle
                key={s.label}
                className="donut-coin-segment"
                cx={cx}
                cy={cx}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={isSelected ? stroke + 3 : stroke}
                strokeDasharray={`${drawLength} ${c - drawLength}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="round"
                style={{
                  opacity: isDimmed ? 0.35 : 1,
                  cursor: "pointer",
                  transition:
                    "stroke-dasharray 0.65s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.22s ease, opacity 0.22s ease",
                }}
                onMouseEnter={() => {
                  setInternalHover(s.label);
                  onHover?.(s.label);
                }}
                onMouseLeave={() => {
                  setInternalHover(null);
                  onHover?.(null);
                }}
                onClick={() => onSelect?.(s.label)}
              />
            );
          })}
        </g>

        {/* Directional arrow pointing accurately to the selected coin's slice */}
        <g
          className="donut-direction-pointer"
          style={{
            transform: `rotate(${activeMidAngle}deg)`,
            transformOrigin: `${cx}px ${cx}px`,
            transition: "transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Arrow pointing cleanly outwards into the selected segment */}
          <polygon
            points={`${cx},${cx - r + stroke / 2 + 1} ${cx - 4},${cx - r + stroke + 7} ${cx + 4},${cx - r + stroke + 7}`}
            fill={activeColor}
            style={{
              transition: "fill 0.3s ease",
            }}
          />
        </g>
      </svg>

      {/* Center readout matching the reference image */}
      <div className="donut-clean-center">
        <span
          className="donut-clean-badge"
          style={{
            color: activeColor,
            borderColor: `${activeColor}55`,
            backgroundColor: `${activeColor}18`,
          }}
        >
          {activeItem?.label}
        </span>
        <span className="donut-clean-val mono">
          {activeItem ? `${activeItem.value.toFixed(1)}%` : "0.0%"}
        </span>
        <span className="donut-clean-sub">
          {activeItem?.name || "Dominance"}
        </span>
        <span className="donut-clean-cap mono">
          {activeItem?.usdVal || "—"}
        </span>
      </div>
    </div>
  );
}

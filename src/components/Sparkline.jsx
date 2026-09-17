import { useId, memo, useState, useMemo } from "react";

/* Generate silky smooth Catmull-Rom cubic bezier spline */
function createSpline(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? i : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/* High-performance Sparkline with cubic spline curve,
   luminous gradient fill, and lightweight vector styling. */
const Sparkline = memo(function Sparkline({
  data,
  width = 138,
  height = 42,
  up,
  interactive = false,
}) {
  const id = useId();
  const [hoverIndex, setHoverIndex] = useState(null);

  const rising = up ?? (data && data.length > 1 ? data[data.length - 1] >= data[0] : true);
  const strokeColor = rising ? "#00e599" : "#ff4d6a";

  const chartData = useMemo(() => {
    if (!data || data.length < 2) return null;

    let min = data[0];
    let max = data[0];
    for (let i = 1; i < data.length; i++) {
      if (data[i] < min) min = data[i];
      if (data[i] > max) max = data[i];
    }
    const range = max - min || 1;
    const paddingY = 4;
    const usableHeight = height - paddingY * 2;
    const stepX = (width - 6) / (data.length - 1);

    const calculatedPts = data.map((v, i) => [
      3 + i * stepX,
      paddingY + usableHeight - ((v - min) / range) * usableHeight,
    ]);

    const splineLine = createSpline(calculatedPts);
    const last = calculatedPts[calculatedPts.length - 1];
    const splineArea = `${splineLine} L ${last[0].toFixed(1)},${height} L 3,${height} Z`;

    return {
      pts: calculatedPts,
      line: splineLine,
      area: splineArea,
      lastPt: last,
    };
  }, [data, width, height]);

  if (!chartData) return <div style={{ width, height }} />;

  const { pts, line, area, lastPt } = chartData;

  const handleMouseMove = (e) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(width, e.clientX - rect.left));
    const idx = Math.round((x / width) * (data.length - 1));
    setHoverIndex(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const handleMouseLeave = () => {
    if (interactive) setHoverIndex(null);
  };

  const activePt = hoverIndex !== null && pts[hoverIndex] ? pts[hoverIndex] : null;

  return (
    <div
      className="sparkline-container"
      style={{ width, height, position: "relative", display: "inline-block" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ overflow: "visible", display: "block" }}
      >
        <defs>
          <linearGradient id={`spark-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
            <stop offset="70%" stopColor={strokeColor} stopOpacity="0.05" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Translucent Area Under Curve */}
        <path d={area} fill={`url(#spark-grad-${id})`} />

        {/* Crisp Cubic Bezier Curve (zero costly SVG drop-shadow filter) */}
        <path
          d={line}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="sparkline-path"
        />

        {/* Live Ticker Marker at latest point */}
        <circle cx={lastPt[0]} cy={lastPt[1]} r="2.2" fill={strokeColor} />
        <circle
          cx={lastPt[0]}
          cy={lastPt[1]}
          r="4.5"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1"
          opacity="0.6"
          className="sparkline-beacon"
        />

        {/* Interactive hover tracking */}
        {activePt && (
          <g>
            <line
              x1={activePt[0]}
              y1="0"
              x2={activePt[0]}
              y2={height}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
            <circle cx={activePt[0]} cy={activePt[1]} r="3.5" fill="#ffffff" stroke={strokeColor} strokeWidth="1.5" />
          </g>
        )}
      </svg>
    </div>
  );
});

export default Sparkline;

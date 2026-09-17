import { useMemo, useRef, useState, useEffect } from "react";
import { fmtPrice } from "../api/coingecko";

/* Interactive area chart for the coin detail page.
   Props: points = [[ms, price], …]. Renders a gradient area,
   a crosshair + floating readout that tracks the pointer. */
export default function PriceChart({ points, height = 360 }) {
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [w, setW] = useState(900);

  const W = w;
  const H = height;
  const PAD = { t: 18, r: 8, b: 26, l: 8 };

  const model = useMemo(() => {
    if (!points || points.length < 2) return null;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeY = maxY - minY || 1;
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;
    const sx = (x) => PAD.l + ((x - minX) / (maxX - minX || 1)) * innerW;
    const sy = (y) => PAD.t + innerH - ((y - minY) / rangeY) * innerH;
    const coords = points.map((p) => [sx(p[0]), sy(p[1])]);
    const line = coords.map((c, i) => (i === 0 ? `M${c[0]},${c[1]}` : `L${c[0]},${c[1]}`)).join(" ");
    const area = `${line} L${coords[coords.length - 1][0]},${H - PAD.b} L${coords[0][0]},${H - PAD.b} Z`;
    const up = ys[ys.length - 1] >= ys[0];
    // horizontal gridlines
    const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      y: PAD.t + innerH * f,
      v: maxY - rangeY * f,
    }));
    return { coords, line, area, up, minX, maxX, sx, innerW };
  }, [points, W, H]);

  if (!model) return <div className="chart-empty">No chart data</div>;

  const color = model.up ? "var(--up)" : "var(--down)";

  function onMove(e) {
    const rect = wrapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let lo = 0, hi = model.coords.length - 1;
    // nearest index by x
    let best = 0, bd = Infinity;
    for (let i = 0; i < model.coords.length; i++) {
      const d = Math.abs(model.coords[i][0] - x);
      if (d < bd) { bd = d; best = i; }
    }
    setHover({ i: best, cx: model.coords[best][0], cy: model.coords[best][1] });
  }

  const hp = hover ? points[hover.i] : null;

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cw = Math.floor(entry.contentRect.width);
        if (cw > 0) setW((prev) => (Math.abs(prev - cw) > 3 ? cw : prev));
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="chart" ref={wrapRef} style={{ height: H }}>
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        onTouchMove={(e) => onMove(e.touches[0])}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={PAD.t + (H - PAD.t - PAD.b) * f} y2={PAD.t + (H - PAD.t - PAD.b) * f}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        <path d={model.area} fill="url(#chart-fill)" />
        <path d={model.line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover && (
          <g>
            <line x1={hover.cx} x2={hover.cx} y1={PAD.t} y2={H - PAD.b} stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={hover.cx} cy={hover.cy} r="5" fill={color} stroke="#070810" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hp && (
        <div
          className="chart-tip glass mono"
          style={{
            left: Math.min(Math.max(hover.cx, 70), W - 70),
            transform: "translateX(-50%)",
          }}
        >
          <strong>{fmtPrice(hp[1])}</strong>
          <span>{new Date(hp[0]).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      )}
    </div>
  );
}

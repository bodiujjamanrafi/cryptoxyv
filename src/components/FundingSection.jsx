import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./FundingSection.css";
import {
  RECENT_FUNDING_ROUNDS,
  FUNDRAISING_TREND_STATS,
  MONTHLY_TREND_SERIES,
} from "../api/fundingData";

// Helper to compute smooth cubic Bézier SVG path from points
function getSmoothPath(points) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to Cubic Bézier conversion
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  return d;
}

// Token/Project SVG Icons matching reference image
function ProjectLogo({ type, color }) {
  if (type === "monad") {
    return (
      <div className="fund-logo-wrap" style={{ background: color || "#8352ec" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="7.5" stroke="#ffffff" strokeWidth="2.8" strokeDasharray="32 8" />
          <circle cx="12" cy="12" r="3" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  if (type === "berachain") {
    return (
      <div className="fund-logo-wrap" style={{ background: "#854d0e" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
          <circle cx="8" cy="8" r="3" />
          <circle cx="16" cy="8" r="3" />
          <ellipse cx="12" cy="14" rx="6.5" ry="5.5" />
          <circle cx="10" cy="13" r="1.1" fill="#854d0e" />
          <circle cx="14" cy="13" r="1.1" fill="#854d0e" />
          <ellipse cx="12" cy="16" rx="2" ry="1.2" fill="#854d0e" />
        </svg>
      </div>
    );
  }

  if (type === "movement") {
    return (
      <div className="fund-logo-wrap" style={{ background: "#eab308" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#111827">
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 3.5l5.5 3-5.5 3-5.5-3 5.5-3zm-6 5.5l5 2.8v5.5l-5-2.8v-5.5zm12 5.5l-5 2.8v-5.5l5-2.8v5.5z" />
        </svg>
      </div>
    );
  }

  if (type === "hyperliquid") {
    return (
      <div className="fund-logo-wrap" style={{ background: "#064e3b" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 8a5 5 0 0 1 10 0v8a5 5 0 0 1-10 0V8z" />
          <line x1="12" y1="11" x2="12" y2="13" />
        </svg>
      </div>
    );
  }

  // Celestia
  return (
    <div className="fund-logo-wrap" style={{ background: "#6b21a8" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2">
        <polygon points="12 2 2 8.5 2 15.5 12 22 22 15.5 22 8.5 12 2" />
        <circle cx="12" cy="12" r="3.2" fill="#ffffff" />
      </svg>
    </div>
  );
}

// Stage text color matching reference image
function getStageClass(stage) {
  if (stage.includes("Series B")) return "stage-green";
  if (stage.includes("Series A")) return "stage-blue";
  return "stage-muted";
}

export default function FundingSection() {
  const navigate = useNavigate();
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState(null);

  // SVG Chart Geometry Constants
  const chartWidth = 500;
  const chartHeight = 175;
  const paddingLeft = 38;
  const paddingRight = 36;
  const paddingTop = 32;
  const paddingBottom = 24;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const baselineY = chartHeight - paddingBottom;

  // Compute coordinate points for Raised curve ($0B to $4B)
  const raisedPoints = useMemo(() => {
    return MONTHLY_TREND_SERIES.map((d, i) => {
      const x = paddingLeft + (i / (MONTHLY_TREND_SERIES.length - 1)) * plotWidth;
      const y = baselineY - (d.raised / 4.0) * plotHeight;
      return { x, y, data: d };
    });
  }, [plotWidth, plotHeight, baselineY]);

  // Compute coordinate points for Rounds curve (0 to 140 rounds)
  const roundsPoints = useMemo(() => {
    return MONTHLY_TREND_SERIES.map((d, i) => {
      const x = paddingLeft + (i / (MONTHLY_TREND_SERIES.length - 1)) * plotWidth;
      const y = baselineY - (d.rounds / 140) * plotHeight;
      return { x, y, data: d };
    });
  }, [plotWidth, plotHeight, baselineY]);

  const raisedLinePath = useMemo(() => getSmoothPath(raisedPoints), [raisedPoints]);
  const roundsLinePath = useMemo(() => getSmoothPath(roundsPoints), [roundsPoints]);

  // Area fill under Raised curve
  const raisedAreaPath = useMemo(() => {
    if (raisedPoints.length === 0) return "";
    const firstX = raisedPoints[0].x;
    const lastX = raisedPoints[raisedPoints.length - 1].x;
    return `${raisedLinePath} L ${lastX},${baselineY} L ${firstX},${baselineY} Z`;
  }, [raisedLinePath, raisedPoints, baselineY]);

  // Apr index is 3 (Peak rounds: 131)
  const aprRoundPoint = roundsPoints[3];
  // Sep index is 8 (Peak month: $3.85B)
  const sepRaisedPoint = raisedPoints[8];

  const activePointRaised = hoveredMonthIndex !== null ? raisedPoints[hoveredMonthIndex] : null;
  const activePointRounds = hoveredMonthIndex !== null ? roundsPoints[hoveredMonthIndex] : null;

  return (
    <section className="section funding-trend-section" id="funding-rounds">
      <div className="container">
        <div className="funding-grid-layout">
          {/* ========================================================================= */}
          {/* LEFT: Recent Funding Rounds                                               */}
          {/* ========================================================================= */}
          <div className="funding-col-left">
            <div className="funding-header-row">
              <h2 className="funding-col-title">Recent funding rounds</h2>
              <button
                className="funding-link-action"
                onClick={() => navigate("/funding")}
                title="View all funding deals and VC funds"
              >
                <span>View all</span>
                <span className="arrow-diag">↗</span>
              </button>
            </div>

            <div className="funding-rounds-list">
              {RECENT_FUNDING_ROUNDS.map((item) => (
                <div
                  key={item.id}
                  className="funding-round-card"
                  onClick={() => navigate(`/funding?tab=rounds&round=${item.id}`)}
                  title={`Click to view ${item.name} funding details`}
                >
                  {/* Left: Logo & Project Names */}
                  <div className="funding-card-left">
                    <ProjectLogo type={item.iconType} color={item.logoColor} />
                    <div className="funding-card-title-stack">
                      <div className="funding-name-row">
                        <span className="funding-project-name">{item.name}</span>
                        {item.isNew && (
                          <span className="funding-badge-new mono">New</span>
                        )}
                      </div>
                      <span className={`funding-round-stage ${getStageClass(item.round)}`}>
                        {item.round}
                      </span>
                    </div>
                  </div>

                  {/* Right: Amount, Date & Investor Avatars */}
                  <div className="funding-card-right">
                    <div className="funding-amount-date-stack">
                      <span className="funding-amount-val mono">{item.amount}</span>
                      <span className="funding-date-val mono">{item.date}</span>
                    </div>

                    <div className="funding-investors-overlap">
                      {item.investors.map((inv, idx) => (
                        <div
                          key={idx}
                          className="funding-investor-circle"
                          style={{
                            backgroundColor: inv.bg,
                            color: inv.darkText ? "#000000" : "#ffffff",
                            zIndex: 10 - idx,
                          }}
                          title={`Lead Investor: ${inv.name}`}
                        >
                          {inv.text}
                        </div>
                      ))}
                      {item.additionalInvestorsCount > 0 && (
                        <div
                          className="funding-investor-circle plus-pill mono"
                          style={{ zIndex: 1 }}
                          title={`${item.additionalInvestorsCount} more institutional investors`}
                        >
                          +{item.additionalInvestorsCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT: Crypto Fundraising Trend                                           */}
          {/* ========================================================================= */}
          <div className="funding-col-right">
            <div className="funding-header-row">
              <h2 className="funding-col-title">Crypto fundraising trend</h2>
              <button
                className="funding-link-action"
                onClick={() => navigate("/funding?tab=analytics")}
                title="See comprehensive macro trend metrics"
              >
                <span>See all</span>
                <span className="arrow-diag">↗</span>
              </button>
            </div>

            {/* Main Dark Trend Container */}
            <div className="fundraising-trend-box">
              {/* 2x2 Metric Stat Cards */}
              <div className="trend-stats-2x2">
                {/* 1. Peak Month */}
                <div className="trend-stat-card">
                  <div className="trend-stat-label-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    <span className="trend-stat-label stat-peak-month">Peak month</span>
                  </div>
                  <div className="trend-stat-val mono">{FUNDRAISING_TREND_STATS.peakMonth.month}</div>
                  <div className="trend-stat-sub mono">{FUNDRAISING_TREND_STATS.peakMonth.amount}</div>
                </div>

                {/* 2. Lowest Month */}
                <div className="trend-stat-card">
                  <div className="trend-stat-label-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                      <polyline points="17 18 23 18 23 12" />
                    </svg>
                    <span className="trend-stat-label stat-lowest-month">Lowest month</span>
                  </div>
                  <div className="trend-stat-val mono">{FUNDRAISING_TREND_STATS.lowestMonth.month}</div>
                  <div className="trend-stat-sub mono">{FUNDRAISING_TREND_STATS.lowestMonth.amount}</div>
                </div>

                {/* 3. Peak Rounds */}
                <div className="trend-stat-card">
                  <div className="trend-stat-label-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span className="trend-stat-label stat-peak-rounds">Peak rounds</span>
                  </div>
                  <div className="trend-stat-val mono">{FUNDRAISING_TREND_STATS.peakRounds.rounds}</div>
                  <div className="trend-stat-sub mono">{FUNDRAISING_TREND_STATS.peakRounds.period}</div>
                </div>

                {/* 4. Total Tracked */}
                <div className="trend-stat-card">
                  <div className="trend-stat-label-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H2v-10z" />
                      <path d="M10 6h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2V6z" />
                      <path d="M18 2h2a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-2V2z" />
                    </svg>
                    <span className="trend-stat-label stat-total-tracked">Total tracked</span>
                  </div>
                  <div className="trend-stat-val mono">{FUNDRAISING_TREND_STATS.totalTracked.amount}</div>
                  <div className="trend-stat-sub mono">{FUNDRAISING_TREND_STATS.totalTracked.roundsCount}</div>
                </div>
              </div>

              {/* Dual-Axis SVG Curve Chart */}
              <div className="trend-chart-container">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="trend-dual-svg"
                  onMouseLeave={() => setHoveredMonthIndex(null)}
                >
                  <defs>
                    {/* Linear Gradient for Raised Area Fill */}
                    <linearGradient id="raisedAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00e599" stopOpacity="0.28" />
                      <stop offset="70%" stopColor="#00e599" stopOpacity="0.04" />
                      <stop offset="100%" stopColor="#00e599" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Glow filter for active line highlights */}
                    <filter id="neonGlowRaised" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#00e599" floodOpacity="0.65" />
                    </filter>
                    <filter id="neonGlowRounds" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#a855f7" floodOpacity="0.6" />
                    </filter>
                  </defs>

                  {/* Horizontal Gridlines & Y-Axis Labels */}
                  {/* $4B / Top level */}
                  <line x1={paddingLeft} y1={paddingTop} x2={chartWidth - paddingRight} y2={paddingTop} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                  <text x={paddingLeft - 8} y={paddingTop + 4} textAnchor="end" className="chart-axis-label mono">$4B</text>
                  <text x={chartWidth - paddingRight + 8} y={paddingTop + 4} textAnchor="start" className="chart-axis-label mono">140</text>

                  {/* $3B level */}
                  <line x1={paddingLeft} y1={paddingTop + plotHeight * 0.25} x2={chartWidth - paddingRight} y2={paddingTop + plotHeight * 0.25} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                  <text x={paddingLeft - 8} y={paddingTop + plotHeight * 0.25 + 4} textAnchor="end" className="chart-axis-label mono">$3B</text>

                  {/* $2B / 70 level */}
                  <line x1={paddingLeft} y1={paddingTop + plotHeight * 0.5} x2={chartWidth - paddingRight} y2={paddingTop + plotHeight * 0.5} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                  <text x={paddingLeft - 8} y={paddingTop + plotHeight * 0.5 + 4} textAnchor="end" className="chart-axis-label mono">$2B</text>
                  <text x={chartWidth - paddingRight + 8} y={paddingTop + plotHeight * 0.5 + 4} textAnchor="start" className="chart-axis-label mono">70</text>

                  {/* $1B level */}
                  <line x1={paddingLeft} y1={paddingTop + plotHeight * 0.75} x2={chartWidth - paddingRight} y2={paddingTop + plotHeight * 0.75} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                  <text x={paddingLeft - 8} y={paddingTop + plotHeight * 0.75 + 4} textAnchor="end" className="chart-axis-label mono">$1B</text>

                  {/* Area Fill beneath Raised Curve */}
                  <path d={raisedAreaPath} fill="url(#raisedAreaGradient)" />

                  {/* Purple Curve: Rounds */}
                  <path
                    d={roundsLinePath}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#neonGlowRounds)"
                  />

                  {/* Green Curve: Raised (USD) */}
                  <path
                    d={raisedLinePath}
                    fill="none"
                    stroke="#00e599"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#neonGlowRaised)"
                  />

                  {/* Static Peak Badges matching Reference Image */}
                  {/* 1. Apr Peak Rounds Badge: "131" */}
                  {aprRoundPoint && (
                    <g>
                      <circle cx={aprRoundPoint.x} cy={aprRoundPoint.y} r="4" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
                      {/* Pill Badge */}
                      <rect
                        x={aprRoundPoint.x - 14}
                        y={aprRoundPoint.y - 19}
                        width="28"
                        height="14"
                        rx="4"
                        fill="#581c87"
                        stroke="#a855f7"
                        strokeWidth="1"
                      />
                      <text
                        x={aprRoundPoint.x}
                        y={aprRoundPoint.y - 9}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="700"
                        className="mono"
                      >
                        131
                      </text>
                    </g>
                  )}

                  {/* 2. Sep Peak Month Tooltip: "● Sep '25 · $3.85B" */}
                  {sepRaisedPoint && (
                    <g>
                      <circle cx={sepRaisedPoint.x} cy={sepRaisedPoint.y} r="4.5" fill="#00e599" stroke="#ffffff" strokeWidth="1.8" />
                      {/* Tooltip Pill */}
                      <rect
                        x={sepRaisedPoint.x - 72}
                        y={sepRaisedPoint.y - 18}
                        width="76"
                        height="18"
                        rx="5"
                        fill="#0c131a"
                        stroke="rgba(0, 229, 153, 0.4)"
                        strokeWidth="1"
                      />
                      <circle cx={sepRaisedPoint.x - 64} cy={sepRaisedPoint.y - 9} r="2.5" fill="#00e599" />
                      <text
                        x={sepRaisedPoint.x - 57}
                        y={sepRaisedPoint.y - 5.5}
                        fill="#ffffff"
                        fontSize="8.5"
                        fontWeight="700"
                        className="mono"
                      >
                        Sep '25 · $3.85B
                      </text>
                    </g>
                  )}

                  {/* Interactive Hover Columns & Active Indicator */}
                  {MONTHLY_TREND_SERIES.map((item, idx) => {
                    const x = paddingLeft + (idx / (MONTHLY_TREND_SERIES.length - 1)) * plotWidth;
                    const colWidth = plotWidth / (MONTHLY_TREND_SERIES.length - 1);
                    return (
                      <rect
                        key={idx}
                        x={x - colWidth / 2}
                        y={paddingTop}
                        width={colWidth}
                        height={plotHeight + 20}
                        fill="transparent"
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoveredMonthIndex(idx)}
                      />
                    );
                  })}

                  {/* Active Hover Crosshair & Indicators */}
                  {hoveredMonthIndex !== null && activePointRaised && activePointRounds && (
                    <g>
                      <line
                        x1={activePointRaised.x}
                        y1={paddingTop}
                        x2={activePointRaised.x}
                        y2={baselineY}
                        stroke="rgba(255, 255, 255, 0.25)"
                        strokeDasharray="2 2"
                      />
                      <circle cx={activePointRaised.x} cy={activePointRaised.y} r="5" fill="#00e599" stroke="#ffffff" strokeWidth="2" />
                      <circle cx={activePointRounds.x} cy={activePointRounds.y} r="5" fill="#a855f7" stroke="#ffffff" strokeWidth="2" />
                    </g>
                  )}

                  {/* X-Axis Month Labels */}
                  {MONTHLY_TREND_SERIES.map((d, i) => {
                    const x = paddingLeft + (i / (MONTHLY_TREND_SERIES.length - 1)) * plotWidth;
                    const isSep = d.month === "Sep";
                    const isHovered = hoveredMonthIndex === i;
                    return (
                      <text
                        key={d.month}
                        x={x}
                        y={chartHeight - 4}
                        textAnchor="middle"
                        className={`chart-month-label mono ${isSep || isHovered ? "active" : ""}`}
                      >
                        {d.month}
                      </text>
                    );
                  })}
                </svg>

                {/* Floating Interactive Details on Hover */}
                {hoveredMonthIndex !== null && (
                  <div
                    className="trend-hover-tooltip glass mono"
                    style={{
                      left: `${(hoveredMonthIndex / (MONTHLY_TREND_SERIES.length - 1)) * 75 + 12}%`,
                    }}
                  >
                    <span className="tooltip-month">{MONTHLY_TREND_SERIES[hoveredMonthIndex].month} '25</span>
                    <span className="tooltip-val-raised">${MONTHLY_TREND_SERIES[hoveredMonthIndex].raised}B Raised</span>
                    <span className="tooltip-val-rounds">{MONTHLY_TREND_SERIES[hoveredMonthIndex].rounds} Rounds</span>
                  </div>
                )}
              </div>

              {/* Bottom Chart Legend */}
              <div className="trend-chart-legend">
                <div className="legend-item">
                  <span className="legend-line green-dash" />
                  <span className="legend-label">Raised (USD)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-line purple-dash" />
                  <span className="legend-label">Rounds</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Quick Deal Detail Modal if clicked */}
        {selectedRound && (
          <div className="fund-deal-modal-backdrop" onClick={() => setSelectedRound(null)}>
            <div className="fund-deal-modal" onClick={(e) => e.stopPropagation()}>
              <div className="fund-deal-modal-header">
                <div className="fund-deal-header-left">
                  <ProjectLogo type={selectedRound.iconType} color={selectedRound.logoColor} />
                  <div>
                    <h3 className="fund-deal-title">{selectedRound.name}</h3>
                    <span className="fund-deal-sub">{selectedRound.round} · {selectedRound.category}</span>
                  </div>
                </div>
                <button className="fund-deal-close-btn" onClick={() => setSelectedRound(null)}>✕</button>
              </div>

              <div className="fund-deal-stats-row">
                <div className="fund-deal-stat">
                  <span className="stat-label">AMOUNT RAISED</span>
                  <span className="stat-value mono">{selectedRound.amount}</span>
                </div>
                <div className="fund-deal-stat">
                  <span className="stat-label">DATE ANNOUNCED</span>
                  <span className="stat-value mono">{selectedRound.date}, 2025</span>
                </div>
                <div className="fund-deal-stat">
                  <span className="stat-label">VALUATION TIER</span>
                  <span className="stat-value safe mono">Unicorn Tier</span>
                </div>
              </div>

              <div className="fund-deal-investors-section">
                <span className="investors-label">PARTICIPATING INVESTORS</span>
                <div className="investors-tags-list">
                  {selectedRound.investors.map((inv, idx) => (
                    <span key={idx} className="investor-pill-tag">
                      {inv.name}
                    </span>
                  ))}
                  <span className="investor-pill-tag neutral">
                    +{selectedRound.additionalInvestorsCount} Syndicate Partners
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Deals Drawer Modal if "View all ↗" or "See all ↗" is clicked */}
        {modalOpen && (
          <div className="fund-deal-modal-backdrop" onClick={() => setModalOpen(false)}>
            <div className="fund-all-deals-modal" onClick={(e) => e.stopPropagation()}>
              <div className="fund-deal-modal-header">
                <div>
                  <h3 className="fund-deal-title">Crypto Venture Funding Database</h3>
                  <span className="fund-deal-sub">Live tracked Web3 funding rounds & macro trends</span>
                </div>
                <button className="fund-deal-close-btn" onClick={() => setModalOpen(false)}>✕</button>
              </div>

              <div className="fund-all-deals-table">
                <div className="fund-table-head">
                  <span>PROJECT</span>
                  <span>ROUND</span>
                  <span>AMOUNT</span>
                  <span>DATE</span>
                  <span>CATEGORY</span>
                </div>
                {RECENT_FUNDING_ROUNDS.map((r) => (
                  <div key={r.id} className="fund-table-row">
                    <span className="col-project font-bold">{r.name}</span>
                    <span className="col-round">{r.round}</span>
                    <span className="col-amount mono font-bold text-green">{r.amount}</span>
                    <span className="col-date mono">{r.date}</span>
                    <span className="col-cat text-muted">{r.category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

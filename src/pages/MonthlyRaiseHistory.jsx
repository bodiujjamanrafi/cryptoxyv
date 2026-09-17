import { useState, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { usePolling } from "../hooks/usePolling";
import { getMarkets, fmtPct, fmtPrice } from "../api/coingecko";
import {
  KPI_SUMMARY_REF,
  HISTORICAL_24M_DUAL_AXIS,
  SECTOR_CATEGORIES_8,
  TOP_LAUNCHPADS_REF,
  BIGGEST_IDO_RAISES,
  TOKEN_SALE_NEWS,
} from "../api/monthlyRaiseData";

function MonthlyRaiseHistory() {
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState(null);

  // Realtime Live Crypto Market Data via CoinGecko Polling
  const { data: rawCoins } = usePolling(getMarkets, 15000);

  // Quick lookup map for live coin prices/deltas (e.g. FIL, RENDER, DEGEN, etc.)
  const liveCoinMap = useMemo(() => {
    const map = new Map();
    if (rawCoins && Array.isArray(rawCoins)) {
      rawCoins.forEach((c) => {
        if (c.symbol) map.set(c.symbol.toUpperCase(), c);
        if (c.id) map.set(c.id.toLowerCase(), c);
      });
    }
    return map;
  }, [rawCoins]);

  // Dual-Axis Chart Math
  const maxUSD = 130; // $130M scale
  const maxLaunches = 80; // 80 launches scale
  const chartHeight = 260; // Inner SVG chart height
  const chartWidth = 960; // Base coordinate viewBox width
  const padLeft = 55;
  const padRight = 45;
  const padTop = 20;
  const padBottom = 35;
  const drawWidth = chartWidth - padLeft - padRight;
  const drawHeight = chartHeight - padTop - padBottom;
  const barCount = HISTORICAL_24M_DUAL_AXIS.length;
  const colWidth = drawWidth / barCount;
  const barWidth = Math.max(16, colWidth * 0.58);

  // Calculate points for the launches trendline
  const linePoints = useMemo(() => {
    return HISTORICAL_24M_DUAL_AXIS.map((item, idx) => {
      const cx = padLeft + idx * colWidth + colWidth / 2;
      const cy = padTop + drawHeight - (item.launches / maxLaunches) * drawHeight;
      return { cx, cy, item, idx };
    });
  }, [drawHeight, drawWidth, colWidth]);

  const polylineStr = useMemo(() => {
    return linePoints.map((p) => `${p.cx},${p.cy}`).join(" ");
  }, [linePoints]);

  return (
    <div className="history-page-root">
      {/* Top Navigation */}
      <div className="history-nav-bar">
        <div className="history-nav-inner container">
          <Link to="/" className="history-back-btn" title="Back to main dashboard">
            <span className="back-arrow">←</span>
            <span>Back</span>
          </Link>
        </div>
      </div>

      <div className="container history-main-container">
        {/* ============================================================
            SECTION 1: TOP 4 KPI CARDS (MATCHING REFERENCE SCREENSHOT)
            ============================================================ */}
        {/* ============================================================
            SECTION 1: TOP 4 KPI CARDS (PREMIUM MODERN DESIGN)
            ============================================================ */}
        <section className="history-kpis-section">
          <div className="history-kpis-grid">
            {/* Card 1: Total Raised */}
            <div className="ref-kpi-card kpi-card-total">
              <span className="ref-kpi-indicator" />
              <div className="ref-kpi-header">
                <div className="ref-kpi-header-left">
                  <div className="ref-kpi-icon-wrap icon-cyan">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                      <path d="M12 6v2" />
                      <path d="M12 16v2" />
                    </svg>
                  </div>
                  <span className="ref-kpi-label">Total Raised</span>
                </div>
                <span className="ref-kpi-badge pill-cyan">All-time</span>
              </div>
              <div className="ref-kpi-value mono">{KPI_SUMMARY_REF.totalRaised}</div>
              <div className="ref-kpi-sub">
                <span className="kpi-sub-bullet" />
                <span>{KPI_SUMMARY_REF.totalRaisedSub}</span>
              </div>
            </div>

            {/* Card 2: Launches */}
            <div className="ref-kpi-card kpi-card-launches">
              <span className="ref-kpi-indicator" />
              <div className="ref-kpi-header">
                <div className="ref-kpi-header-left">
                  <div className="ref-kpi-icon-wrap icon-purple">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                      <path d="M12 9V4s3.03.55 4 2c1.08 1.62 0 5 0 5" />
                    </svg>
                  </div>
                  <span className="ref-kpi-label">Launches</span>
                </div>
                <span className="ref-kpi-badge pill-purple">Tracked</span>
              </div>
              <div className="ref-kpi-value mono">{KPI_SUMMARY_REF.launches}</div>
              <div className="ref-kpi-sub">
                <span className="kpi-sub-bullet" />
                <span>{KPI_SUMMARY_REF.launchesSub}</span>
              </div>
            </div>

            {/* Card 3: Peak Month */}
            <div className="ref-kpi-card kpi-card-peak">
              <span className="ref-kpi-indicator" />
              <div className="ref-kpi-header">
                <div className="ref-kpi-header-left">
                  <div className="ref-kpi-icon-wrap icon-amber">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                  </div>
                  <span className="ref-kpi-label">Peak Month</span>
                </div>
                <span className="ref-kpi-badge pill-amber">Record</span>
              </div>
              <div className="ref-kpi-value kpi-val-display">{KPI_SUMMARY_REF.peakMonth}</div>
              <div className="ref-kpi-sub">
                <span className="kpi-sub-bullet" />
                <span>{KPI_SUMMARY_REF.peakMonthSub} raised</span>
              </div>
            </div>

            {/* Card 4: Avg Launch */}
            <div className="ref-kpi-card kpi-card-avg">
              <span className="ref-kpi-indicator" />
              <div className="ref-kpi-header">
                <div className="ref-kpi-header-left">
                  <div className="ref-kpi-icon-wrap icon-green">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                      <polyline points="16 7 22 7 22 13" />
                    </svg>
                  </div>
                  <span className="ref-kpi-label">Avg Launch</span>
                </div>
                <span className="ref-kpi-badge pill-green">Mean</span>
              </div>
              <div className="ref-kpi-value mono">{KPI_SUMMARY_REF.avgLaunch}</div>
              <div className="ref-kpi-sub">
                <span className="kpi-sub-bullet" />
                <span>{KPI_SUMMARY_REF.avgLaunchSub}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 2: MONTHLY IDO RAISE (DUAL-AXIS 24-MONTH CHART PANEL)
            ============================================================ */}
        <section className="history-chart-panel-ref">
          <div className="panel-ref-header">
            <div className="panel-title-row">
              <div className="panel-title-with-icon">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <h2 className="panel-ref-title">Monthly IDO raise</h2>
              </div>
              <span className="chart-mobile-scroll-hint">Swipe to view 24M ↔</span>
            </div>
            <span className="panel-ref-subtitle">Bar: USD raised · Line: number of launches</span>
          </div>

          {/* Dual-Axis SVG Graphic Chart */}
          <div className="dual-chart-wrapper">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="dual-chart-svg"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Subtle vertical bar gradient */}
                <linearGradient id="barBlueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#1d9bf0" />
                </linearGradient>
                <linearGradient id="peakBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>

              {/* Grid Horizontal Guidelines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = padTop + drawHeight * (1 - ratio);
                const usdLabel = `$${Math.round(ratio * maxUSD)}M`;
                const launchLabel = Math.round(ratio * maxLaunches);

                return (
                  <g key={i} className="grid-level">
                    {/* Horizontal Line */}
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + drawWidth}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeDasharray="4 4"
                    />
                    {/* Left Y-Axis Label (USD) */}
                    <text
                      x={padLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      fill="#717680"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                    >
                      {usdLabel}
                    </text>
                    {/* Right Y-Axis Label (Launches) */}
                    <text
                      x={padLeft + drawWidth + 10}
                      y={y + 4}
                      textAnchor="start"
                      fill="#d97706"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                    >
                      {launchLabel}
                    </text>
                  </g>
                );
              })}

              {/* 24 Blue Vertical Bars (USD Raised) */}
              {HISTORICAL_24M_DUAL_AXIS.map((item, idx) => {
                const barH = (item.raised / maxUSD) * drawHeight;
                const bx = padLeft + idx * colWidth + (colWidth - barWidth) / 2;
                const by = padTop + drawHeight - barH;
                const isHovered = hoveredMonthIdx === idx;
                const isPeak = item.isPeak;

                return (
                  <g
                    key={item.id}
                    className="chart-bar-group"
                    onMouseEnter={() => setHoveredMonthIdx(idx)}
                    onMouseLeave={() => setHoveredMonthIdx(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* The Bar */}
                    <rect
                      x={bx}
                      y={by}
                      width={barWidth}
                      height={barH}
                      rx="3"
                      ry="3"
                      fill={isPeak ? "url(#peakBarGrad)" : "url(#barBlueGrad)"}
                      opacity={hoveredMonthIdx !== null && !isHovered ? 0.45 : 1}
                      stroke={isHovered ? "#ffffff" : isPeak ? "rgba(96, 165, 250, 0.8)" : "none"}
                      strokeWidth={isHovered ? "1.5" : isPeak ? "1" : "0"}
                      style={{ transition: "opacity 0.2s, stroke 0.2s" }}
                    />

                    {/* Bottom Month Label (2-line: Month / Year) */}
                    <text
                      x={bx + barWidth / 2}
                      y={padTop + drawHeight + 16}
                      textAnchor="middle"
                      fill={isHovered ? "#ffffff" : "#717680"}
                      fontSize="9"
                      fontWeight={isHovered ? "700" : "500"}
                      fontFamily="var(--font-sans)"
                    >
                      {item.month}
                    </text>
                    <text
                      x={bx + barWidth / 2}
                      y={padTop + drawHeight + 27}
                      textAnchor="middle"
                      fill={isHovered ? "#ffffff" : "#4b5563"}
                      fontSize="8"
                      fontFamily="var(--font-sans)"
                    >
                      {item.year}
                    </text>
                  </g>
                );
              })}

              {/* Amber Line: Launches per Month */}
              <polyline
                points={polylineStr}
                fill="none"
                stroke="#eab308"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Amber Points on the Launches Line */}
              {linePoints.map(({ cx, cy, item, idx }) => {
                const isHovered = hoveredMonthIdx === idx;
                return (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5.5 : 3.5}
                    fill={isHovered ? "#ffffff" : "#eab308"}
                    stroke="#0f1013"
                    strokeWidth="1.8"
                    onMouseEnter={() => setHoveredMonthIdx(idx)}
                    onMouseLeave={() => setHoveredMonthIdx(null)}
                    style={{ cursor: "pointer", transition: "r 0.15s, fill 0.15s" }}
                  />
                );
              })}

              {/* Active Hover Inspection Tag on SVG */}
              {hoveredMonthIdx !== null && (
                <g className="chart-tooltip-tag">
                  {(() => {
                    const item = HISTORICAL_24M_DUAL_AXIS[hoveredMonthIdx];
                    const pt = linePoints[hoveredMonthIdx];
                    const tipX = Math.min(Math.max(pt.cx, 75), chartWidth - 75);
                    const tipY = Math.max(pt.cy - 38, 20);

                    return (
                      <g transform={`translate(${tipX}, ${tipY})`}>
                        <rect
                          x="-65"
                          y="-14"
                          width="130"
                          height="28"
                          rx="4"
                          fill="#181a20"
                          stroke="rgba(255, 255, 255, 0.18)"
                        />
                        <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="600">
                          {item.label}: <tspan fill="#38bdf8">${item.raised}M</tspan> · <tspan fill="#eab308">{item.launches} launches</tspan>
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}
            </svg>
          </div>

          {/* Chart Bottom Legend matching screenshot */}
          <div className="chart-legend-row">
            <div className="legend-item">
              <span className="legend-box-blue" />
              <span className="legend-text">Raised per month</span>
            </div>
            <div className="legend-item">
              <span className="legend-box-amber" />
              <span className="legend-text">Launches per month</span>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 3: BY CATEGORY (CAPITAL DISTRIBUTION ACROSS SECTORS)
            ============================================================ */}
        <section className="history-category-panel-ref">
          <div className="panel-ref-header">
            <div className="panel-title-with-icon">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 10 10" />
                <path d="M12 12 2.1 10.5" />
              </svg>
              <h2 className="panel-ref-title">By Category</h2>
            </div>
            <span className="panel-ref-subtitle">Capital distribution across sectors</span>
          </div>

          {/* 8 Sector Cards in 4x2 Grid */}
          <div className="category-8-grid">
            {SECTOR_CATEGORIES_8.map((cat) => {
              const liveCoin = liveCoinMap.get(cat.topCoin.toUpperCase()) || liveCoinMap.get(cat.topCoin.toLowerCase());
              return (
                <div key={cat.rank} className="cat-pill-card">
                  <div className="cat-pill-top">
                    <span className="cat-rank mono">{cat.rank}</span>
                    <span className="cat-name">{cat.name}</span>
                    <span className="cat-amount-count">
                      <strong className="cat-amt mono">{cat.amount}</strong>
                      <span className="cat-count">({cat.count})</span>
                    </span>
                  </div>
                  {/* Category Accent Underline */}
                  <div className="cat-underline" style={{ background: cat.color }} />
                  {/* Realtime token pulse for the sector if available */}
                  {liveCoin && (
                    <div className="cat-live-token">
                      <span className="live-tag">LIVE:</span>
                      <span className="live-sym">{liveCoin.symbol?.toUpperCase()}</span>
                      <span className="live-price mono">{fmtPrice(liveCoin.current_price)}</span>
                      <span className={`live-chg mono ${liveCoin.price_change_percentage_24h >= 0 ? "up" : "down"}`}>
                        {fmtPct(liveCoin.price_change_percentage_24h)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================
            SECTION 4: TOP LAUNCHPADS TABLE (MATCHING REFERENCE SCREENSHOT)
            ============================================================ */}
        <section className="history-table-panel-ref">
          <div className="panel-ref-header">
            <div className="panel-title-with-icon">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
              </svg>
              <h2 className="panel-ref-title">Top Launchpads</h2>
            </div>
            <span className="panel-ref-subtitle">Ranked by cumulative raise and performance</span>
          </div>

          <div className="ref-table-wrapper">
            <table className="ref-data-table">
              <thead>
                <tr>
                  <th className="th-rank">#</th>
                  <th className="th-name">Name</th>
                  <th className="th-projects">Projects</th>
                  <th className="th-raise">Total Raise</th>
                  <th className="th-avg">Avg</th>
                  <th className="th-best">Best</th>
                  <th className="th-top-project">Top project</th>
                </tr>
              </thead>
              <tbody>
                {TOP_LAUNCHPADS_REF.map((lp) => {
                  const liveCoin = lp.coinSymbol
                    ? liveCoinMap.get(lp.coinSymbol.toUpperCase()) || liveCoinMap.get(lp.coinSymbol.toLowerCase())
                    : null;

                  return (
                    <tr key={lp.rank} className="ref-table-row">
                      {/* Rank */}
                      <td className="td-rank mono">{lp.rank}</td>

                      {/* Name with Badge */}
                      <td className="td-name">
                        <div className="lp-name-cell">
                          <div
                            className="lp-badge"
                            style={{ background: lp.badgeBg, color: lp.badgeColor }}
                          >
                            {lp.badge}
                          </div>
                          <div className="lp-info">
                            <span className="lp-name-text">{lp.name}</span>
                            <span className="lp-subtext">{lp.type}</span>
                          </div>
                        </div>
                      </td>

                      {/* Projects */}
                      <td className="td-projects mono">{lp.projects}</td>

                      {/* Total Raise */}
                      <td className="td-raise mono">{lp.totalRaise}</td>

                      {/* Avg */}
                      <td className="td-avg mono">{lp.avg}</td>

                      {/* Best ROI */}
                      <td className="td-best">
                        <span className={`ath-pill ath-pill-${lp.bestTier} mono`}>
                          {lp.best}
                        </span>
                      </td>

                      {/* Top Project with Realtime Live Price */}
                      <td className="td-top-project">
                        <div className="top-proj-cell">
                          <span className="proj-name">{lp.topProject}</span>
                          {liveCoin && (
                            <span className="proj-live-badge mono">
                              <span className="proj-price">{fmtPrice(liveCoin.current_price)}</span>
                              <span className={`proj-delta ${liveCoin.price_change_percentage_24h >= 0 ? "up" : "down"}`}>
                                {fmtPct(liveCoin.price_change_percentage_24h)}
                              </span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============================================================
            SECTION 5: BIGGEST IDO RAISES (MATCHING REFERENCE SCREENSHOT)
            ============================================================ */}
        <section className="history-table-panel-ref">
          <div className="panel-ref-header">
            <div className="panel-title-with-icon">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
              <h2 className="panel-ref-title">Biggest IDO Raises</h2>
            </div>
            <span className="panel-ref-subtitle">Largest public sale rounds YTD</span>
          </div>

          <div className="ref-table-wrapper">
            <table className="ref-data-table">
              <thead>
                <tr>
                  <th className="th-rank">#</th>
                  <th className="th-name">Name</th>
                  <th className="th-raise">Raise</th>
                  <th className="th-launchpad">Launchpad</th>
                  <th className="th-date">Date</th>
                  <th className="th-ath">ATH</th>
                </tr>
              </thead>
              <tbody>
                {BIGGEST_IDO_RAISES.map((item) => {
                  const liveCoin = item.symbol
                    ? liveCoinMap.get(item.symbol.toUpperCase()) || liveCoinMap.get(item.name.toLowerCase())
                    : null;

                  return (
                    <tr key={item.rank} className="ref-table-row">
                      {/* Rank */}
                      <td className="td-rank mono">{item.rank}</td>

                      {/* Name with Token Symbol Monogram */}
                      <td className="td-name">
                        <div className="token-name-cell">
                          <div className="token-symbol-badge" style={{ borderColor: item.badgeColor }}>
                            {item.symbol.slice(0, 3)}
                          </div>
                          <div className="token-info">
                            <span className="token-name-text">{item.name}</span>
                            <span className="token-symbol-text mono">{item.symbol}</span>
                          </div>
                          {/* Live price tag if token is listed */}
                          {liveCoin && (
                            <span className="token-live-tag mono">
                              <span className="t-live-price">{fmtPrice(liveCoin.current_price)}</span>
                              <span className={`t-live-delta ${liveCoin.price_change_percentage_24h >= 0 ? "up" : "down"}`}>
                                {fmtPct(liveCoin.price_change_percentage_24h)}
                              </span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Raise Amount */}
                      <td className="td-raise mono font-bold">{item.raise}</td>

                      {/* Launchpad */}
                      <td className="td-launchpad">{item.launchpad}</td>

                      {/* Date */}
                      <td className="td-date mono">{item.date}</td>

                      {/* ATH Multiplier Pill */}
                      <td className="td-ath">
                        <span className={`ath-pill ath-pill-${item.athTier} mono`}>
                          {item.ath}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============================================================
            SECTION 6: TOKEN SALE NEWS (MATCHING REFERENCE SCREENSHOT)
            ============================================================ */}
        <section className="history-news-section-ref">
          <div className="news-ref-header">
            <h2 className="news-ref-title">Token sale news</h2>
          </div>

          <div className="news-ref-list">
            {TOKEN_SALE_NEWS.map((news) => (
              <div key={news.id} className="news-ref-card">
                <div className="news-ref-thumb-wrap">
                  <div className="news-ref-thumb-graphic">
                    <span className="news-ref-thumb-icon">⚡</span>
                  </div>
                </div>
                <div className="news-ref-content">
                  <div className="news-ref-top-row">
                    <span className="news-ref-tag" style={{ color: news.tagColor }}>
                      {news.tag}
                    </span>
                    <span className="news-ref-time">{news.date}</span>
                  </div>
                  <h3 className="news-ref-headline">{news.title}</h3>
                  <p className="news-ref-summary">{news.summary}</p>
                  <div className="news-ref-footer">
                    <span className="news-ref-source">{news.source}</span>
                    <span className="news-ref-valuation mono">{news.valuation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default memo(MonthlyRaiseHistory);

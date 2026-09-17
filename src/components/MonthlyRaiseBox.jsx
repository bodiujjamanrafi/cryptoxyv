import { useState, memo } from "react";
import { Link } from "react-router-dom";
import { GLANCE_17M_BARS, GLANCE_SUMMARY } from "../api/monthlyRaiseData";

function MonthlyRaiseBox() {
  const [hoveredBarIdx, setHoveredBarIdx] = useState(null);

  return (
    <div className="monthly-raise-ref-container">
      {/* Outer Section Header (Above Card) */}
      <div className="monthly-raise-outer-header">
        <h2 className="monthly-raise-outer-title">Monthly raise, at a glance</h2>
        <Link to="/ido-history" className="monthly-raise-view-all" title="View complete 24-month archive">
          <span>View all</span>
          <span className="view-all-arrow">↗</span>
        </Link>
      </div>

      {/* Main Dark Card */}
      <div className="monthly-raise-card-ref">
        {/* Card Header Top Row */}
        <div className="raise-card-top-row">
          <h3 className="raise-card-title">IDO / IEO / ICO Monthly Raise</h3>
          <Link to="/ido-history" className="raise-history-link" title="View 24-Month IDO History">
            <span className="raise-history-text">Monthly history</span>
            <span className="raise-history-arrow">↗</span>
          </Link>
        </div>

        {/* Subtitle Metrics Line */}
        <div className="raise-card-metrics-row">
          <span className="metric-group">
            <span className="metric-label">Total Raised:</span>
            <span className="metric-val-blue">{GLANCE_SUMMARY.totalRaised}</span>
          </span>
          <span className="metric-group">
            <span className="metric-label">Projects:</span>
            <span className="metric-val-white">{GLANCE_SUMMARY.projectsCount}</span>
          </span>
          <span className="metric-group">
            <span className="metric-label-currency">{GLANCE_SUMMARY.currency}</span>
          </span>
        </div>

        {/* 17-Bar Stacked Graph Chart */}
        <div className="raise-chart-container">
          <div className="raise-bars-track">
            {GLANCE_17M_BARS.map((bar, idx) => {
              const isHovered = hoveredBarIdx === idx;
              // Proportional height percentage relative to peak bar
              const maxTrackH = 118;
              const heightPct = ((bar.totalH / maxTrackH) * 100).toFixed(1);
              const bluePct = ((bar.blueH / bar.totalH) * 100).toFixed(1);
              const darkPct = ((bar.darkH / bar.totalH) * 100).toFixed(1);

              return (
                <div
                  key={bar.id}
                  className={`raise-bar-col ${isHovered ? "active" : ""}`}
                  onMouseEnter={() => setHoveredBarIdx(idx)}
                  onMouseLeave={() => setHoveredBarIdx(null)}
                >
                  {/* Subtle Hover Tooltip */}
                  {isHovered && (
                    <div className="raise-bar-tooltip">
                      <span className="tt-month">{bar.month}</span>
                      <span className="tt-raised">{bar.raised}</span>
                      <span className="tt-proj">{bar.projects} projects</span>
                    </div>
                  )}

                  {/* Vertical Pillar Wrap with Percentage Height */}
                  <div className="raise-bar-pillar-wrap">
                    <div className="raise-bar-pillar" style={{ height: `${heightPct}%` }}>
                      {/* Dark Cap on Top */}
                      <div
                        className="bar-cap-dark"
                        style={{ height: `${darkPct}%` }}
                      />
                      {/* Vibrant Blue Body */}
                      <div
                        className="bar-body-blue"
                        style={{ height: `${bluePct}%` }}
                      />
                    </div>
                  </div>

                  {/* Month Label */}
                  <span className={`bar-month-label ${isHovered ? "active" : ""}`}>
                    {bar.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MonthlyRaiseBox);

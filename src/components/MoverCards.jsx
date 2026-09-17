import { memo } from "react";
import { Link } from "react-router-dom";
import Sparkline from "./Sparkline";
import { fmtPrice, fmtPct, fmtCompact } from "../api/coingecko";

/* Small gold "verified" seal, matching the premium reference cards. */
function Verified() {
  return (
    <svg className="verified" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-label="verified">
      <path
        d="M12 2l2.2 1.6 2.7-.2 1 2.5 2.3 1.4-.6 2.6.9 2.5-2 1.8.1 2.7-2.6.8-1.6 2.2H12l-2.4.9-1.6-2.2-2.6-.8.1-2.7-2-1.8.9-2.5-.6-2.6 2.3-1.4 1-2.5 2.7.2L12 2z"
        fill="#f5b544"
      />
      <path d="M8.5 12.2l2.3 2.3 4.6-4.8" stroke="#0a0b14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Grid of premium market cards: logo · name · rank · price · change ·
   7-day sparkline · volume. Layout inspired by pro market terminals. */
function MoverCards({ title, subtitle, coins, tone }) {
  return (
    <div className="mcards-block">
      <div className="mcards-head">
        <span className={`mcards-dot ${tone}`} />
        <div>
          <h3 className="mcards-title">{title}</h3>
          {subtitle && <span className="mcards-sub">{subtitle}</span>}
        </div>
      </div>
      <div className="mcards-grid">
        {coins.length
          ? coins.map((c, i) => {
              const up = (c.price_change_percentage_24h ?? 0) >= 0;
              return (
                <Link to={`/coin/${c.id}`} className="mcard glass" key={c.id}>
                  <div className="mcard-top">
                    <img src={c.image} alt="" width="36" height="36" loading="lazy" />
                    <div className="mcard-id">
                      <span className="mcard-name">
                        {c.name} <Verified />
                      </span>
                      <span className="mcard-sym mono">{c.symbol?.toUpperCase()}</span>
                    </div>
                    <span className="mcard-rank mono">#{i + 1}</span>
                  </div>
                  <div className="mcard-bottom">
                    <div className="mcard-figures">
                      <span className="mcard-price mono">{fmtPrice(c.current_price)}</span>
                      <span className={`mcard-chg mono ${up ? "up" : "down"}`}>
                        {up ? "↗" : "↘"} {fmtPct(c.price_change_percentage_24h).replace("+", "")}
                      </span>
                    </div>
                    <div className="mcard-spark">
                      <Sparkline data={c.sparkline_in_7d?.price} up={up} width={128} height={44} />
                      <span className="mcard-vol">
                        Volume <b className="mono">{fmtCompact(c.total_volume)}</b>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          : Array.from({ length: 3 }).map((_, i) => (
              <div className="mcard glass" key={i}>
                <div className="skeleton" style={{ height: 96, width: "100%" }} />
              </div>
            ))}
      </div>
    </div>
  );
}

export default memo(MoverCards);

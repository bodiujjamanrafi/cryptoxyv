import { memo } from "react";
import { Link } from "react-router-dom";
import { fmtPrice, fmtPct } from "../api/coingecko";

/* Infinite marquee of live prices. Duplicated track for a seamless loop. */
function Ticker({ coins }) {
  if (!coins?.length) return null;
  const row = coins.slice(0, 18);
  const items = [...row, ...row];

  return (
    <div className="ticker" aria-label="Live price ticker">
      <div className="ticker-track">
        {items.map((c, i) => {
          const up = (c.price_change_percentage_24h ?? 0) >= 0;
          return (
            <Link to={`/coin/${c.id}`} className="ticker-item" key={`${c.id}-${i}`}>
              <img src={c.image} alt="" width="18" height="18" loading="lazy" />
              <span className="ti-sym mono">{c.symbol?.toUpperCase()}</span>
              <span className="ti-price mono">{fmtPrice(c.current_price)}</span>
              <span className={`ti-pct mono ${up ? "up" : "down"}`}>
                {up ? "▲" : "▼"} {fmtPct(c.price_change_percentage_24h).replace("+", "")}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default memo(Ticker);

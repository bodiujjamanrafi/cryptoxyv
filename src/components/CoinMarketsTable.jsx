import { useState, useMemo } from "react";
import { fmtPrice, fmtCompact } from "../api/coingecko";

export default function CoinMarketsTable({ tickers = [] }) {
  const [showAll, setShowAll] = useState(false);

  // Filter and deduplicate active tickers with reasonable volume
  const cleanTickers = useMemo(() => {
    if (!tickers || !tickers.length) return [];

    // Filter out stale or invalid tickers
    const valid = tickers.filter((t) => {
      const vol = t.converted_volume?.usd || t.volume;
      const price = t.converted_last?.usd || t.last;
      return vol > 0 && price > 0 && !t.is_stale;
    });

    // Sort by converted volume descending
    valid.sort((a, b) => (b.converted_volume?.usd || 0) - (a.converted_volume?.usd || 0));

    // Deduplicate same exchange + same pair
    const seen = new Set();
    const deduped = [];
    for (const t of valid) {
      const key = `${t.market?.identifier || t.market?.name}-${t.base}/${t.target}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(t);
      }
    }

    return deduped;
  }, [tickers]);

  if (!cleanTickers.length) {
    return null;
  }

  const totalVol = cleanTickers.reduce((acc, t) => acc + (t.converted_volume?.usd || 0), 0);
  const displayed = showAll ? cleanTickers.slice(0, 30) : cleanTickers.slice(0, 8);

  return (
    <section className="markets-section glass">
      <div className="markets-sec-head">
        <div>
          <h3 className="rail-title" style={{ marginBottom: 4 }}>Exchange Markets</h3>
          <span className="markets-sec-sub">Active spot & derivative trading pairs across top global exchanges</span>
        </div>
        <span className="markets-count pill mono">{cleanTickers.length} Pairs Available</span>
      </div>

      <div className="table-wrap">
        <table className="markets-table">
          <thead>
            <tr className="mono">
              <th style={{ width: 40 }}>#</th>
              <th>Exchange</th>
              <th>Pair</th>
              <th style={{ textAlign: "right" }}>Price</th>
              <th style={{ textAlign: "right" }}>24h Volume</th>
              <th style={{ textAlign: "right" }}>Vol Share</th>
              <th style={{ textAlign: "center" }}>Trust</th>
              <th style={{ textAlign: "right" }}>Trade</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((t, idx) => {
              const pair = `${t.base}/${t.target}`;
              const price = t.converted_last?.usd || t.last;
              const vol = t.converted_volume?.usd || 0;
              const share = totalVol > 0 ? (vol / totalVol) * 100 : 0;
              const tradeUrl = t.trade_url || t.market?.trade_url;
              const trust = t.trust_score || "green";

              return (
                <tr key={`${t.market?.name}-${pair}-${idx}`} className="market-row">
                  <td className="mono text-muted">{idx + 1}</td>
                  <td>
                    <div className="market-exchange">
                      {t.market?.logo && (
                        <img src={t.market.logo} alt="" width="20" height="20" className="exchange-logo" />
                      )}
                      <span className="exchange-name font-semibold">{t.market?.name || "Exchange"}</span>
                    </div>
                  </td>
                  <td>
                    <span className="market-pair mono font-semibold">{pair}</span>
                  </td>
                  <td style={{ textAlign: "right" }} className="mono">
                    {fmtPrice(price)}
                  </td>
                  <td style={{ textAlign: "right" }} className="mono">
                    {fmtCompact(vol)}
                  </td>
                  <td style={{ textAlign: "right" }} className="mono text-muted">
                    {share.toFixed(2)}%
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`trust-indicator trust-${trust}`} title={`Trust: ${trust}`} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {tradeUrl ? (
                      <a
                        href={tradeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="market-trade-btn mono"
                      >
                        Trade ↗
                      </a>
                    ) : (
                      <span className="text-muted mono">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {cleanTickers.length > 8 && (
        <div className="markets-table-footer">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show Less" : `View All ${cleanTickers.length} Markets`}
          </button>
        </div>
      )}
    </section>
  );
}

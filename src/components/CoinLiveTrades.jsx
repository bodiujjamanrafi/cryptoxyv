import { fmtPrice } from "../api/coingecko";

export default function CoinLiveTrades({ trades = [], symbol = "BTC", isLive = false }) {
  // Calculate quick buy/sell pressure from the last trades
  const buyCount = trades.filter((t) => t.side === "buy").length;
  const sellCount = trades.filter((t) => t.side === "sell").length;
  const total = buyCount + sellCount;
  const buyPct = total > 0 ? Math.round((buyCount / total) * 100) : 50;

  return (
    <div className="live-trades-card glass">
      <div className="live-trades-head">
        <div className="live-trades-title-row">
          <h3 className="rail-title" style={{ margin: 0 }}>Live Trades</h3>
          <div className={`live-badge ${isLive ? "active" : ""}`}>
            <span className="live-ping" />
            <span className="live-badge-text">{isLive ? "REALTIME TAPE" : "CONNECTING"}</span>
          </div>
        </div>
        <span className="live-trades-sub mono">{symbol.toUpperCase()}/USDT</span>
      </div>

      {/* Buy / Sell Pressure Ratio */}
      <div className="tape-pressure">
        <div className="tape-pressure-labels">
          <span className="mono up">Buy {buyPct}%</span>
          <span className="mono down">Sell {100 - buyPct}%</span>
        </div>
        <div className="tape-pressure-track">
          <div className="tape-pressure-fill" style={{ width: `${buyPct}%` }} />
        </div>
      </div>

      {/* Trades Table Header */}
      <div className="tape-head mono">
        <span>Price (USDT)</span>
        <span style={{ textAlign: "right" }}>Amount</span>
        <span style={{ textAlign: "right" }}>Time</span>
      </div>

      {/* Stream List */}
      <div className="tape-list">
        {trades.length === 0 ? (
          <div className="tape-empty mono">Listening for trade ticks…</div>
        ) : (
          trades.slice(0, 15).map((t) => {
            const timeStr = new Date(t.time).toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            const isBuy = t.side === "buy";
            return (
              <div className={`tape-row mono ${isBuy ? "tape-buy" : "tape-sell"}`} key={t.id}>
                <span className={`tape-price ${isBuy ? "up" : "down"}`}>
                  {fmtPrice(t.price).replace("$", "")}
                </span>
                <span className="tape-qty" style={{ textAlign: "right" }}>
                  {t.qty < 0.001 ? t.qty.toFixed(6) : t.qty < 1 ? t.qty.toFixed(4) : t.qty.toFixed(2)}
                </span>
                <span className="tape-time" style={{ textAlign: "right" }}>
                  {timeStr}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

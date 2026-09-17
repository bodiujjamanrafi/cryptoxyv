import { useState, useMemo, memo } from "react";
import Donut from "./Donut";
import { fmtCompact } from "../api/coingecko";

function MarketDominanceCard({
  globalData,
  coins = [],
  realtimeMap = null,
  totalMarketCapUsd = 0,
}) {
  const [selectedLabel, setSelectedLabel] = useState("BTC");
  const [hoveredLabel, setHoveredLabel] = useState(null);

  const activeLabel = hoveredLabel || selectedLabel;

  const dom = globalData?.market_cap_percentage || {};

  // Find real-time coin objects from live market feeds
  const coinLookup = useMemo(() => {
    const map = new Map();
    for (const c of coins) {
      if (c.symbol) map.set(c.symbol.toLowerCase(), c);
    }
    return map;
  }, [coins]);

  // Derive dynamic real-time percentages and 24h changes
  const segments = useMemo(() => {
    const totalCap = Number(totalMarketCapUsd) || Number(globalData?.total_market_cap?.usd) || 2_630_000_000_000;

    // 1. BTC
    const btcCoin = coinLookup.get("btc");
    const btcLive = realtimeMap?.get("BTCUSDT");
    const btcVal = Number(dom.btc || (btcCoin?.market_cap ? (btcCoin.market_cap / totalCap) * 100 : 58.8));
    const btcDelta = btcLive ? btcLive.chg : (btcCoin?.price_change_percentage_24h ?? -0.21);

    // 2. ETH
    const ethCoin = coinLookup.get("eth");
    const ethLive = realtimeMap?.get("ETHUSDT");
    const ethVal = Number(dom.eth || (ethCoin?.market_cap ? (ethCoin.market_cap / totalCap) * 100 : 11.6));
    const ethDelta = ethLive ? ethLive.chg : (ethCoin?.price_change_percentage_24h ?? -0.25);

    // 3. SOL
    const solCoin = coinLookup.get("sol");
    const solLive = realtimeMap?.get("SOLUSDT");
    const solVal = Number(dom.sol || (solCoin?.market_cap ? (solCoin.market_cap / totalCap) * 100 : 2.3));
    const solDelta = solLive ? solLive.chg : (solCoin?.price_change_percentage_24h ?? -0.79);

    // 4. USDT
    const usdtCoin = coinLookup.get("usdt");
    const usdtVal = Number(dom.usdt || (usdtCoin?.market_cap ? (usdtCoin.market_cap / totalCap) * 100 : 7.0));
    const usdtDelta = usdtCoin?.price_change_percentage_24h ?? 0.00;

    // 5. BNB
    const bnbCoin = coinLookup.get("bnb");
    const bnbLive = realtimeMap?.get("BNBUSDT");
    const bnbVal = Number(dom.bnb || (bnbCoin?.market_cap ? (bnbCoin.market_cap / totalCap) * 100 : 3.7));
    const bnbDelta = bnbLive ? bnbLive.chg : (bnbCoin?.price_change_percentage_24h ?? -1.47);

    // 6. Others
    const allocated = btcVal + ethVal + solVal + usdtVal + bnbVal;
    const othersVal = Math.max(0, parseFloat((100 - allocated).toFixed(1)));

    // Aggregate change of liquid altcoins
    const liquidAlts = coins.filter(
      (c) => c.symbol && !["btc", "eth", "usdt", "sol", "bnb"].includes(c.symbol.toLowerCase()) && c.price_change_percentage_24h != null
    ).slice(0, 10);
    const altAvgDelta = liquidAlts.length
      ? liquidAlts.reduce((acc, c) => acc + c.price_change_percentage_24h, 0) / liquidAlts.length
      : 0.38;

    return [
      {
        label: "BTC",
        name: "Bitcoin",
        color: "#00d2ff",
        value: parseFloat(btcVal.toFixed(1)),
        delta: btcDelta,
        usdVal: fmtCompact((totalCap * btcVal) / 100),
      },
      {
        label: "ETH",
        name: "Ethereum",
        color: "#4f75fe",
        value: parseFloat(ethVal.toFixed(1)),
        delta: ethDelta,
        usdVal: fmtCompact((totalCap * ethVal) / 100),
      },
      {
        label: "SOL",
        name: "Solana",
        color: "#a855f7",
        value: parseFloat(solVal.toFixed(1)),
        delta: solDelta,
        usdVal: fmtCompact((totalCap * solVal) / 100),
      },
      {
        label: "USDT",
        name: "Tether",
        color: "#10b981",
        value: parseFloat(usdtVal.toFixed(1)),
        delta: usdtDelta,
        usdVal: fmtCompact((totalCap * usdtVal) / 100),
      },
      {
        label: "BNB",
        name: "BNB Chain",
        color: "#f5b544",
        value: parseFloat(bnbVal.toFixed(1)),
        delta: bnbDelta,
        usdVal: fmtCompact((totalCap * bnbVal) / 100),
      },
      {
        label: "Others",
        name: "Altcoins",
        color: "#64748b",
        value: othersVal || 16.7,
        delta: altAvgDelta,
        usdVal: fmtCompact((totalCap * (othersVal || 16.7)) / 100),
      },
    ];
  }, [dom, coinLookup, realtimeMap, totalMarketCapUsd, globalData, coins]);

  const altcoinShare = useMemo(() => {
    const btc = dom.btc || 58.8;
    return (100 - Number(btc)).toFixed(1);
  }, [dom]);

  return (
    <div className="dominance-panel">
      {/* Panel header */}
      <div className="dom-panel-header">
        <span className="dom-panel-title">MARKET DOMINANCE</span>
        <div className="dom-header-right">
          <span className="dom-alt-label">Altcoin Share:</span>
          <span className="dom-alt-val mono">{altcoinShare}%</span>
        </div>
      </div>

      {/* Panel body: Donut on left, 6 coin rows on right */}
      <div className="dom-panel-body">
        {/* Left: Clean animated circular donut */}
        <div className="dom-donut-col">
          <Donut
            segments={segments}
            size={188}
            stroke={16}
            activeLabel={activeLabel}
            onHover={setHoveredLabel}
            onSelect={setSelectedLabel}
          />
        </div>

        {/* Right: 6 clean vertical coin rows */}
        <div className="dom-rows-col">
          {segments.map((s) => {
            const isSelected = activeLabel === s.label;
            const isDimmed = Boolean(activeLabel && !isSelected);
            const deltaNum = Number(s.delta);
            const isPositive = deltaNum > 0;
            const isZero = deltaNum === 0 || Math.abs(deltaNum) < 0.005;

            return (
              <div
                key={s.label}
                className={`dom-coin-row ${isSelected ? "selected" : ""} ${isDimmed ? "dimmed" : ""}`}
                onClick={() => setSelectedLabel(s.label)}
                onMouseEnter={() => setHoveredLabel(s.label)}
                onMouseLeave={() => setHoveredLabel(null)}
              >
                {/* Column 1: Bullet + Symbol */}
                <div className="dom-coin-col-sym">
                  <span
                    className="dom-coin-bullet"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="dom-coin-symbol mono">{s.label}</span>
                </div>

                {/* Column 2: Progress bar */}
                <div className="dom-coin-col-bar">
                  <div className="dom-progress-track">
                    <div
                      className="dom-progress-fill"
                      style={{
                        width: `${Math.min(100, Math.max(4, (s.value / 60) * 100))}%`,
                        backgroundColor: s.color,
                        boxShadow: isSelected ? `0 0 8px ${s.color}88` : "none",
                      }}
                    />
                  </div>
                </div>

                {/* Column 3: Dominance percentage */}
                <div className="dom-coin-col-pct mono">
                  {s.value.toFixed(1)}%
                </div>

                {/* Column 4: 24h change */}
                <div
                  className={`dom-coin-col-delta mono ${
                    isZero ? "neutral" : isPositive ? "up" : "down"
                  }`}
                >
                  {!isZero && (isPositive ? "▲ " : "▼ ")}
                  {isZero ? "0.00%" : `${Math.abs(deltaNum).toFixed(2)}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(MarketDominanceCard);

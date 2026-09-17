import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { usePolling } from "../hooks/usePolling";
import { getCoin, getMarketChart } from "../api/coingecko";
import { subscribeCoinTicker } from "../api/realtime";
import CoinGeckoLeftRail from "../components/CoinGeckoLeftRail";
import CoinGeckoChartArea from "../components/CoinGeckoChartArea";
import CoinGeckoRightRail from "../components/CoinGeckoRightRail";
import CoinDetailMarkets from "../components/CoinDetailMarkets";
import CoinDetailTreasuries from "../components/CoinDetailTreasuries";
import CoinDetailNews from "../components/CoinDetailNews";
import CoinDetailGuides from "../components/CoinDetailGuides";
import CoinDetailGlobalPrices from "../components/CoinDetailGlobalPrices";

export default function CoinDetail() {
  const { id } = useParams();
  const [days, setDays] = useState(1); // Default to 24H as seen in CoinGecko reference
  const [activeMainTab, setActiveMainTab] = useState("overview");
  const [feedback, setFeedback] = useState(null);

  const [isWatchlisted, setIsWatchlisted] = useState(() => {
    try {
      const list = JSON.parse(localStorage.getItem("asteron:watchlist") || localStorage.getItem("cxv:watchlist") || "[]");
      return list.includes(id);
    } catch {
      return false;
    }
  });

  // Real-time ticker state from Binance WebSocket
  const [realtimeData, setRealtimeData] = useState(null);
  const [tickFlash, setTickFlash] = useState(null); // 'up' | 'down' | null
  const lastPriceRef = useRef(null);
  const flashTimerRef = useRef(null);

  // Polling CoinGecko for core profile & market charts
  const coin = usePolling(() => getCoin(id), { interval: 60_000, deps: [id] });
  const chart = usePolling(() => getMarketChart(id, days), { interval: 60_000, deps: [id, days] });

  const c = coin.data;
  const m = c?.market_data;
  const points = chart.data?.prices;

  const toggleWatchlist = () => {
    try {
      const list = JSON.parse(localStorage.getItem("asteron:watchlist") || localStorage.getItem("cxv:watchlist") || "[]");
      let updated;
      if (list.includes(id)) {
        updated = list.filter((x) => x !== id);
        setIsWatchlisted(false);
      } else {
        updated = [...list, id];
        setIsWatchlisted(true);
      }
      localStorage.setItem("asteron:watchlist", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Subscribe to millisecond live ticker feeds when coin symbol is known
  useEffect(() => {
    if (!c?.symbol) return;

    let mounted = true;
    const unsub = subscribeCoinTicker(c.symbol, {
      onTicker: (ticker) => {
        if (!mounted) return;
        setRealtimeData(ticker);

        if (lastPriceRef.current != null && ticker.price !== lastPriceRef.current) {
          const dir = ticker.price > lastPriceRef.current ? "up" : "down";
          setTickFlash(dir);
          if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
          flashTimerRef.current = setTimeout(() => setTickFlash(null), 800);
        }
        lastPriceRef.current = ticker.price;
      },
    });

    return () => {
      mounted = false;
      unsub();
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [c?.symbol]);

  // Derived real-time prices & stats
  const currentPrice = realtimeData?.price || m?.current_price?.usd;
  const priceChange24h = realtimeData?.chg ?? m?.price_change_percentage_24h;
  const high24 = Math.max(realtimeData?.high || 0, m?.high_24h?.usd || 0);
  const low24 = realtimeData?.low && realtimeData.low > 0
    ? (m?.low_24h?.usd ? Math.min(realtimeData.low, m.low_24h.usd) : realtimeData.low)
    : m?.low_24h?.usd;
  const volume24 = realtimeData?.quoteVol
    ? Math.max(realtimeData.quoteVol, m?.total_volume?.usd || 0)
    : m?.total_volume?.usd;

  // Handle 404
  const notFound = coin.error && /not found/i.test(coin.error);
  const busy = coin.error && !notFound && !c;

  if (notFound && !c) {
    return (
      <div className="container detail-error">
        <h1 className="display">Coin not found</h1>
        <p className="section-sub">We couldn't find an asset called “{id}”. It may have delisted or changed ticker.</p>
        <Link to="/markets" className="btn btn-primary">Back to markets</Link>
      </div>
    );
  }

  return (
    <div className="cg-page-wrapper">
      <div className="cg-page-container">
        {/* Top Breadcrumb row */}
        <div className="cg-breadcrumbs-row">
          <Link to="/markets" className="cg-crumb-link">Cryptocurrencies</Link>
          <span className="cg-crumb-sep">&gt;</span>
          <span className="cg-crumb-current">{c?.name || id} Price</span>
        </div>

        {busy && (
          <div className="busy-banner glass" style={{ marginBottom: 16 }}>
            <span><span className="live-dot" /> High traffic — reconnecting live feeds…</span>
            <button className="btn btn-ghost" onClick={() => { coin.refresh(); chart.refresh(); }}>Retry</button>
          </div>
        )}

        {/* 3-Column Balanced Layout across Left, Middle, and Right of the Screen */}
        <div className="cg-layout-3col">
          {/* Column 1: Left Rail (Valuation, Metrics, Converter, Compact Treasuries & Global Rates) */}
          <aside className="cg-col-left" id="left-rail">
            <CoinGeckoLeftRail
              coin={c}
              currentPrice={currentPrice}
              priceChange24h={priceChange24h}
              high24={high24}
              low24={low24}
              volume24={volume24}
              tickFlash={tickFlash}
              isWatchlisted={isWatchlisted}
              onToggleWatchlist={toggleWatchlist}
            />

            {/* Treasuries Summary & Institutional Holdings Card on Left */}
            <div id="treasuries" className="cg-left-section">
              <CoinDetailTreasuries
                coin={c}
                currentPrice={currentPrice}
                isCompact={true}
                onExploreClick={() => {
                  setActiveMainTab("treasuries");
                  const el = document.getElementById("treasuries-full");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              />
            </div>

            {/* Global Localized Currency Exchange Rates Table on Left */}
            <div id="global-prices" className="cg-left-section">
              <CoinDetailGlobalPrices coin={c} currentPrice={currentPrice} isCompact={true} />
            </div>
          </aside>

          {/* Column 2: Middle Area (Promo Ad, Chart, Horizon Returns, AI Synthesis, Live Markets Table, About) */}
          <main className="cg-col-middle" id="middle-content">
            <CoinGeckoChartArea
              coin={c}
              currentPrice={currentPrice}
              points={points}
              days={days}
              onSelectDays={setDays}
              activeMainTab={activeMainTab}
              onSelectMainTab={setActiveMainTab}
            />

            {/* Helpful Content Feedback Bar */}
            <div className="cg-feedback-bar">
              <span className="cg-feedback-label">Do you find the content above helpful?</span>
              <div className="cg-feedback-actions">
                <button
                  type="button"
                  className={`cg-feedback-btn ${feedback === "yes" ? "active" : ""}`}
                  onClick={() => setFeedback("yes")}
                  title="Helpful"
                >
                  👍
                </button>
                <button
                  type="button"
                  className={`cg-feedback-btn ${feedback === "no" ? "active" : ""}`}
                  onClick={() => setFeedback("no")}
                  title="Not helpful"
                >
                  👎
                </button>
              </div>
            </div>

            {/* Real-Time Coin Markets Section (takes center stage in middle!) */}
            <section id="markets" className="cg-middle-section">
              <CoinDetailMarkets coin={c} currentPrice={currentPrice} />
            </section>

            {/* Full Expanded Treasuries Table Section in Middle */}
            <section id="treasuries-full" className="cg-middle-section">
              <CoinDetailTreasuries
                coin={c}
                currentPrice={currentPrice}
                isCompact={false}
              />
            </section>
          </main>

          {/* Column 3: Right Rail (Insights, Market Catalyst, Live News Timeline, Featured News, Crypto Guides) */}
          <aside className="cg-col-right" id="right-rail">
            {/* Insights & Market Catalyst Card & Live News Timeline */}
            <CoinGeckoRightRail coin={c} />

            {/* Coin Latest News Featured Cards Section on Right */}
            <section id="news" className="cg-right-section">
              <CoinDetailNews coin={c} />
            </section>

            {/* Coin Editorial Guides Section on Right */}
            <section id="guides" className="cg-right-section">
              <CoinDetailGuides coin={c} />
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

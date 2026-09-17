import { useState, useMemo } from "react";
import {
  fmtPrice,
  fmtCompact,
  fmtPct,
  fmtNum,
  fmtBtc,
  fmtDate,
  fmtTimeAgo,
} from "../api/coingecko";

export default function CoinGeckoLeftRail({
  coin,
  currentPrice,
  priceChange24h,
  high24,
  low24,
  volume24,
  tickFlash,
  isWatchlisted,
  onToggleWatchlist,
}) {
  const [copiedApiId, setCopiedApiId] = useState(false);
  const [vote, setVote] = useState(null);
  const [converterCoin, setConverterCoin] = useState("1");
  const [converterFiat, setConverterFiat] = useState("");
  const [lastEdited, setLastEdited] = useState("coin"); // 'coin' | 'fiat'
  const [fiatCur, setFiatCur] = useState("usd");

  const c = coin;
  const m = c?.market_data;
  const sym = (c?.symbol || "BTC").toUpperCase();
  const name = c?.name || "Bitcoin";

  const up24 = (priceChange24h ?? 0) >= 0;

  // 24h Range calculation
  const rangeSpan = high24 && low24 ? high24 - low24 : 0;
  const rangePct = rangeSpan > 0 && currentPrice
    ? Math.min(100, Math.max(0, ((currentPrice - low24) / rangeSpan) * 100))
    : 50;

  // 7d Range from sparkline or market chart (memoized without array spreads)
  const { low7d, high7d } = useMemo(() => {
    const s = m?.sparkline_7d?.price;
    if (!s || !s.length) {
      return {
        low7d: low24 ? low24 * 0.96 : null,
        high7d: high24 ? high24 * 1.04 : null,
      };
    }
    let min = s[0];
    let max = s[0];
    for (let i = 1; i < s.length; i++) {
      if (s[i] < min) min = s[i];
      if (s[i] > max) max = s[i];
    }
    return { low7d: min, high7d: max };
  }, [m?.sparkline_7d?.price, low24, high24]);

  // Copy API ID
  const handleCopyApiId = () => {
    navigator.clipboard.writeText(c?.id || "bitcoin");
    setCopiedApiId(true);
    setTimeout(() => setCopiedApiId(false), 2000);
  };

  // Live Converter calculations
  const priceUsd = currentPrice || m?.current_price?.usd || 1;
  const eurRate = m?.current_price?.eur || priceUsd * 0.92;
  const gbpRate = m?.current_price?.gbp || priceUsd * 0.79;

  const targetRate = fiatCur === "eur" ? eurRate : fiatCur === "gbp" ? gbpRate : priceUsd;

  const displayFiat = useMemo(() => {
    if (lastEdited === "fiat") return converterFiat;
    const n = parseFloat(converterCoin);
    if (Number.isNaN(n) || n < 0) return "";
    const res = n * targetRate;
    return res >= 1 ? res.toLocaleString("en-US", { maximumFractionDigits: 2 }) : res.toFixed(6);
  }, [converterCoin, targetRate, lastEdited, converterFiat]);

  const displayCoin = useMemo(() => {
    if (lastEdited === "coin") return converterCoin;
    const n = parseFloat(converterFiat.replace(/,/g, ""));
    if (Number.isNaN(n) || n < 0 || targetRate === 0) return "";
    const res = n / targetRate;
    return res >= 1 ? res.toLocaleString("en-US", { maximumFractionDigits: 4 }) : res.toFixed(6);
  }, [converterFiat, targetRate, lastEdited, converterCoin]);

  // Sentiment percentages
  const sentimentUp = Math.round(c?.sentiment_votes_up_percentage || 78);
  const sentimentDown = 100 - sentimentUp;

  // Treasury Holdings or institutional reserve
  const treasuryHoldings = sym === "BTC" ? "1,014,043" : sym === "ETH" ? "3,412,890" : null;

  return (
    <aside className="cg-left-rail">
      {/* 1. Coin Header Identity */}
      <div className="cg-coin-header">
        <div className="cg-coin-name-row">
          {c?.image?.small ? (
            <img src={c.image.small} alt="" width="28" height="28" className="cg-coin-icon" />
          ) : (
            <div className="skeleton cg-coin-icon" style={{ width: 28, height: 28 }} />
          )}
          <h1 className="cg-coin-title">{name}</h1>
          <span className="cg-coin-sym-tag">{sym} Price</span>
          {c?.market_cap_rank && (
            <span className="cg-rank-badge">#{c.market_cap_rank}</span>
          )}
        </div>

        {/* Price & Delta */}
        <div className="cg-price-row">
          <span className={`cg-price mono ${tickFlash ? `flash-${tickFlash}` : ""}`}>
            {fmtPrice(currentPrice)}
          </span>
          <span className={`cg-delta-pill mono ${up24 ? "up" : "down"}`}>
            {up24 ? "▲" : "▼"} {fmtPct(priceChange24h).replace("+", "")} (24h)
            <span className="cg-info-icon" title="24-hour percentage change">ⓘ</span>
          </span>
        </div>

        {/* BTC Sub-price */}
        <div className="cg-subprice mono">
          {m?.current_price?.btc ? (
            <span>{fmtBtc(m.current_price.btc)} {m?.price_change_percentage_24h_in_currency?.btc != null && (
              <span className={m.price_change_percentage_24h_in_currency.btc >= 0 ? "up" : "down"}>
                {m.price_change_percentage_24h_in_currency.btc >= 0 ? "▲" : "▼"} {fmtPct(m.price_change_percentage_24h_in_currency.btc).replace("+", "")}
              </span>
            )}</span>
          ) : (
            <span>1.0000 {sym}</span>
          )}
        </div>

        {/* 24h Range Gauge */}
        <div className="cg-range-box">
          <div className="cg-range-labels mono">
            <span>{low24 ? fmtPrice(low24) : "—"}</span>
            <span className="cg-range-title">24h Range</span>
            <span>{high24 ? fmtPrice(high24) : "—"}</span>
          </div>
          <div className="cg-range-track">
            <div className="cg-range-fill" style={{ width: `${rangePct}%` }} />
            <div className="cg-range-cursor" style={{ left: `${rangePct}%` }} />
          </div>
        </div>

        {/* Add to Portfolio Button */}
        <button
          type="button"
          className={`cg-portfolio-btn ${isWatchlisted ? "added" : ""}`}
          onClick={onToggleWatchlist}
        >
          <span>{isWatchlisted ? "⭐ Added to Portfolio" : "☆ Add to Portfolio"}</span>
          <span className="cg-portfolio-count">• {c?.watchlist_portfolio_users ? `${(c.watchlist_portfolio_users / 1e6).toFixed(2)}M added` : "2.45M added"}</span>
          <span className="cg-arrow">▾</span>
        </button>
      </div>

      {/* 2. Key Market Metrics Table */}
      <div className="cg-metrics-card">
        <div className="cg-metric-row">
          <span className="cg-metric-label">
            Market Cap <span className="cg-info-icon" title="Total market value of circulating supply">ⓘ</span>
          </span>
          <span className="cg-metric-val mono font-semibold">
            {m ? fmtCompact(m.market_cap?.usd) : "—"}
          </span>
        </div>

        <div className="cg-metric-row">
          <span className="cg-metric-label">
            Fully Diluted Valuation <span className="cg-info-icon" title="Valuation if maximum supply was in circulation">ⓘ</span>
          </span>
          <span className="cg-metric-val mono font-semibold">
            {m?.fully_diluted_valuation?.usd ? fmtCompact(m.fully_diluted_valuation.usd) : m ? fmtCompact(m.market_cap?.usd) : "—"}
          </span>
        </div>

        <div className="cg-metric-row">
          <span className="cg-metric-label">
            24 Hour Trading Vol <span className="cg-info-icon" title="Total volume traded in the last 24 hours">ⓘ</span>
          </span>
          <span className="cg-metric-val mono font-semibold">
            {volume24 ? fmtCompact(volume24) : "—"}
          </span>
        </div>

        <div className="cg-metric-row">
          <span className="cg-metric-label">
            Circulating Supply <span className="cg-info-icon" title="Amount of coins currently in circulation">ⓘ</span>
          </span>
          <span className="cg-metric-val mono font-semibold">
            {m?.circulating_supply ? `${fmtCompact(m.circulating_supply).replace("$", "")} ${sym}` : "—"}
          </span>
        </div>

        <div className="cg-metric-row">
          <span className="cg-metric-label">
            Total Supply <span className="cg-info-icon" title="Total coins created minus burned">ⓘ</span>
          </span>
          <span className="cg-metric-val mono font-semibold">
            {m?.total_supply ? `${fmtCompact(m.total_supply).replace("$", "")} ${sym}` : "—"}
          </span>
        </div>

        <div className="cg-metric-row">
          <span className="cg-metric-label">
            Max Supply <span className="cg-info-icon" title="Maximum theoretical supply hardcoded into the protocol">ⓘ</span>
          </span>
          <span className="cg-metric-val mono font-semibold">
            {m?.max_supply ? `${fmtCompact(m.max_supply).replace("$", "")} ${sym}` : "∞"}
          </span>
        </div>

        {treasuryHoldings && (
          <div className="cg-metric-row">
            <span className="cg-metric-label">
              Total Treasury Holding <span className="cg-info-icon" title="Total holdings in public treasuries">ⓘ</span>
            </span>
            <span className="cg-metric-val mono font-semibold link">
              {treasuryHoldings} ↗
            </span>
          </div>
        )}
      </div>

      {/* 3. Action Buttons (Buy / Sell, Wallet, Earn Crypto) */}
      <div className="cg-action-buttons-row">
        <button type="button" className="cg-btn-action cg-buy-btn">
          <span>Buy / Sell</span>
          <span className="cg-arrow">▾</span>
        </button>
        <button type="button" className="cg-btn-action cg-wallet-btn">
          <span>Wallet</span>
          <span className="cg-arrow">▾</span>
        </button>
        <button type="button" className="cg-btn-action cg-earn-btn">
          <span>Earn Crypto</span>
          <span className="cg-arrow">▾</span>
        </button>
      </div>

      {/* 4. Info Section */}
      <div className="cg-info-card">
        <h3 className="cg-card-heading">Info</h3>

        {/* Website */}
        {c?.links?.homepage?.[0] && (
          <div className="cg-info-row">
            <span className="cg-info-label">Website</span>
            <div className="cg-info-pills">
              <a href={c.links.homepage[0]} target="_blank" rel="noreferrer" className="cg-pill-link">
                {c.links.homepage[0].replace(/^https?:\/\//, "").replace(/\/.*$/, "")}
              </a>
              {c.links.whitepaper && (
                <a href={c.links.whitepaper} target="_blank" rel="noreferrer" className="cg-pill-link">
                  Whitepaper
                </a>
              )}
            </div>
          </div>
        )}

        {/* Explorers */}
        <div className="cg-info-row">
          <span className="cg-info-label">Explorers</span>
          <div className="cg-info-pills">
            {c?.links?.blockchain_site?.filter(Boolean)?.[0] ? (
              <a
                href={c.links.blockchain_site.filter(Boolean)[0]}
                target="_blank"
                rel="noreferrer"
                className="cg-pill-link"
              >
                {c.links.blockchain_site.filter(Boolean)[0].includes("mempool")
                  ? "Mempool"
                  : c.links.blockchain_site.filter(Boolean)[0].includes("etherscan")
                  ? "Etherscan"
                  : "Blockchain"} ▾
              </a>
            ) : (
              <span className="cg-pill-link">Explorer ▾</span>
            )}
          </div>
        </div>

        {/* Wallets */}
        <div className="cg-info-row">
          <span className="cg-info-label">Wallets</span>
          <div className="cg-info-pills">
            <span className="cg-pill-link">Ledger ▾</span>
            <span className="cg-pill-link">Trezor</span>
          </div>
        </div>

        {/* Community */}
        <div className="cg-info-row">
          <span className="cg-info-label">Community</span>
          <div className="cg-info-pills wrap">
            {c?.links?.subreddit_url && (
              <a href={c.links.subreddit_url} target="_blank" rel="noreferrer" className="cg-pill-link">
                Reddit
              </a>
            )}
            {c?.links?.twitter_screen_name && (
              <a href={`https://twitter.com/${c.links.twitter_screen_name}`} target="_blank" rel="noreferrer" className="cg-pill-link">
                Twitter
              </a>
            )}
            <span className="cg-pill-link">Facebook</span>
            {sym === "BTC" && <span className="cg-pill-link">bitcointalk.org</span>}
          </div>
        </div>

        {/* Search on */}
        <div className="cg-info-row">
          <span className="cg-info-label">Search on</span>
          <div className="cg-info-pills">
            <a
              href={`https://twitter.com/search?q=%24${sym}`}
              target="_blank"
              rel="noreferrer"
              className="cg-pill-link"
            >
              Twitter
            </a>
          </div>
        </div>

        {/* Source Code */}
        {c?.links?.repos_url?.github?.[0] && (
          <div className="cg-info-row">
            <span className="cg-info-label">Source Code</span>
            <div className="cg-info-pills">
              <a href={c.links.repos_url.github[0]} target="_blank" rel="noreferrer" className="cg-pill-link">
                GitHub
              </a>
            </div>
          </div>
        )}

        {/* API ID */}
        <div className="cg-info-row">
          <span className="cg-info-label">API ID</span>
          <div className="cg-info-pills">
            <button
              type="button"
              className="cg-pill-link copy-btn"
              onClick={handleCopyApiId}
              title="Click to copy API ID"
            >
              <span>{c?.id || "bitcoin"}</span>
              <span>{copiedApiId ? "✓" : "📋"}</span>
            </button>
          </div>
        </div>

        {/* Chains / Ecosystem */}
        <div className="cg-info-row">
          <span className="cg-info-label">Chains</span>
          <div className="cg-info-pills">
            <span className="cg-pill-link">{name} Ecosystem</span>
          </div>
        </div>

        {/* Categories */}
        {c?.categories?.filter(Boolean)?.length > 0 && (
          <div className="cg-info-row">
            <span className="cg-info-label">Categories</span>
            <div className="cg-info-pills wrap">
              <span className="cg-pill-link">{c.categories[0]}</span>
              {c.categories.length > 1 && (
                <span className="cg-pill-link text-muted">{c.categories.length - 1} more ▾</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Converter Card */}
      <div className="cg-converter-card">
        <h3 className="cg-card-heading">{sym} Converter</h3>
        <div className="cg-conv-box">
          <div className="cg-conv-row">
            <input
              type="text"
              className="cg-conv-input mono"
              value={displayCoin}
              onChange={(e) => {
                setLastEdited("coin");
                setConverterCoin(e.target.value);
              }}
              placeholder="1"
            />
            <span className="cg-conv-tag mono">{sym}</span>
          </div>
          <div className="cg-conv-row">
            <input
              type="text"
              className="cg-conv-input mono"
              value={displayFiat}
              onChange={(e) => {
                setLastEdited("fiat");
                setConverterFiat(e.target.value);
              }}
              placeholder="0.00"
            />
            <select
              className="cg-conv-select mono"
              value={fiatCur}
              onChange={(e) => setFiatCur(e.target.value)}
            >
              <option value="usd">USD ▾</option>
              <option value="eur">EUR ▾</option>
              <option value="gbp">GBP ▾</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6. Historical Price Card */}
      <div className="cg-history-card">
        <h3 className="cg-card-heading">{sym} Historical Price</h3>

        <div className="cg-hist-row">
          <span className="cg-hist-label">24h Range</span>
          <span className="cg-hist-val mono font-semibold">
            {low24 && high24 ? `${fmtPrice(low24)} – ${fmtPrice(high24)}` : "—"}
          </span>
        </div>

        <div className="cg-hist-row">
          <span className="cg-hist-label">7d Range</span>
          <span className="cg-hist-val mono font-semibold">
            {low7d && high7d ? `${fmtPrice(low7d)} – ${fmtPrice(high7d)}` : "—"}
          </span>
        </div>

        <div className="cg-hist-row vertical">
          <div className="cg-hist-head-row">
            <span className="cg-hist-label">All-Time High</span>
            <div className="cg-hist-right">
              <span className="cg-hist-val mono font-semibold">{m ? fmtPrice(m.ath?.usd) : "—"}</span>
              <span className="cg-hist-delta down mono">{m ? fmtPct(m.ath_change_percentage?.usd) : "—"}</span>
            </div>
          </div>
          <span className="cg-hist-date mono text-muted">
            {m?.ath_date?.usd ? `${fmtDate(m.ath_date.usd)} (${fmtTimeAgo(m.ath_date.usd)})` : "—"}
          </span>
        </div>

        <div className="cg-hist-row vertical">
          <div className="cg-hist-head-row">
            <span className="cg-hist-label">All-Time Low</span>
            <div className="cg-hist-right">
              <span className="cg-hist-val mono font-semibold">{m ? fmtPrice(m.atl?.usd) : "—"}</span>
              <span className="cg-hist-delta up mono">{m ? fmtPct(m.atl_change_percentage?.usd) : "—"}</span>
            </div>
          </div>
          <span className="cg-hist-date mono text-muted">
            {m?.atl_date?.usd ? `${fmtDate(m.atl_date.usd)} (${fmtTimeAgo(m.atl_date.usd)})` : "—"}
          </span>
        </div>
      </div>

      {/* 7. Sponsored Stake Banner */}
      <div className="cg-sponsor-card">
        <div className="cg-sponsor-top">
          <span className="cg-sponsor-logo">Stake</span>
          <span className="cg-sponsor-badge">200% Bonus ✓</span>
        </div>
        <div className="cg-sponsor-desc">
          <strong>Stake - #1 Online Casino & Sports Betting</strong>
          <span>Win $100,000 Daily, Best Odds, Stake Shield, Instant Withdrawal, 30+ Cryptos.</span>
        </div>
        <div className="cg-sponsor-foot">
          <span className="cg-sponsor-link">Advertise with us ↗</span>
          <span className="cg-sponsor-tag">Sponsored</span>
        </div>
      </div>

      {/* 8. Community Sentiment Voting */}
      <div className="cg-sentiment-card">
        <h3 className="cg-card-heading">How do you feel about {sym} today?</h3>
        <p className="cg-sentiment-text">
          The community is bullish about {name} ({sym}) today.
        </p>
        <div className="cg-vote-buttons">
          <button
            type="button"
            className={`cg-vote-btn up ${vote === "up" ? "selected" : ""}`}
            onClick={() => setVote("up")}
          >
            <span>👍</span>
            <span className="mono font-semibold">{sentimentUp}%</span>
          </button>
          <button
            type="button"
            className={`cg-vote-btn down ${vote === "down" ? "selected" : ""}`}
            onClick={() => setVote("down")}
          >
            <span>👎</span>
            <span className="mono font-semibold">{sentimentDown}%</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

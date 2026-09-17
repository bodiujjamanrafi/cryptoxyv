import { useState } from "react";

export default function CoinDetailGuides({ coin }) {
  const [expanded, setExpanded] = useState(false);
  const name = coin?.name || "Bitcoin";
  const sym = (coin?.symbol || "BTC").toUpperCase();

  const guides = [
    {
      id: "g1",
      category: "Guides",
      title: `${name} Price Predictions 2026: Analysts Forecast $38K to $250K`,
      bannerText: `${name} Price Predictions: What Analysts Are Forecasting for 2026`,
      bannerBg: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
      bannerTextColor: "#1f1704",
      source: "CoinGecko",
      rating: "⭐ 4.62 (21 votes)",
      url: "https://www.coingecko.com/learn",
    },
    {
      id: "g2",
      category: "Reports",
      title: `2026 Q2 Crypto Industry Report`,
      bannerText: `2026 Q2 Crypto Industry Report`,
      hasGecko: true,
      bannerBg: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
      bannerTextColor: "#ffffff",
      source: "CoinGecko",
      rating: "⭐ 4.1 (42 votes)",
      url: "https://www.coingecko.com/reports",
    },
    {
      id: "g3",
      category: "Coverage",
      title: `What Are Crypto Narratives? Top 10 Narratives for 2026 (UPDATED)`,
      bannerText: `Top Crypto Narratives for 2026`,
      bannerBg: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
      bannerTextColor: "#ffffff",
      source: "CoinGecko",
      rating: "⭐ 4.27 (280 votes)",
      url: "https://www.coingecko.com/learn",
    },
    {
      id: "g4",
      category: "Coverage",
      title: `Why Strategy Sold $216M in ${name}: Rebuilding the Reserve Behind STRC's Dividends`,
      bannerText: `Why Strategy Sold $216M in ${name}: Rebuilding the Reserve Behind STRC's Dividends`,
      hasGecko: true,
      bannerBg: "linear-gradient(135deg, #831843 0%, #701a75 100%)",
      bannerTextColor: "#ffffff",
      source: "Loke Choon Khei",
      rating: "⭐ 4.0 (2 votes)",
      url: "https://www.coingecko.com/learn",
    },
    {
      id: "g5",
      category: "Guides",
      title: `Hardware Wallet Security Handbook: How to Self-Custody ${name}`,
      bannerText: `Hardware Wallet Security: The Definitive Self-Custody Guide`,
      bannerBg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
      bannerTextColor: "#ffffff",
      source: "CoinGecko",
      rating: "⭐ 4.88 (310 votes)",
      url: "https://www.coingecko.com/learn",
    },
    {
      id: "g6",
      category: "Research",
      title: `Proof of Work vs Proof of Stake: Efficiency & Finality Breakdown`,
      bannerText: `PoW vs PoS: Network Security & Decentralization Metrics`,
      bannerBg: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
      bannerTextColor: "#ffffff",
      source: "CoinGecko Research",
      rating: "⭐ 4.75 (145 votes)",
      url: "https://www.coingecko.com/research",
    },
  ];

  const displayed = expanded ? guides : guides.slice(0, 4);

  return (
    <div className="cg-sec-block" id="guides">
      <div className="cg-sec-header-row">
        <div>
          <h2 className="cg-sec-title">{name} Guides</h2>
        </div>
      </div>

      <div className="cg-guides-grid">
        {displayed.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cg-guide-card"
          >
            <div
              className="cg-guide-banner"
              style={{
                background: item.bannerBg,
                color: item.bannerTextColor,
              }}
            >
              <span className="cg-guide-banner-logo">🦎 coingecko</span>
              <span className="cg-guide-banner-text font-bold">{item.bannerText}</span>
              {item.hasGecko && <span className="cg-guide-mascot">🦎</span>}
            </div>

            <div className="cg-guide-body">
              <span className="cg-guide-category text-muted font-semibold">{item.category}</span>
              <h3 className="cg-guide-title">{item.title}</h3>
              <div className="cg-guide-meta-row">
                <span className="cg-guide-author text-muted">{item.source}</span>
                <span className="cg-guide-rating mono">{item.rating}</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="cg-sec-footer-btn-wrap">
        <button
          type="button"
          className="cg-outline-action-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      </div>
    </div>
  );
}

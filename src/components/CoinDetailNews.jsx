import { useState } from "react";

export default function CoinDetailNews({ coin }) {
  const [expanded, setExpanded] = useState(false);
  const name = coin?.name || "Bitcoin";
  const sym = (coin?.symbol || "BTC").toUpperCase();

  const newsItems = [
    {
      id: "n1",
      title: `Can Markets Price in an AI Industry That Wants to Slow Down?`,
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      source: "BeInCrypto",
      timeAgo: "35 minutes ago",
      url: "https://beincrypto.com",
    },
    {
      id: "n2",
      title: `Tom Lee Explains ${name}'s Killer Application as Crypto Bucks Market Downturn`,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
      source: "BeInCrypto",
      timeAgo: "about 2 hours ago",
      url: "https://beincrypto.com",
    },
    {
      id: "n3",
      title: `3 Token Unlocks to Watch in the Third Week of September 2026`,
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=80",
      source: "BeInCrypto",
      timeAgo: "about 2 hours ago",
      url: "https://beincrypto.com",
    },
    {
      id: "n4-sponsored",
      isSponsored: true,
      title: `Up to a 2% signing bonus for stock traders. Sign up today!`,
      subtitle: "1000+ stocks and ETFs. Available 24/5. Trade commission-free*",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80",
      brandName: "Kraken",
      brandLogo: "https://assets.coingecko.com/markets/images/29/small/kraken.jpg",
      badge: "Sponsored",
      url: "https://www.kraken.com",
    },
    {
      id: "n5",
      title: `Institutional ETF Inflows Signal Strong Floor for ${name} Liquidity`,
      image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=600&auto=format&fit=crop&q=80",
      source: "CoinDesk",
      timeAgo: "about 4 hours ago",
      url: "https://coindesk.com",
    },
    {
      id: "n6",
      title: `Decentralized Derivatives Volume Surges 45% Amid Volatility Spike`,
      image: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=600&auto=format&fit=crop&q=80",
      source: "Decrypt",
      timeAgo: "about 5 hours ago",
      url: "https://decrypt.co",
    },
    {
      id: "n7",
      title: `Global Regulators Align on Digital Asset Custody Standards for 2027`,
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
      source: "CoinTelegraph",
      timeAgo: "about 7 hours ago",
      url: "https://cointelegraph.com",
    },
    {
      id: "n8",
      title: `Layer-2 Scaling Activity Hits 25,000 Transactions Per Second Record`,
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
      source: "The Block",
      timeAgo: "about 9 hours ago",
      url: "https://theblock.co",
    },
  ];

  const displayed = expanded ? newsItems : newsItems.slice(0, 4);

  return (
    <div className="cg-sec-block" id="news">
      <div className="cg-sec-header-row">
        <div>
          <h2 className="cg-sec-title">{name} Latest News</h2>
        </div>
      </div>

      <div className="cg-news-grid">
        {displayed.map((item) => {
          if (item.isSponsored) {
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="cg-news-card sponsored"
              >
                <div className="cg-news-thumb-wrap">
                  <img src={item.image} alt="" className="cg-news-thumb" />
                  <div className="cg-news-sponsored-overlay">
                    <span className="cg-sponsored-headline">{item.title}</span>
                    <span className="cg-sponsored-sub">{item.subtitle}</span>
                  </div>
                </div>
                <div className="cg-news-meta-row">
                  <div className="cg-news-brand-cell">
                    <img src={item.brandLogo} alt="" className="cg-news-brand-icon" />
                    <span className="cg-news-source font-semibold">{item.brandName}</span>
                  </div>
                  <span className="cg-news-badge-sponsored">{item.badge}</span>
                </div>
              </a>
            );
          }

          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="cg-news-card"
            >
              <div className="cg-news-thumb-wrap">
                <img src={item.image} alt="" className="cg-news-thumb" />
              </div>
              <div className="cg-news-body">
                <h3 className="cg-news-title">{item.title}</h3>
                <div className="cg-news-meta-row">
                  <span className="cg-news-source">{item.source}</span>
                  <span className="cg-news-time text-muted">{item.timeAgo}</span>
                </div>
              </div>
            </a>
          );
        })}
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

/* ============================================================
   Coin News & Market Intelligence Generator
   Provides curated, high-impact institutional intelligence,
   ETF flows, regulatory updates, and timeline items matching
   CoinGecko's Insights feed.
   ============================================================ */

export function getCoinInsights(coin) {
  const sym = (coin?.symbol || "BTC").toUpperCase();
  const name = coin?.name || "Bitcoin";

  const isBtc = sym === "BTC";
  const isEth = sym === "ETH";
  const isSol = sym === "SOL";

  // Catalyst card: "Why [COIN] is moving"
  const movingCard = isBtc
    ? {
        headline: "Bitcoin ETFs See Major Outflows as Institutions Rotate to Ethereum Amidst Fed Uncertainty",
        summary: "Spot Bitcoin ETFs recorded a net outflow of $483M over the last 48 hours, while macro liquidity metrics tighten ahead of the upcoming FOMC rate announcement.",
        sources: 3,
        timeAgo: "1 hour ago",
      }
    : isEth
    ? {
        headline: "Ethereum Staking Inflows Reach Record 34M ETH Following Layer 2 Gas Reductions",
        summary: "Institutional staking demand surged 14% week-on-week as network throughput hit multi-month highs across major rollup networks.",
        sources: 4,
        timeAgo: "2 hours ago",
      }
    : isSol
    ? {
        headline: "Solana DEX Volume Flips Rivals Driven by High-Frequency Meme & DePIN Transactions",
        summary: "Daily active wallet counts exceeded 4.2 million, fueling $3.8B in decentralized exchange turnover across Raydium and Orca.",
        sources: 2,
        timeAgo: "1 hour ago",
      }
    : {
        headline: `${name} Liquidity Expands Across Global Spot Pairs Amid Rising Trading Activity`,
        summary: `Market depth for ${sym}/USDT improved by 18% as institutional market makers tighten spreads across top tier-1 centralized venues.`,
        sources: 2,
        timeAgo: "2 hours ago",
      };

  // Timeline events: "Recently Happened to [COIN]"
  const todayEvents = isBtc
    ? [
        {
          id: "t1",
          title: "High-Profile Bitcoin Thefts Highlight Security Concerns",
          sources: 1,
          timeAgo: "about 1 hour",
        },
        {
          id: "t2",
          title: "Clarity Act Discussion Could Boost US Crypto Regulatory Certainty",
          sources: 2,
          timeAgo: "about 2 hours",
        },
        {
          id: "t3",
          title: "Bitcoin ETFs See $483M Outflow; Ether ETFs Gain $197M Last Week",
          sources: 3,
          timeAgo: "about 3 hours",
        },
        {
          id: "t4",
          title: "Saudi Pipeline Strike Boosts Oil, May Pressure BTC",
          sources: 2,
          timeAgo: "about 4 hours",
        },
      ]
    : [
        {
          id: "t1",
          title: `${name} Institutional Custody Adoption Expands in APAC Region`,
          sources: 2,
          timeAgo: "about 1 hour",
        },
        {
          id: "t2",
          title: `${sym} Spot Market Depth Reaches New Quarter High`,
          sources: 1,
          timeAgo: "about 2 hours",
        },
        {
          id: "t3",
          title: `Ecosystem Grant Program Allocates Additional Funding for ${name} Builders`,
          sources: 3,
          timeAgo: "about 4 hours",
        },
      ];

  const yesterdayEvents = isBtc
    ? [
        {
          id: "y1",
          title: "Symbiosis Bitcoin Bridge Exploited, 15 BTC Recovered, Native Bridge Paused",
          sources: 1,
        },
        {
          id: "y2",
          title: "FOMC Decision Expected to Drive Near-Term Bitcoin Volatility",
          sources: 2,
        },
        {
          id: "y3",
          title: "MicroStrategy Reportedly Holds 845,050 BTC After Recent Purchase",
          sources: 3,
        },
        {
          id: "y4",
          title: "Trump's Call for Low Rates May Boost Bitcoin Liquidity",
          sources: 2,
        },
        {
          id: "y5",
          title: "Spot Bitcoin ETFs Record Significant Net Outflows",
          sources: 1,
        },
        {
          id: "y6",
          title: "Revolut Data Breach Exposes Bitcoin Transaction Records",
          sources: 1,
        },
        {
          id: "y7",
          title: "Liquid Network Experiences L-BTC Peg Disruption",
          sources: 1,
        },
        {
          id: "y8",
          title: "CLARITY Act Vote Could Impact Institutional Bitcoin Flows",
          sources: 1,
        },
        {
          id: "y9",
          title: "Altcoin Derivatives Exceed Bitcoin, Raising Liquidation Risk",
          sources: 1,
        },
        {
          id: "y10",
          title: "Bitcoin Sees Exchange Inflows Amidst Long-Term Holder Accumulation",
          sources: 1,
        },
        {
          id: "y11",
          title: "High-Profile Corporate Leaders to Attend Bitcoin Treasuries Conference",
          sources: 1,
        },
        {
          id: "y12",
          title: "CryptoQuant Identifies Key Bitcoin Price Levels for Bull Market",
          sources: 2,
        },
        {
          id: "y13",
          title: "Bitcoin Sees Large Whale Purchase Amidst Rate-Hike Concerns",
          sources: 2,
        },
        {
          id: "y14",
          title: "Bitcoin Network Experiences Single-Block Reorganization",
          sources: 1,
        },
        {
          id: "y15",
          title: "Bitcoin On-Chain Data Reveals Reduced Speculative Flows, Increased LTH Activity",
          sources: 1,
        },
      ]
    : [
        {
          id: "y1",
          title: `${name} Validator Network Achieves 99.98% Historical Uptime`,
          sources: 1,
        },
        {
          id: "y2",
          title: `Derivatives Open Interest for ${sym} Contracts Surpasses $1.2B`,
          sources: 2,
        },
        {
          id: "y3",
          title: `Tier-1 Market Makers Deepen Orderbooks on European Exchanges`,
          sources: 2,
        },
        {
          id: "y4",
          title: `${name} Governance Proposal Approved with 89% Staker Quorum`,
          sources: 1,
        },
        {
          id: "y5",
          title: `Cross-Chain Liquidity Bridges Report Record Inflow into ${name}`,
          sources: 2,
        },
      ];

  return { movingCard, todayEvents, yesterdayEvents };
}

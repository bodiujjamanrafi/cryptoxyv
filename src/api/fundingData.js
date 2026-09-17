// Curated real-time funding rounds and macro fundraising trend data
export const RECENT_FUNDING_ROUNDS = [
  {
    id: "monad",
    name: "Monad Labs",
    round: "Series B",
    amount: "$ 225.00M",
    rawAmount: 225000000,
    date: "Apr 8",
    category: "Layer 1 · EVM",
    isNew: true,
    logoColor: "#8352ec",
    iconType: "monad",
    investors: [
      { name: "Paradigm", bg: "#10b981", text: "P" },
      { name: "Coinbase Ventures", bg: "#0052ff", text: "C" },
    ],
    additionalInvestorsCount: 3,
  },
  {
    id: "berachain",
    name: "Berachain",
    round: "Series B",
    amount: "$ 100.00M",
    rawAmount: 100000000,
    date: "Apr 1",
    category: "DeFi · L1",
    isNew: true,
    logoColor: "#c2410c",
    iconType: "berachain",
    investors: [
      { name: "Brevan Howard", bg: "#1e293b", text: "B" },
      { name: "Polychain", bg: "#e2e8f0", text: "PC", darkText: true },
    ],
    additionalInvestorsCount: 2,
  },
  {
    id: "movement",
    name: "Movement Labs",
    round: "Series A",
    amount: "$ 38.00M",
    rawAmount: 38000000,
    date: "Mar 28",
    category: "Modular · Move",
    isNew: false,
    logoColor: "#eab308",
    iconType: "movement",
    investors: [
      { name: "Binance Labs", bg: "#f3ba2f", text: "B", darkText: true },
      { name: "Polychain", bg: "#3b82f6", text: "P" },
    ],
    additionalInvestorsCount: 3,
  },
  {
    id: "hyperliquid",
    name: "Hyperliquid",
    round: "Strategic",
    amount: "$ 70.00M",
    rawAmount: 70000000,
    date: "Mar 22",
    category: "DEX · Perps",
    isNew: false,
    logoColor: "#10b981",
    iconType: "hyperliquid",
    investors: [
      { name: "Pantera Capital", bg: "#059669", text: "P" },
      { name: "Wintermute", bg: "#334155", text: "W" },
    ],
    additionalInvestorsCount: 2,
  },
  {
    id: "celestia",
    name: "Celestia",
    round: "Strategic",
    amount: "$ 100.00M",
    rawAmount: 100000000,
    date: "Feb 14",
    category: "Data Availability",
    isNew: false,
    logoColor: "#7c3aed",
    iconType: "celestia",
    investors: [
      { name: "Bain Capital Crypto", bg: "#2563eb", text: "B" },
      { name: "Placeholder", bg: "#0f172a", text: "PL" },
    ],
    additionalInvestorsCount: 2,
  },
];

export const FUNDRAISING_TREND_STATS = {
  peakMonth: {
    label: "Peak month",
    month: "Sep '25",
    amount: "$3.849B Raised",
    status: "up",
  },
  lowestMonth: {
    label: "Lowest month",
    month: "Feb '25",
    amount: "$0.698B Raised",
    status: "down",
  },
  peakRounds: {
    label: "Peak rounds",
    rounds: "131 rounds",
    period: "In Apr '26",
    status: "star",
  },
  totalTracked: {
    label: "Total tracked",
    amount: "$21.66B",
    roundsCount: "1178 Rounds",
    status: "signal",
  },
};

// 9-month historical data for dual curve visualization
export const MONTHLY_TREND_SERIES = [
  { month: "Jan", raised: 1.35, rounds: 82 },
  { month: "Feb", raised: 0.7, rounds: 68 }, // Lowest month
  { month: "Mar", raised: 1.15, rounds: 96 },
  { month: "Apr", raised: 1.85, rounds: 131 }, // Peak rounds
  { month: "May", raised: 1.38, rounds: 108 },
  { month: "Jun", raised: 2.15, rounds: 102 },
  { month: "Jul", raised: 2.45, rounds: 94 },
  { month: "Aug", raised: 3.1, rounds: 118 },
  { month: "Sep", raised: 3.85, rounds: 140 }, // Peak month
];

import { Link } from "react-router-dom";
import AsteronLogo from "./AsteronLogo";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="brand">
            <AsteronLogo size={28} />
            <span className="brand-name">Aster<span className="brand-accent">on</span></span>
          </div>
          <p className="footer-tag">
            A real-time market intelligence terminal. Live prices, charts and on-chain depth for thousands of assets.
          </p>
          <div className="pill"><span className="live-dot" /> Powered by CoinGecko</div>
        </div>

        <div className="footer-cols">
          <div className="footer-col">
            <h4>Terminal</h4>
            <Link to="/markets">Markets</Link>
            <a href="/#pulse">Market Pulse</a>
            <a href="/#security">Audits &amp; KYC</a>
            <a href="/#features">Platform</a>
          </div>
          <div className="footer-col">
            <h4>Assets</h4>
            <Link to="/coin/bitcoin">Bitcoin</Link>
            <Link to="/coin/ethereum">Ethereum</Link>
            <Link to="/coin/solana">Solana</Link>
            <Link to="/markets">All coins</Link>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <a href="https://www.coingecko.com/en/api" target="_blank" rel="noreferrer">API docs</a>
            <a href="#top">Status</a>
            <a href="#top">Methodology</a>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span className="mono">© {new Date().getFullYear()} Asteron</span>
        <span className="footer-disclaimer">Market data for information only — not financial advice.</span>
      </div>
    </footer>
  );
}

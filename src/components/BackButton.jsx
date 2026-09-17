import { useNavigate } from "react-router-dom";

/* Reusable back control for sub-pages. Goes to the previous entry
   when there is history, otherwise falls back to a safe route. */
export default function BackButton({ fallback = "/", label = "Back" }) {
  const nav = useNavigate();
  const go = () => {
    if (window.history.length > 1) nav(-1);
    else nav(fallback);
  };
  return (
    <button className="back-btn" onClick={go} aria-label="Go back" title="Go back">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      <span>{label}</span>
    </button>
  );
}

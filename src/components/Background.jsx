import { useLocation } from "react-router-dom";

/* Clean, deep obsidian background with soft vignette.
   Zero distracting vertical gridlines or transparent sidelines. */
export default function Background() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  return (
    <div className="site-bg" aria-hidden="true">
      {isHome && <div className="bg-wave" />}
      <div className="bg-vignette" />
    </div>
  );
}

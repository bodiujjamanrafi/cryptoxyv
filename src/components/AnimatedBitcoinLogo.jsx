import { useEffect, useRef } from "react";
import lottie from "lottie-web/build/player/lottie_light.js";
import btcAnimationData from "../assets/bitcoin-lottie.json";

export default function AnimatedBitcoinLogo({ size = 44, className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: btcAnimationData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
      },
    });

    anim.setSpeed(1.4);

    return () => {
      anim.destroy();
    };
  }, []);

  return (
    <div
      className={`btc-animated-logo-wrap ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
      aria-label="Bitcoin animated logo"
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "scale(1.72)",
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}

import { useRef, useEffect, useState } from "react";

export default function PromoVideoBanner({
  className = "",
  onClose = null,
  href = "https://bc.game",
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force muted and continuous inline playback for guaranteed browser autoplay
    video.muted = true;
    video.playsInline = true;
    video.loop = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Promo video autoplay note:", err);
          // Fallback retry
          video.muted = true;
          video.play().catch(() => {});
        });
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`cg-promo-video-container ${className}`}>
      <div className="cg-promo-badge">
        <span className="cg-ad-tag">Ad</span>
        <span className="cg-ad-info-dot" title="Sponsored Advertisement">ⓘ</span>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="cg-promo-video-link"
        title="Claim Special Promotional Offer"
      >
        <video
          ref={videoRef}
          className="cg-promo-video-player"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="/ads/promo-ad.mp4" type="video/mp4" />
          <source src="/ads/promo-ad.webm" type="video/webm" />
          Your browser does not support HTML5 video streaming.
        </video>
        <div className="cg-promo-overlay-glow" />
      </a>

      {onClose && (
        <button
          type="button"
          className="cg-promo-dismiss"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            if (onClose) onClose();
          }}
          title="Dismiss ad"
        >
          ✕
        </button>
      )}
    </div>
  );
}

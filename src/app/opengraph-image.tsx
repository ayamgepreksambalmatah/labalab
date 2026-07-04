import { ImageResponse } from "next/og";
import { SITE_TAGLINE } from "@/lib/site";

// Auto-wired ke og:image & twitter:image untuk seluruh situs.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = SITE_TAGLINE;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0d",
          backgroundImage:
            "radial-gradient(circle at 50% 15%, rgba(124,111,253,0.28), transparent 60%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 132,
            fontWeight: 800,
            letterSpacing: "-3px",
            backgroundImage: "linear-gradient(90deg, #7c6ffd, #a78bfa)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            display: "flex",
          }}
        >
          LabaLab
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 40,
            fontWeight: 700,
            color: "#a78bfa",
            display: "flex",
          }}
        >
          Racik Profit Toko Kamu
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 26,
            color: "#7777a0",
            maxWidth: 820,
            textAlign: "center",
            display: "flex",
          }}
        >
          AI Profit Assistant untuk seller Shopee · Tokopedia · TikTok Shop
        </div>
      </div>
    ),
    { ...size },
  );
}

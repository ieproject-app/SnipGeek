import { ImageResponse } from "next/og";

export const alt = "SnipGeek";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0c2340 100%)",
          position: "relative",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Decorative accent circle top-right */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #0797de33 0%, transparent 70%)",
          }}
        />
        {/* Decorative accent circle bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #0797de22 0%, transparent 70%)",
          }}
        />

        {/* Accent top border line */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            height: "5px",
            background: "linear-gradient(90deg, #0797de, #38bdf8, #0797de)",
          }}
        />

        {/* Logo mark - new compass/star design matching logo.svg */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          width="72"
          height="72"
          style={{
            marginBottom: "28px",
            filter: "drop-shadow(0 0 40px rgba(14, 165, 233, 0.5))",
          }}
        >
          <defs>
            <linearGradient id="sg-grad-og" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          <path
            d="M 60.87 9.43 A 42 42 0 0 1 90.57 60.87 L 53.46 52 L 79.7 79.7 A 42 42 0 0 1 20.3 79.7 L 46.54 52 L 9.43 60.87 A 42 42 0 0 1 39.13 9.43 L 50 46 Z"
            fill="none"
            stroke="url(#sg-grad-og)"
            strokeWidth="6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        {/* Site name */}
        <div
          style={{
            color: "#ffffff",
            fontSize: "72px",
            fontWeight: "900",
            letterSpacing: "-3px",
            lineHeight: 1,
            marginBottom: "16px",
          }}
        >
          SnipGeek
        </div>

        {/* Tagline */}
        <div
          style={{
            color: "#94a3b8",
            fontSize: "26px",
            fontWeight: "400",
            letterSpacing: "0.5px",
            marginBottom: "40px",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          Windows & Ubuntu · Tutorial, Tips, dan Troubleshooting
        </div>

        {/* Domain pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            paddingLeft: "20px",
            paddingRight: "20px",
            paddingTop: "10px",
            paddingBottom: "10px",
            borderRadius: "999px",
            border: "1.5px solid #0797de55",
            background: "#0797de11",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#0797de",
            }}
          />
          <span style={{ color: "#7dd3fc", fontSize: "18px", fontWeight: "500" }}>
            snipgeek.com
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}

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

        {/* Logo mark */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #0797de, #38bdf8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "28px",
            boxShadow: "0 0 40px #0797de55",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: "36px",
              fontWeight: "900",
              letterSpacing: "-2px",
            }}
          >
            S
          </span>
        </div>

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

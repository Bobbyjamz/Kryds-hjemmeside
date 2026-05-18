import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "KrydsByg — Stærke hænder til håndværk & byggeri i København";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0C0C0A",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "72px 80px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Yellow diagonal accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 420,
            height: 420,
            borderRadius: "50%",
            border: "1px solid rgba(245,196,0,0.15)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            border: "1px solid rgba(245,196,0,0.2)",
            display: "flex",
          }}
        />

        {/* Large X background */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 560,
            height: 560,
            opacity: 0.07,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="560" height="560" viewBox="0 0 90 90">
            <line x1="8" y1="8" x2="82" y2="82" stroke="#F5C400" strokeWidth="14" strokeLinecap="square" />
            <line x1="82" y1="8" x2="8" y2="82" stroke="#F2EEE6" strokeWidth="14" strokeLinecap="square" />
          </svg>
        </div>

        {/* Eyebrow */}
        <div
          style={{
            fontSize: 13,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#F5C400",
            fontWeight: 600,
            marginBottom: 20,
            display: "flex",
          }}
        >
          VIKARBUREAU · KØBENHAVN
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 0.9,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            color: "#F2EEE6",
            marginBottom: 28,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>STÆRKE</span>
          <span style={{ color: "#F5C400" }}>HÆNDER</span>
        </div>

        {/* Sub */}
        <div
          style={{
            fontSize: 22,
            color: "rgba(242,238,230,0.5)",
            fontWeight: 400,
            letterSpacing: "0.04em",
            display: "flex",
          }}
        >
          Håndværk · Byggeplads · Rengøring · Montering · Leveret inden 24t
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "#F5C400",
            display: "flex",
          }}
        />

        {/* Logo text bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            right: 80,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(242,238,230,0.3)",
            display: "flex",
          }}
        >
          krydsbyg.com
        </div>
      </div>
    ),
    { ...size }
  );
}

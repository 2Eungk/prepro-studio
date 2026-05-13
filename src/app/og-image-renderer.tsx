import { ImageResponse } from "next/og";

export const ogImageSize = {
  width: 1200,
  height: 630,
};

export function createPreProOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#030505",
          color: "#f4f4f5",
          fontFamily: "Arial, sans-serif",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 16% 10%, rgba(94,215,207,0.30), transparent 30%), radial-gradient(circle at 90% 18%, rgba(242,161,75,0.18), transparent 28%), linear-gradient(135deg, #050706 0%, #0a0f0f 52%, #050505 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 42,
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 30,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 72,
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
          <div
            style={{
              width: 92,
              height: 92,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 24,
              border: "1px solid rgba(94,215,207,0.36)",
              background: "rgba(0,0,0,0.56)",
              color: "#5ed7cf",
              fontSize: 46,
              fontWeight: 900,
            }}
          >
            P
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#5ed7cf" }}>
              PREPRO STUDIO
            </div>
            <div style={{ marginTop: 8, fontSize: 20, fontWeight: 700, color: "#8b8f92" }}>
              Film · Ad · MV · Dance · Event
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 220,
            width: 760,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 70, lineHeight: 1.02, fontWeight: 900 }}>
            Pre-production,
            <br />
            ready for set.
          </div>
          <div style={{ marginTop: 28, fontSize: 26, lineHeight: 1.35, fontWeight: 700, color: "#b6babd" }}>
            Briefs, schedules, call sheets, locations, budgets,
            <br />
            storyboards and wrap reports in one no-login BYOK tool.
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 72,
            bottom: 68,
            display: "flex",
            gap: 12,
          }}
        >
          {["BRIEF", "CALL SHEET", "STORYBOARD", "REPORT"].map((item) => (
            <div
              key={item}
              style={{
                padding: "12px 16px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.045)",
                color: "#d9dddf",
                fontSize: 15,
                fontWeight: 900,
              }}
            >
              {item}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            right: 78,
            top: 116,
            width: 250,
            height: 250,
            borderRadius: 28,
            border: "1px solid rgba(94,215,207,0.22)",
            background: "rgba(0,0,0,0.28)",
            display: "flex",
            flexDirection: "column",
            padding: 22,
            gap: 12,
          }}
        >
          {[76, 132, 102, 170, 118, 84].map((width, index) => (
            <div
              key={index}
              style={{
                width,
                height: 18,
                borderRadius: 9,
                background: index % 2 === 0 ? "rgba(94,215,207,0.72)" : "rgba(242,161,75,0.58)",
              }}
            />
          ))}
        </div>
      </div>
    ),
    ogImageSize,
  );
}

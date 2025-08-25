// src/App.jsx
import React, { useEffect, useState } from "react";

/** ---------- tiny views just to get you building ---------- */
function Header() {
  return (
    <div
      style={{
        padding: "16px 24px",
        background: "linear-gradient(90deg,#ff9a9e,#fecfef)",
        color: "#111",
        fontWeight: 700,
      }}
    >
      Top 100 Manager Profiles
    </div>
  );
}

function Landing() {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(135deg, #a78bfa 0%, #7dd3fc 60%, #f0abfc 100%)",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,.9)",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 8px 24px rgba(0,0,0,.12)",
          textAlign: "center",
          maxWidth: 560,
        }}
      >
        <h1 style={{ margin: 0 }}>Welcome 👋</h1>
        <p style={{ marginTop: 8 }}>
          Build succeeded. Replace this placeholder with your real UI.
        </p>
      </div>
    </div>
  );
}

/** ---------- single App component, single default export ---------- */
export default function App() {
  // keep a tiny effect so React is definitely running
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <>
      <Header />
      <Landing />
    </>
  );
}
import React, { useEffect, useMemo, useState } from "react";

/* -------------------- Utilities -------------------- */
const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const fmt = {
  num: (n) => (typeof n === "number" && Number.isFinite(n) ? n : 0),
  avg: (n) =>
    typeof n === "number" && Number.isFinite(n) ? n.toFixed(2) : "0.00",
};

/* -------------------- Data hook -------------------- */
function useManagers() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch("/api/managers");
        const data = await res.json();

        const clean = (Array.isArray(data) ? data : []).map((m) => {
          const id = m.id || slugify(m.name);
          const type = String(m.type || "rising").toLowerCase();
          return {
            id,
            name: m.name || "",
            club: m.club || "",
            division: m.division ?? "",
            signature: m.signature || "",
            story: m.story || "",
            careerHighlights: m.careerHighlights || "",
            favouriteFormation: m.favouriteFormation || "",
            tacticalPhilosophy: m.tacticalPhilosophy || "",
            memorableMoment: m.memorableMoment || "",
            fearedOpponent: m.fearedOpponent || "",
            ambitions: m.ambitions || "",
            type,
            points: Number(m.points || 0),
            games: Number(m.games || 0),
            avgPoints:
              m.avgPoints != null
                ? Number(m.avgPoints)
                : (Number(m.points || 0) /
                    (Number(m.games || 0) || 1)) || 0,
            // optional future: photo url
            photo: m.photo || "",
          };
        });

        // de-dupe by id
        const seen = new Set();
        const uniq = [];
        for (const row of clean) {
          if (!seen.has(row.id)) {
            seen.add(row.id);
            uniq.push(row);
          }
        }

        if (!cancelled) setManagers(uniq);
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load managers");
          setManagers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { managers, loading, err };
}

/* -------------------- Retro Card -------------------- */
function PaniniCard({ m, onOpen }) {
  const badge = (txt, bg, fg) => (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 12,
        background: bg,
        color: fg,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {txt}
    </span>
  );

  return (
    <div
      onClick={() => onOpen?.(m)}
      title="Open profile"
      style={{
        cursor: "pointer",
        userSelect: "none",
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9))",
        border: "3px solid #e5d5d5",
        borderRadius: 16,
        padding: 16,
        boxShadow:
          "0 12px 24px rgba(0,0,0,0.12), inset 0 0 0 6px #fff, inset 0 0 0 10px #f8e9e9",
        transition: "transform .15s ease, box-shadow .15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 8,
            background:
              m.photo
                ? `center / cover no-repeat url(${m.photo})`
                : "linear-gradient(135deg,#fde68a,#fca5a5)",
            border: "2px solid #e5e7eb",
            flex: "0 0 auto",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 18,
              color: "#1f2937",
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {m.name}
          </div>
          <div style={{ color: "#6b7280", fontSize: 14 }}>{m.club}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexDirection: "column" }}>
          {badge(`Div ${m.division || "—"}`, "#fde68a", "#78350f")}
          {badge((m.type || "rising").toUpperCase(), "#bfdbfe", "#1d4ed8")}
        </div>
      </div>

      {m.signature && (
        <p
          style={{
            marginTop: 12,
            fontStyle: "italic",
            color: "#374151",
            lineHeight: 1.4,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          “{m.signature}”
        </p>
      )}

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        <Stat num={fmt.num(m.points)} label="Points" color="#b91c1c" />
        <Stat num={fmt.num(m.games)} label="Games" color="#1d4ed8" />
        <Stat num={fmt.avg(m.avgPoints)} label="Avg" color="#7c2d12" />
      </div>

      <div style={{ textAlign: "center", marginTop: 10 }}>
        <span style={{ color: "#ef4444", fontWeight: 600 }}>View Profile →</span>
      </div>
    </div>
  );
}

function Stat({ num, label, color }) {
  return (
    <div
      style={{
        textAlign: "center",
        background: "#f9fafb",
        borderRadius: 8,
        padding: "8px 6px",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontWeight: 800, color }}>{num}</div>
      <div style={{ color: "#6b7280", fontSize: 12 }}>{label}</div>
    </div>
  );
}

/* -------------------- Views -------------------- */

// Home: search + random picks
function HomeView({ managers, onOpenProfile }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return managers;
    return managers.filter((m) => {
      const hay =
        `${m.name} ${m.club} ${m.careerHighlights} ${m.tacticalPhilosophy} ${m.favouriteFormation}`
          .toLowerCase();
      return hay.includes(q);
    });
  }, [managers, query]);

  // 2 random picks
  const randomTwo = useMemo(() => {
    if (managers.length <= 2) return managers;
    const idx = new Set();
    while (idx.size < 2) idx.add(Math.floor(Math.random() * managers.length));
    return [...idx].map((i) => managers[i]);
  }, [managers]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#111827" }}>
          <span role="img" aria-label="football">
            ⚽
          </span>{" "}
          Top 100 Manager Profiles
        </h1>
        <p style={{ color: "#374151" }}>
          Celebrating 25 seasons of Soccer Manager Worlds
        </p>
      </header>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <a
          href="#/request"
          style={{
            textDecoration: "none",
            background: "#ec4899",
            color: "white",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 700,
            boxShadow: "0 6px 16px rgba(236,72,153,0.35)",
          }}
        >
          ➕ Submit Your Profile
        </a>

        <input
          placeholder="🔍 Search managers, clubs, formations…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 220,
            padding: "10px 12px",
            border: "2px solid #e5e7eb",
            borderRadius: 10,
            background: "rgba(255,255,255,0.9)",
          }}
        />
      </div>

      {/* Random picks */}
      {randomTwo.length > 0 && (
        <>
          <h2 style={{ marginTop: 24, marginBottom: 10, color: "#111827" }}>
            Featured Today
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {randomTwo.map((m) => (
              <PaniniCard
                key={`feat-${m.id}`}
                m={m}
                onOpen={(mm) => (window.location.hash = `#/profile/${mm.id}`)}
              />
            ))}
          </div>
        </>
      )}

      <h2 style={{ marginTop: 28, marginBottom: 10, color: "#111827" }}>
        {filtered.length} result{filtered.length === 1 ? "" : "s"}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          paddingBottom: 40,
        }}
      >
        {filtered.map((m) => (
          <PaniniCard
            key={m.id}
            m={m}
            onOpen={(mm) => (window.location.hash = `#/profile/${mm.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

// Full profile page
function ProfileView({ manager }) {
  if (!manager) return null;

  const Row = ({ label, value }) =>
    value ? (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 800, color: "#111827" }}>{label}</div>
        <div style={{ whiteSpace: "pre-line", color: "#374151" }}>{value}</div>
      </div>
    ) : null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <button
        onClick={() => (window.location.hash = "#/")}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          marginBottom: 12,
          fontWeight: 700,
        }}
      >
        ← Back to Managers
      </button>

      <div
        style={{
          background: "rgba(255,255,255,0.95)",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 18px 48px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 10,
              background:
                manager.photo
                  ? `center / cover no-repeat url(${manager.photo})`
                  : "linear-gradient(135deg,#fde68a,#fca5a5)",
              border: "2px solid #e5e7eb",
              flex: "0 0 auto",
            }}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#111827" }}>
              {manager.name}
            </h1>
            <div style={{ color: "#6b7280" }}>{manager.club}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <Badge text={`Division ${manager.division || "—"}`} bg="#fde68a" fg="#78350f" />
          <Badge text={(manager.type || "rising").toUpperCase()} bg="#bfdbfe" fg="#1d4ed8" />
          <Badge text={`${fmt.num(manager.points)} pts`} bg="#fecaca" fg="#b91c1c" />
          <Badge text={`${fmt.num(manager.games)} games`} bg="#dbeafe" fg="#1d4ed8" />
          <Badge text={`Avg ${fmt.avg(manager.avgPoints)}`} bg="#fde2e2" fg="#7c2d12" />
        </div>

        {manager.signature && (
          <blockquote
            style={{
              margin: "0 0 16px 0",
              padding: "8px 12px",
              borderLeft: "4px solid #ec4899",
              fontStyle: "italic",
              color: "#374151",
            }}
          >
            “{manager.signature}”
          </blockquote>
        )}

        <Row label="Career Highlights" value={manager.careerHighlights} />
        <Row label="Favourite Formation" value={manager.favouriteFormation} />
        <Row label="Tactical Philosophy" value={manager.tacticalPhilosophy} />
        <Row label="Most Memorable Moment" value={manager.memorableMoment} />
        <Row label="Most Feared Opponent" value={manager.fearedOpponent} />
        <Row label="Future Ambitions" value={manager.ambitions} />
        <Row label="Top 100 Story" value={manager.story} />
      </div>
    </div>
  );
}

function Badge({ text, bg, fg }) {
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        background: bg,
        color: fg,
        fontWeight: 800,
        fontSize: 12,
      }}
    >
      {text}
    </span>
  );
}

// Request form → POST /api/profile-request
function RequestForm() {
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const payload = {
      "Manager Name": fd.get("managerName"),
      "Club Name": fd.get("clubName"),
      Division: fd.get("division"),
      "Career Highlights": fd.get("careerHighlights"),
      "Favourite Formation": fd.get("favouriteFormation"),
      "Tactical Philosophy": fd.get("tacticalPhilosophy"),
      "Most Memorable Moment": fd.get("memorableMoment"),
      "Most Feared Opponent": fd.get("fearedOpponent"),
      "Future Ambitions": fd.get("ambitions"),
      Story: fd.get("story"),
    };

    if (!payload["Manager Name"] || !payload["Club Name"]) {
      setStatus({ type: "err", msg: "Manager Name and Club Name are required." });
      return;
    }

    try {
      setSubmitting(true);
      setStatus({ type: "", msg: "" });
      const res = await fetch("/api/profile-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Submission failed");
      setStatus({ type: "ok", msg: "Thanks! Your profile is queued for publishing." });
      e.currentTarget.reset();
    } catch (err) {
      setStatus({ type: "err", msg: err?.message || "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <button
        onClick={() => (window.location.hash = "#/")}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          marginBottom: 12,
          fontWeight: 700,
        }}
      >
        ← Back to Managers
      </button>

      <form
        onSubmit={onSubmit}
        style={{
          background: "rgba(255,255,255,0.96)",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 18px 48px rgba(0,0,0,0.18)",
        }}
      >
        <h2 style={{ marginTop: 0, color: "#111827" }}>Submit Your Manager Profile</h2>

        {status.msg && (
          <div
            style={{
              margin: "12px 0",
              padding: "10px 12px",
              borderRadius: 10,
              color: status.type === "ok" ? "#065f46" : "#991b1b",
              background: status.type === "ok" ? "#d1fae5" : "#fee2e2",
            }}
          >
            {status.msg}
          </div>
        )}

        <Grid>
          <Field label="Manager Name *" name="managerName" required />
          <Field label="Club Name *" name="clubName" required />
          <Field label="Division" name="division" placeholder="1–5" />
          <Field label="Favourite Formation" name="favouriteFormation" placeholder="4-3-3" />
          <Field label="Career Highlights" name="careerHighlights" textarea />
          <Field label="Tactical Philosophy" name="tacticalPhilosophy" textarea />
          <Field label="Most Memorable Moment" name="memorableMoment" textarea />
          <Field label="Most Feared Opponent" name="fearedOpponent" />
          <Field label="Future Ambitions" name="ambitions" textarea />
          <Field label="Your Top 100 Story" name="story" textarea />
        </Grid>

        <div style={{ marginTop: 12 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: submitting ? "#9ca3af" : "#10b981",
              color: "white",
              fontWeight: 800,
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting…" : "Submit Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Grid({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, name, textarea, required, placeholder }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontWeight: 700, color: "#111827", marginBottom: 6 }}>{label}</div>
      {textarea ? (
        <textarea
          name={name}
          placeholder={placeholder}
          rows={4}
          style={inputStyle(true)}
          required={required}
        />
      ) : (
        <input
          name={name}
          placeholder={placeholder}
          style={inputStyle()}
          required={required}
        />
      )}
    </label>
  );
}

function inputStyle(multiline = false) {
  return {
    width: "100%",
    padding: "10px 12px",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: 10,
    background: "rgba(255,255,255,0.9)",
    ...(multiline ? { resize: "vertical" } : {}),
  };
}

/* -------------------- App (hash router) -------------------- */
export default function App() {
  const { managers, loading, err } = useManagers();
  const [route, setRoute] = useState(() => window.location.hash || "#/");

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const gradientWrap = (child) => (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 45%, #fbc2eb 100%)",
      }}
    >
      {child}
    </div>
  );

  // Routes
  if (route.startsWith("#/request")) {
    return gradientWrap(<RequestForm />);
  }

  if (route.startsWith("#/profile/")) {
    const id = route.replace("#/profile/", "");
    const m = managers.find((x) => x.id === id);
    return gradientWrap(
      loading ? <Loading /> : m ? <ProfileView manager={m} /> : <NotFound />
    );
  }

  // Home
  return gradientWrap(
    loading ? (
      <Loading />
    ) : err ? (
      <ErrorBox message={err} />
    ) : (
      <HomeView managers={managers} />
    )
  );
}

/* -------------------- Small bits -------------------- */
function Loading() {
  return (
    <div style={{ padding: 24, textAlign: "center", color: "#111827" }}>
      Loading…
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div
      style={{
        padding: 16,
        margin: 24,
        borderRadius: 12,
        background: "#fee2e2",
        color: "#991b1b",
        border: "1px solid #fecaca",
      }}
    >
      {message}
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ padding: 24, textAlign: "center", color: "#111827" }}>
      Profile not found.
    </div>
  );
}
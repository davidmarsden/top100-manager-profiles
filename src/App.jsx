import React, { useEffect, useMemo, useState } from "react";

/* ----------------------------- Utilities ----------------------------- */

const fetchJSON = async (url, init) => {
  const res = await fetch(url, init);
  const txt = await res.text();

  // If the function/route returned an HTML 404, throw a readable error.
  const ctype = res.headers.get("content-type") || "";
  if (!ctype.includes("application/json")) {
    throw new Error(
      `Non-JSON response from ${url} (status ${res.status}): ${txt.slice(0, 160)}…`
    );
  }
  try {
    return JSON.parse(txt);
  } catch {
    throw new Error(`Invalid JSON from ${url}: ${txt.slice(0, 160)}…`);
  }
};

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* ------------------------------ Styling ------------------------------ */

const pageBg = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, #f9c2d1 0%, #f8b3c8 25%, #b6d7f5 70%, #d9c2f8 100%)",
};
const card = {
  background: "rgba(255,255,255,0.95)",
  borderRadius: 16,
  boxShadow: "0 8px 26px rgba(0,0,0,0.12)",
};

/* ------------------------------ App Bar ------------------------------ */

function AppBar({ title, right }) {
  return (
    <div
      style={{
        background: "linear-gradient(90deg,#ff9aa2,#fecfef)",
        color: "#111827",
        padding: "12px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontWeight: 700,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span role="img" aria-label="ball">
          ⚽
        </span>
        <span>{title}</span>
      </div>
      <div>{right}</div>
    </div>
  );
}

/* ------------------------------ Home ------------------------------ */

function Home() {
  const [list, setList] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchJSON("/api/managers");
        if (mounted) setList(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Pick two randoms for the hero
  const featured = useMemo(() => {
    if (list.length <= 2) return list;
    const i = Math.floor(Math.random() * list.length);
    let j = Math.floor(Math.random() * list.length);
    if (j === i) j = (j + 1) % list.length;
    return [list[i], list[j]];
  }, [list]);

  return (
    <div style={pageBg}>
      <AppBar
        title="Top 100 Manager Profiles"
        right={
          <button
            onClick={() => (window.location.hash = "#/request")}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "2px solid #111827",
              background: "white",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            + Submit Your Profile
          </button>
        }
      />
      <div style={{ maxWidth: 1100, margin: "24px auto", padding: "0 16px" }}>
        <p style={{ color: "#111827", fontSize: 18, marginBottom: 18 }}>
          Celebrating 25 seasons of Soccer Manager Worlds
        </p>

        <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => (window.location.hash = "#/request")}
            style={{ ...card, padding: "10px 14px", cursor: "pointer", border: "none" }}
          >
            ➕ Submit Your Profile
          </button>
          <button
            onClick={() => (window.location.hash = "#/search")}
            style={{ ...card, padding: "10px 14px", cursor: "pointer", border: "none" }}
          >
            🔎 Search Managers
          </button>
        </div>

        {err && (
          <div
            style={{
              ...card,
              padding: 12,
              borderLeft: "6px solid #dc2626",
              color: "#b91c1c",
              marginBottom: 16,
            }}
          >
            {err}
          </div>
        )}

        {loading ? (
          <div style={{ ...card, padding: 20 }}>Loading…</div>
        ) : featured.length === 0 ? (
          <div style={{ ...card, padding: 20 }}>No managers yet.</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {featured.map((m) => (
              <ManagerCard key={m.id || m.name} m={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ManagerCard({ m }) {
  const slug = slugify(m.id || m.name);
  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#111827" }}>{m.name}</div>
          <div style={{ color: "#6b7280" }}>{m.club}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Badge>Div {m.division || "—"}</Badge>
          <Badge tone="blue">{(m.type || "rising").toLowerCase()}</Badge>
        </div>
      </div>

      {m.signature && (
        <p
          style={{
            marginTop: 12,
            fontStyle: "italic",
            color: "#374151",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          “{m.signature}”
        </p>
      )}

      <div style={{ marginTop: 12 }}>
        <a
          href={`#/profile/${slug}`}
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = `#/profile/${slug}`;
          }}
          style={{ color: "#be185d", fontWeight: 600 }}
        >
          View Profile →
        </a>
      </div>
    </div>
  );
}

function Badge({ children, tone }) {
  const tones = {
    blue: { bg: "#dbeafe", fg: "#1e40af" },
    amber: { bg: "#fde68a", fg: "#92400e" },
    gray: { bg: "#e5e7eb", fg: "#374151" },
  };
  const t = tones[tone] || tones.gray;
  return (
    <span
      style={{
        background: t.bg,
        color: t.fg,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

/* ------------------------------ Search ------------------------------ */

function SearchPage() {
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchJSON("/api/managers");
        if (mounted) setList(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(String(e.message || e));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return list.filter((m) => {
      const hay = [
        m.name,
        m.club,
        m.favouriteFormation,
        m.tacticalPhilosophy,
        m.careerHighlights,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(t);
    });
  }, [q, list]);

  return (
    <div style={pageBg}>
      <AppBar title="Search Managers" right={<BackBtn />} />
      <div style={{ maxWidth: 1100, margin: "24px auto", padding: "0 16px" }}>
        <div style={{ ...card, padding: 12, marginBottom: 16 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, club, formation, philosophy, highlights…"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "2px solid #e5e7eb",
              borderRadius: 10,
              fontSize: 16,
            }}
          />
        </div>

        {err && (
          <div
            style={{
              ...card,
              padding: 12,
              borderLeft: "6px solid #dc2626",
              color: "#b91c1c",
            }}
          >
            {err}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((m) => (
            <ManagerCard key={m.id || m.name} m={m} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BackBtn() {
  return (
    <button
      onClick={() => (window.location.hash = "#/")}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "2px solid #111827",
        background: "white",
        cursor: "pointer",
        fontWeight: 700,
      }}
    >
      ← Back
    </button>
  );
}

/* ------------------------------ Profile ------------------------------ */

function Profile() {
  const slug = decodeURIComponent((window.location.hash.split("/")[2] || "").trim());
  const [m, setM] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchJSON(`/api/manager?id=${encodeURIComponent(slug)}`);
        if (mounted) setM(data || null);
      } catch (e) {
        setErr(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  return (
    <div style={pageBg}>
      <AppBar title="Manager Profile" right={<BackBtn />} />
      <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        {err && (
          <div
            style={{
              ...card,
              padding: 12,
              borderLeft: "6px solid #dc2626",
              color: "#b91c1c",
              marginBottom: 16,
            }}
          >
            {err}
          </div>
        )}
        {loading ? (
          <div style={{ ...card, padding: 20 }}>Loading…</div>
        ) : !m ? (
          <div style={{ ...card, padding: 20 }}>Not found.</div>
        ) : (
          <div style={{ ...card, padding: 20 }}>
            <h1 style={{ margin: 0, fontSize: 32 }}>{m.name}</h1>
            <div style={{ color: "#6b7280", marginBottom: 8 }}>{m.club}</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              <Badge>Division {m.division || "—"}</Badge>
              <Badge tone="blue">{(m.type || "rising").toLowerCase()}</Badge>
            </div>

            <GridStats m={m} />

            {m.careerHighlights && <Field title="Career Highlights" text={m.careerHighlights} />}
            {m.favouriteFormation && <Field title="Favourite Formation" text={m.favouriteFormation} />}
            {m.tacticalPhilosophy && <Field title="Tactical Philosophy" text={m.tacticalPhilosophy} />}
            {m.memorableMoment && <Field title="Most Memorable Moment" text={m.memorableMoment} />}
            {m.fearedOpponent && <Field title="Most Feared Opponent" text={m.fearedOpponent} />}
            {m.ambitions && <Field title="Future Ambitions" text={m.ambitions} />}
            {m.story && <Field title="Top 100 Journey" text={m.story} />}
          </div>
        )}
      </div>
    </div>
  );
}

function GridStats({ m }) {
  const fmt = (n) => (typeof n === "number" ? n : Number(n || 0));
  const fmtAvg = (n) => (Number.isFinite(+n) ? (+n).toFixed(2) : "0.00");
  const cells = [
    { label: "Total Points", value: fmt(m.points || 0) },
    { label: "Games Played", value: fmt(m.games || 0) },
    { label: "Avg Points", value: fmtAvg(m.avgPoints || 0) },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
        gap: 10,
        marginBottom: 18,
      }}
    >
      {cells.map((c) => (
        <div key={c.label} style={{ background: "#f9fafb", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>{c.value}</div>
          <div style={{ color: "#6b7280" }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

function Field({ title, text }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 800, color: "#111827", marginBottom: 6 }}>{title}</div>
      <div style={{ whiteSpace: "pre-line", color: "#374151" }}>{text}</div>
    </div>
  );
}

/* --------------------------- Submit (Request) --------------------------- */

function RequestForm() {
  const [payload, setPayload] = useState({
    managerName: "",
    clubName: "",
    division: "",
    careerHighlights: "",
    favouriteFormation: "",
    tacticalPhilosophy: "",
    mostMemorableMoment: "",
    mostFearedOpponent: "",
    futureAmbitions: "",
    story: "",
  });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const set = (k) => (e) => setPayload((p) => ({ ...p, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetchJSON("/api/profile-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          "Manager Name": payload.managerName,
          "Club Name": payload.clubName,
          Division: payload.division,
          "Career Highlights": payload.careerHighlights,
          "Favourite Formation": payload.favouriteFormation,
          "Tactical Philosophy": payload.tacticalPhilosophy,
          "Most Memorable Moment": payload.mostMemorableMoment,
          "Most Feared Opponent": payload.mostFearedOpponent,
          "Future Ambitions": payload.futureAmbitions,
          Story: payload.story,
        }),
      });
      if (res?.success) {
        setMsg("Thanks! Your profile was submitted.");
        setPayload({
          managerName: "",
          clubName: "",
          division: "",
          careerHighlights: "",
          favouriteFormation: "",
          tacticalPhilosophy: "",
          mostMemorableMoment: "",
          mostFearedOpponent: "",
          futureAmbitions: "",
          story: "",
        });
      } else {
        throw new Error(res?.error || "Unexpected response");
      }
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={pageBg}>
      <AppBar title="Submit Your Manager Profile" right={<BackBtn />} />
      <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        {err && (
          <div
            style={{
              ...card,
              padding: 12,
              borderLeft: "6px solid #dc2626",
              color: "#b91c1c",
              marginBottom: 16,
            }}
          >
            {err}
          </div>
        )}
        {msg && (
          <div
            style={{
              ...card,
              padding: 12,
              borderLeft: "6px solid #16a34a",
              color: "#065f46",
              marginBottom: 16,
            }}
          >
            {msg}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ ...card, padding: 16 }}>
          <TwoCol>
            <FieldInput label="Manager Name *" value={payload.managerName} onChange={set("managerName")} required />
            <FieldInput label="Club Name *" value={payload.clubName} onChange={set("clubName")} required />
          </TwoCol>

          <TwoCol>
            <FieldInput label="Division" value={payload.division} onChange={set("division")} placeholder="1–5" />
            <FieldInput
              label="Favourite Formation"
              value={payload.favouriteFormation}
              onChange={set("favouriteFormation")}
              placeholder="4-3-3, 4-2-3-1…"
            />
          </TwoCol>

          <FieldTextarea
            label="Career Highlights"
            value={payload.careerHighlights}
            onChange={set("careerHighlights")}
          />
          <FieldTextarea
            label="Tactical Philosophy"
            value={payload.tacticalPhilosophy}
            onChange={set("tacticalPhilosophy")}
          />
          <TwoCol>
            <FieldInput
              label="Most Memorable Moment"
              value={payload.mostMemorableMoment}
              onChange={set("mostMemorableMoment")}
            />
            <FieldInput
              label="Most Feared Opponent"
              value={payload.mostFearedOpponent}
              onChange={set("mostFearedOpponent")}
            />
          </TwoCol>
          <FieldTextarea
            label="Future Ambitions"
            value={payload.futureAmbitions}
            onChange={set("futureAmbitions")}
          />
          <FieldTextarea label="Your Top 100 Story" value={payload.story} onChange={set("story")} />

          <div style={{ marginTop: 12 }}>
            <button
              type="submit"
              disabled={sending}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "2px solid #111827",
                background: "white",
                cursor: "pointer",
                fontWeight: 700,
                opacity: sending ? 0.65 : 1,
              }}
            >
              {sending ? "Submitting…" : "Submit Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TwoCol({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}
function FieldInput({ label, ...rest }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: "#111827" }}>{label}</div>
      <input
        {...rest}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "2px solid #e5e7eb",
          borderRadius: 10,
          fontSize: 16,
        }}
      />
    </label>
  );
}
function FieldTextarea({ label, ...rest }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontWeight: 700, margin: "10px 0 6px", color: "#111827" }}>{label}</div>
      <textarea
        {...rest}
        rows={4}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "2px solid #e5e7eb",
          borderRadius: 10,
          fontSize: 16,
        }}
      />
    </label>
  );
}

/* ------------------------------- Router ------------------------------- */

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash || "#/");

  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const route = hash.replace(/^#/, "");
  if (route.startsWith("/request")) return <RequestForm />;
  if (route.startsWith("/profile/")) return <Profile />;
  if (route.startsWith("/search")) return <SearchPage />;
  return <Home />;
}
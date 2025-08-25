import { useEffect, useMemo, useState } from "react";

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  const txt = await res.text();
  const isJSON = (res.headers.get("content-type") || "").includes(
    "application/json"
  );
  if (!res.ok) {
    if (isJSON) {
      let data;
      try {
        data = JSON.parse(txt);
      } catch {}
      throw new Error(
        `Non-OK response from ${url} (${res.status}): ${data?.error || data?.message || txt}`
      );
    }
    throw new Error(
      `Non-JSON response from ${url} (status ${res.status}): ${txt.slice(
        0,
        180
      )}…`
    );
  }
  return isJSON ? JSON.parse(txt) : txt;
}

const slugify = (s = "") =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/* -------------------------------------------------------------------------- */
/* Tiny Router (hash)                                                         */
/* -------------------------------------------------------------------------- */

function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash || "#/");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // routes: "/", "/request", "/admin", "/manager/:id"
  const parts = hash.replace(/^#/, "").split("?")[0].split("/").filter(Boolean);
  const route =
    parts.length === 0
      ? { name: "home" }
      : parts[0] === "request"
      ? { name: "request" }
      : parts[0] === "admin"
      ? { name: "admin" }
      : parts[0] === "manager" && parts[1]
      ? { name: "manager", id: decodeURIComponent(parts[1]) }
      : { name: "home" };

  return route;
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#/">
        <span role="img" aria-label="ball">
          ⚽
        </span>{" "}
        Top 100 Manager Profiles
      </a>
      <div className="header-actions">
        <a className="btn primary" href="#/request">
          + Submit Your Profile
        </a>
        <a className="btn" href="#/admin">
          🛠️ Admin
        </a>
      </div>
      <hr className="divider" />
    </header>
  );
}

function Container({ children }) {
  return <main className="container">{children}</main>;
}

/* -------------------------------------------------------------------------- */
/* Home                                                                       */
/* -------------------------------------------------------------------------- */

function Home() {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const list = await fetchJSON("/api/managers");
        if (on) setData(Array.isArray(list) ? list : []);
      } catch (e) {
        if (on) setError(e.message || "Failed to load managers");
      }
    })();
    return () => (on = false);
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter((m) => {
      const hay =
        `${m.name} ${m.club} ${m.division} ${m.signature} ${m.type}`
          .toLowerCase()
          .replace(/\s+/g, " ");
      return hay.includes(term);
    });
  }, [data, q]);

  return (
    <Container>
      {error && (
        <div className="alert">
          {error}{" "}
          <button className="link" onClick={() => setError("")}>
            dismiss
          </button>
        </div>
      )}

      <h1 className="page-title">
        Celebrating 25 seasons of Soccer Manager Worlds
      </h1>

      <div className="home-actions">
        <a className="btn" href="#/request">
          + Submit Your Profile
        </a>

        <div className="search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by manager, club, division, type…"
            aria-label="Search managers"
          />
          <button className="btn" onClick={() => setQ((s) => s.trim())}>
            🔎 Search
          </button>
        </div>
      </div>

      <section className="list">
        {filtered.length === 0 ? (
          <div className="card">No managers yet.</div>
        ) : (
          filtered.map((m) => <ManagerSummaryCard key={m.id} m={m} />)
        )}
      </section>

      <p className="backlink">
        <a href="https://smtop100.blog">Back to smtop100.blog</a>
      </p>
    </Container>
  );
}

/* Summary Card */
function ManagerSummaryCard({ m }) {
  return (
    <article className="card pro-card">
      <div className="pro-left">
        <Avatar name={m.name} imageUrl={m.imageUrl} />
      </div>
      <div className="pro-main">
        <h3 className="title">{m.name}</h3>
        <div className="subtle">{m.club}</div>
        {m.signature && <p className="sig">“{m.signature}”</p>}

        <div className="mini-facts">
          <span className="badge muted">Div {m.division || "–"}</span>
          <span className="badge">{(m.type || "rising").toLowerCase()}</span>
          {m.games ? <span className="chip">{m.games} games</span> : null}
          {m.points ? <span className="chip">{m.points} pts</span> : null}
          {(m.avgPoints ?? "") !== "" ? (
            <span className="chip">{Number(m.avgPoints).toFixed(2)} avg</span>
          ) : null}
        </div>
      </div>
      <div className="pro-actions">
        <a className="btn" href={`#/manager/${encodeURIComponent(m.id)}`}>
          View Profile →
        </a>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Manager Detail                                                              */
/* -------------------------------------------------------------------------- */

function ManagerPage({ id }) {
  const [mgr, setMgr] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const data = await fetchJSON(
          `/api/manager?id=${encodeURIComponent(id)}`
        );
        if (on) {
          if (data && !data.error) setMgr(data);
          else setError(data?.error || "Not found");
        }
      } catch (e) {
        if (on) setError(e.message || "Failed to load manager");
      }
    })();
    return () => (on = false);
  }, [id]);

  if (error) {
    return (
      <Container>
        <div className="card">{error}</div>
      </Container>
    );
  }
  if (!mgr) {
    return (
      <Container>
        <div className="card">Loading…</div>
      </Container>
    );
  }

  const {
    name,
    club,
    division,
    type,
    imageUrl,
    signature,
    points,
    games,
    avgPoints,
    favouriteFormation,
    careerHighlights,
    tacticalPhilosophy,
    memorableMoment,
    fearedOpponent,
    ambitions,
    story,
  } = mgr;

  return (
    <Container>
      {/* Hero */}
      <header className="manager-hero card">
        <div className="hero-media">
          <Avatar name={name} imageUrl={imageUrl} />
        </div>
        <div className="hero-meta">
          <h1 className="hero-name">{name}</h1>
          <div className="hero-sub">
            <span className="subtle">{club}</span>
            <span className="dot">•</span>
            <span className="badge muted">Div {division || "–"}</span>
            <span className="badge brand">{(type || "rising").toLowerCase()}</span>
          </div>
          {signature && <p className="hero-quote">“{signature}”</p>}
        </div>
      </header>

      {/* Fact grid */}
      <section className="fact-grid card">
        <Fact label="Club" value={club} />
        <Fact label="Division" value={division || "–"} />
        <Fact label="Games" value={games || "–"} />
        <Fact label="Points" value={points || "–"} />
        <Fact
          label="Avg Pts"
          value={(avgPoints ?? "") !== "" ? Number(avgPoints).toFixed(2) : "–"}
        />
        <Fact label="Formation" value={favouriteFormation || "–"} />
        <Fact label="Type" value={(type || "rising").toLowerCase()} />
      </section>

      {/* Content grid */}
      <section className="content-grid">
        <CardBlock title="Career Highlights" body={careerHighlights} />
        <CardBlock title="Tactical Philosophy" body={tacticalPhilosophy} />
        <CardBlock title="Most Memorable Moment" body={memorableMoment} />
        <CardBlock title="Most Feared Opponent" body={fearedOpponent} />
        <CardBlock title="Future Ambitions" body={ambitions} />
        <CardBlock title="Story" body={story} span={2} />
      </section>

      <nav className="footer-nav">
        <a href="https://smtop100.blog">Back to smtop100.blog</a>
      </nav>
    </Container>
  );
}

function Fact({ label, value }) {
  return (
    <div className="fact">
      <div className="fact-label">{label}</div>
      <div className="fact-value">{value || "—"}</div>
    </div>
  );
}

function CardBlock({ title, body, span = 1 }) {
  if (!body) return null;
  return (
    <article className={`card block span-${span}`}>
      <h3 className="block-title">{title}</h3>
      <p className="block-body">{body}</p>
    </article>
  );
}

function Avatar({ name, imageUrl }) {
  const initials = (name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("");
  return imageUrl ? (
    <img className="avatar" src={imageUrl} alt={`${name} portrait`} />
  ) : (
    <div className="avatar avatar-fallback" aria-label={`${name} initials`}>
      {initials || "?"}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Submit (Profile Request)                                                   */
/* -------------------------------------------------------------------------- */

function SubmitPage() {
  const [form, setForm] = useState({
    managerName: "",
    clubName: "",
    division: "",
    favouriteFormation: "",
    careerHighlights: "",
    tacticalPhilosophy: "",
    memorableMoment: "",
    fearedOpponent: "",
    ambitions: "",
    story: "",
    type: "rising",
    imageUrl: "",
    gamesPlayed: "",
    totalPoints: "",
  });
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetchJSON("/api/profile-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      setMsg(res?.ok ? "Thanks! Your profile was submitted." : "Unexpected response");
    } catch (err) {
      setMsg(err.message || "Failed to submit");
    }
  }

  return (
    <Container>
      <h1 className="page-title">Submit Your Manager Profile</h1>
      {msg && <div className="alert">{msg}</div>}
      <form className="card form" onSubmit={onSubmit}>
        <Row>
          <Field
            label="Manager Name *"
            required
            value={form.managerName}
            onChange={(v) => setForm({ ...form, managerName: v })}
          />
          <Field
            label="Club Name *"
            required
            value={form.clubName}
            onChange={(v) => setForm({ ...form, clubName: v })}
          />
          <Field
            label="Division"
            value={form.division}
            onChange={(v) => setForm({ ...form, division: v })}
          />
        </Row>

        <Row>
          <Field
            label="Favourite Formation"
            value={form.favouriteFormation}
            onChange={(v) => setForm({ ...form, favouriteFormation: v })}
          />
          <Field
            label="Type (e.g. rising, legend)"
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v })}
          />
          <Field
            label="Image URL"
            value={form.imageUrl}
            onChange={(v) => setForm({ ...form, imageUrl: v })}
          />
        </Row>

        <Row>
          <Field
            label="Games Played"
            value={form.gamesPlayed}
            onChange={(v) => setForm({ ...form, gamesPlayed: v })}
          />
          <Field
            label="Total Points"
            value={form.totalPoints}
            onChange={(v) => setForm({ ...form, totalPoints: v })}
          />
        </Row>

        <TextArea
          label="Career Highlights"
          value={form.careerHighlights}
          onChange={(v) => setForm({ ...form, careerHighlights: v })}
        />
        <TextArea
          label="Tactical Philosophy"
          value={form.tacticalPhilosophy}
          onChange={(v) => setForm({ ...form, tacticalPhilosophy: v })}
        />
        <TextArea
          label="Most Memorable Moment"
          value={form.memorableMoment}
          onChange={(v) => setForm({ ...form, memorableMoment: v })}
        />
        <TextArea
          label="Most Feared Opponent"
          value={form.fearedOpponent}
          onChange={(v) => setForm({ ...form, fearedOpponent: v })}
        />
        <TextArea
          label="Future Ambitions"
          value={form.ambitions}
          onChange={(v) => setForm({ ...form, ambitions: v })}
        />
        <TextArea
          label="Your Top 100 Story"
          value={form.story}
          onChange={(v) => setForm({ ...form, story: v })}
        />

        <div className="form-actions">
          <button className="btn primary" type="submit">
            Submit Profile
          </button>
          <a className="btn" href="#/">
            ← Back
          </a>
        </div>
      </form>
    </Container>
  );
}

function Row({ children }) {
  return <div className="row">{children}</div>;
}
function Field({ label, value, onChange, required }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        required={!!required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function TextArea({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                      */
/* -------------------------------------------------------------------------- */

function AdminPage() {
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const list = await fetchJSON("/api/profile-request");
      setSubs(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message || "Failed to load submissions");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function act(submissionId, action) {
    try {
      await fetchJSON("/api/profile-request", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submissionId, action }),
      });
      await refresh();
    } catch (e) {
      alert(e.message || "Action failed");
    }
  }

  return (
    <Container>
      <h1 className="page-title">Admin — Profile Requests</h1>
      {error && <div className="alert">{error}</div>}

      <section className="admin-list">
        {subs.length === 0 ? (
          <div className="card">No submissions.</div>
        ) : (
          subs.map((s) => (
            <article key={s["Request ID"]} className="card pro-card">
              <div className="pro-main">
                <div className="title-row">
                  <strong>{s["Manager Name"]}</strong>{" "}
                  <span className="subtle">{s["Club Name"]}</span>
                </div>
                <div className="mini-facts">
                  <span className="chip">{s["Timestamp"]}</span>
                  <span className="badge muted">Div {s["Division"] || "–"}</span>
                  <span className="chip">{s["Request ID"]}</span>
                  <span className="badge">
                    {(s["Status"] || "pending").toLowerCase()}
                  </span>
                </div>
              </div>
              <div className="pro-actions">
                <button
                  className="btn primary"
                  onClick={() => act(s["Request ID"], "approve")}
                >
                  Approve
                </button>
                <button
                  className="btn"
                  onClick={() => act(s["Request ID"], "reject")}
                >
                  Reject
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <p className="backlink">
        <a href="https://smtop100.blog">Back to smtop100.blog</a>
      </p>
    </Container>
  );
}

/* -------------------------------------------------------------------------- */
/* App                                                                         */
/* -------------------------------------------------------------------------- */

export default function App() {
  const route = useRoute();

  return (
    <div className="app">
      <Header />
      {route.name === "home" && <Home />}
      {route.name === "request" && <SubmitPage />}
      {route.name === "admin" && <AdminPage />}
      {route.name === "manager" && <ManagerPage id={route.id} />}
    </div>
  );
}
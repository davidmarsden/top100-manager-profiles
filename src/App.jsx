import { useEffect, useMemo, useState } from "react";

/* ----------------------- tiny router (hash-based) ----------------------- */
function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash.replace(/^#/, "") || "/");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash.replace(/^#/, "") || "/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const path = hash.split("?")[0];
  const query = useMemo(() => {
    const out = {};
    const [, qs = ""] = hash.split("?");
    qs.split("&").forEach((kv) => {
      const [k, v] = kv.split("=");
      if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || "");
    });
    return out;
  }, [hash]);
  return { path, query, push: (p) => (window.location.hash = p.startsWith("#") ? p : `#${p}`) };
}

/* ---------------------------- fetch utilities --------------------------- */
async function fetchJSON(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Non-JSON response from ${url} (status ${res.status}): ${text.slice(0, 150)}…`);
  }
  return res.json();
}

/* -------------------------------- Header -------------------------------- */
function SiteHeader() {
  return (
    <header className="sitebar">
      <div className="container cluster">
        <a href="#/" className="brand">⚽ Top 100 Manager Profiles</a>
        <div className="right cluster">
          <a href="#/request" className="btn primary">+ Submit Your Profile</a>
          <a href="#/admin" className="btn">🛠️ Admin</a>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------- Home -------------------------------- */
function Home() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const data = await fetchJSON("/api/managers");
        if (on) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (on) setError(e.message || "Failed to load managers");
      }
    })();
    return () => (on = false);
  }, []);

  return (
    <main className="container stack">
      <h1 className="m0">Celebrating 25 seasons of Soccer Manager Worlds</h1>

      <div className="cluster">
        <a href="#/request" className="btn">+ Submit Your Profile</a>
        <button className="btn">🔎 Search Managers</button>
      </div>

      {error && <div className="card" style={{ borderLeft: "4px solid var(--err)" }}>{error}</div>}

      {!items && !error && <div className="card">Loading…</div>}

      {items && (
        items.length ? (
          <section className="grid">
            {items.map(m => (
              <article key={m.id} className="card manager-card">
                <h3 className="title">{m.name}</h3>
                <p className="subtitle">{m.club}</p>
                {m.signature && <p>“{m.signature}”</p>}
                <div className="footer">
                  <span className="badge muted">Div {m.division || "–"}</span>
                  <span className="badge brand">{(m.type || "rising").toLowerCase()}</span>
                  <a className="btn right" href={`#/manager/${encodeURIComponent(m.id)}`}>View Profile →</a>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className="card">No managers yet.</div>
        )
      )}

      <div><a href="https://smtop100.blog">Back to smtop100.blog</a></div>
    </main>
  );
}

/* ------------------------------- Profile view --------------------------- */
function Profile({ id }) {
  const [mgr, setMgr] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const data = await fetchJSON(`/api/manager?id=${encodeURIComponent(id)}`);
        if (on) setMgr(data);
      } catch (e) {
        if (on) setError(e.message || "Failed to load profile");
      }
    })();
    return () => (on = false);
  }, [id]);

  if (error) return <main className="container stack"><div className="card">{error}</div></main>;
  if (!mgr) return <main className="container stack"><div className="card">Loading…</div></main>;

  return (
    <main className="container stack">
      <div className="profile-header">
        <div>
          <h1 className="profile-name m0">{mgr.name}</h1>
          <div className="profile-meta">
            {mgr.club} · Div {mgr.division || "–"} · <span className="badge brand">{mgr.type || "rising"}</span>
          </div>
          {mgr.signature && <p className="mt8">“{mgr.signature}”</p>}
        </div>
      </div>

      <div className="profile-grid">
        <div className="card section">
          <h2>Story</h2>
          <p>{mgr.story || "—"}</p>
        </div>

        <div className="stack">
          <div className="card section">
            <h2>Career Highlights</h2>
            <p>{mgr.careerHighlights || "—"}</p>
          </div>
          <div className="card section"><h2>Favourite Formation</h2><p>{mgr.favouriteFormation || "—"}</p></div>
          <div className="card section"><h2>Tactical Philosophy</h2><p>{mgr.tacticalPhilosophy || "—"}</p></div>
          <div className="card section"><h2>Most Memorable Moment</h2><p>{mgr.memorableMoment || "—"}</p></div>
          <div className="card section"><h2>Most Feared Opponent</h2><p>{mgr.fearedOpponent || "—"}</p></div>
          <div className="card section"><h2>Future Ambitions</h2><p>{mgr.ambitions || "—"}</p></div>
        </div>
      </div>

      <div className="mt16"><a href="https://smtop100.blog">Back to smtop100.blog</a></div>
    </main>
  );
}

/* ------------------------------- Request form --------------------------- */
function RequestForm() {
  const empty = {
    managerName: "", clubName: "", division: "",
    favouriteFormation: "", careerHighlights: "",
    tacticalPhilosophy: "", memorableMoment: "",
    fearedOpponent: "", ambitions: "", story: "",
    type: "rising", totalPoints: "", gamesPlayed: "", imageUrl: ""
  };
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState("");

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetchJSON("/api/profile-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      setMsg(res.ok ? "Submitted! Awaiting approval." : "Unexpected response");
      setForm(empty);
    } catch (err) {
      setMsg(err.message || "Submission failed");
    }
  };

  return (
    <main className="container stack">
      <h1 className="m0">Submit Your Manager Profile</h1>
      {msg && <div className="card">{msg}</div>}
      <form onSubmit={onSubmit} className="card stack" style={{ padding: 20 }}>
        <div className="grid" style={{ "--min": "260px" }}>
          <label className="stack">
            <strong>Manager Name *</strong>
            <input name="managerName" value={form.managerName} onChange={onChange} required />
          </label>
          <label className="stack">
            <strong>Club Name *</strong>
            <input name="clubName" value={form.clubName} onChange={onChange} required />
          </label>
          <label className="stack">
            <strong>Division</strong>
            <input name="division" value={form.division} onChange={onChange} />
          </label>
          <label className="stack">
            <strong>Favourite Formation</strong>
            <input name="favouriteFormation" value={form.favouriteFormation} onChange={onChange} />
          </label>
        </div>

        <label className="stack">
          <strong>Career Highlights</strong>
          <textarea name="careerHighlights" rows="3" value={form.careerHighlights} onChange={onChange} />
        </label>

        <label className="stack">
          <strong>Tactical Philosophy</strong>
          <textarea name="tacticalPhilosophy" rows="5" value={form.tacticalPhilosophy} onChange={onChange} />
        </label>

        <div className="grid" style={{ "--min": "260px" }}>
          <label className="stack">
            <strong>Most Memorable Moment</strong>
            <input name="memorableMoment" value={form.memorableMoment} onChange={onChange} />
          </label>
          <label className="stack">
            <strong>Most Feared Opponent</strong>
            <input name="fearedOpponent" value={form.fearedOpponent} onChange={onChange} />
          </label>
        </div>

        <label className="stack">
          <strong>Future Ambitions</strong>
          <textarea name="ambitions" rows="3" value={form.ambitions} onChange={onChange} />
        </label>

        <label className="stack">
          <strong>Your Top 100 Story</strong>
          <textarea name="story" rows="6" value={form.story} onChange={onChange} />
        </label>

        <div className="cluster">
          <button className="btn primary" type="submit">Submit Profile</button>
          <a href="#/" className="btn">← Back</a>
        </div>
      </form>
    </main>
  );
}

/* --------------------------------- Admin -------------------------------- */
function Admin() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    try {
      const data = await fetchJSON("/api/profile-request");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load submissions");
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (submissionId, action) => {
    try {
      await fetchJSON("/api/profile-request", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submissionId, action }),
      });
      await load();
    } catch (e) {
      alert(e.message || "Action failed");
    }
  };

  return (
    <main className="container stack">
      <h1 className="m0">Admin — Profile Requests</h1>
      {err && <div className="card">{err}</div>}
      {!rows && !err && <div className="card">Loading…</div>}

      {rows && (
        rows.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>When</th><th>Manager</th><th>Club</th><th>Division</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r["Timestamp"]?.replace("T", " ").replace("Z", "") || "—"}</td>
                  <td>{r["Manager Name"]}</td>
                  <td>{r["Club Name"]}</td>
                  <td>{r["Division"]}</td>
                  <td>{r["Status"] || "pending"}</td>
                  <td className="cluster">
                    <button className="btn primary" onClick={() => act(r["Request ID"], "approve")}>Approve</button>
                    <button className="btn" onClick={() => act(r["Request ID"], "reject")}>Reject</button>
                    <code style={{ fontSize: "12px" }}>{r["Request ID"]}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="card">No submissions.</div>
        )
      )}

      <a href="https://smtop100.blog">Back to smtop100.blog</a>
    </main>
  );
}

/* ---------------------------------- App --------------------------------- */
export default function App() {
  const { path } = useHashRoute();

  return (
    <>
      <SiteHeader />
      {path === "/" && <Home />}

      {path.startsWith("/manager/") && (
        <Profile id={decodeURIComponent(path.split("/").pop() || "")} />
      )}

      {path === "/request" && <RequestForm />}

      {path === "/admin" && <Admin />}

      {/* Fallback */}
      {!["/", "/request", "/admin"].some(p => path === p || path.startsWith("/manager/")) && (
        <main className="container stack">
          <div className="card">Page not found.</div>
        </main>
      )}
    </>
  );
}

/* -------------------------- basic form element styles -------------------- */
/* If you prefer, move these to index.css, but keeping here is convenient */
const style = document.createElement("style");
style.innerHTML = `
  input, textarea {
    width: 100%;
    font: inherit;
    padding: .65rem .8rem;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    background: #fff;
  }
  textarea { resize: vertical }
`;
document.head.appendChild(style);
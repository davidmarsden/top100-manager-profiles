// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./index.css";

/* -------------------------------------------------------
   Small utilities
--------------------------------------------------------*/
const API = {
  // Use the more reliable direct path for this one function.
  submissions: "/.netlify/functions/profile-request",
  managers: "/api/managers",
  manager: (id) => `/api/manager?id=${encodeURIComponent(id)}`
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data?.error || data?.message || res.statusText);
    return data;
  } catch (e) {
    // Non-JSON (e.g. HTML error page)
    throw new Error(`Non-JSON response from ${url} (status ${res.status}): ${text.slice(0, 200)}…`);
  }
}

function cls(...xs) {
  return xs.filter(Boolean).join(" ");
}

/* -------------------------------------------------------
   UI atoms
--------------------------------------------------------*/
function Button({ children, icon, className, ...rest }) {
  return (
    <button
      className={cls(
        "px-4 py-2 rounded-xl bg-white/80 hover:bg-white shadow-sm border border-white/60",
        "backdrop-blur text-sm font-medium flex items-center gap-2",
        className
      )}
      {...rest}
    >
      {icon ? <span className="opacity-70">{icon}</span> : null}
      {children}
    </button>
  );
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-black/10 text-black/70",
    warn: "bg-amber-100 text-amber-800",
    good: "bg-emerald-100 text-emerald-800",
    bad: "bg-rose-100 text-rose-800",
    info: "bg-sky-100 text-sky-800",
  };
  return (
    <span className={cls("px-2 py-0.5 rounded-full text-xs font-semibold", tones[tone] || tones.neutral)}>
      {children}
    </span>
  );
}

function Card({ children, className }) {
  return (
    <div className={cls("rounded-2xl bg-white/85 shadow-md border border-white/60 p-4", className)}>
      {children}
    </div>
  );
}

function ErrorBar({ error, onClose }) {
  if (!error) return null;
  return (
    <div className="max-w-5xl mx-auto mt-4">
      <div className="rounded-xl px-4 py-3 bg-rose-50 text-rose-800 border border-rose-200 shadow-sm flex justify-between items-start gap-3">
        <div className="text-sm leading-relaxed">
          {String(error)}
        </div>
        <button className="text-rose-700 text-sm underline" onClick={onClose}>dismiss</button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Layout + Header
--------------------------------------------------------*/
function Shell({ children, right }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-sky-100 to-violet-200">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-pink-200 to-pink-100/90 border-b border-white/60 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="#/" className="font-semibold">⚽ Top 100 Manager Profiles</a>
          <div className="flex items-center gap-2">
            <a href="#/request">
              <Button className="hidden sm:flex">+ Submit Your Profile</Button>
            </a>
            {right}
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      <footer className="py-10 text-center text-xs text-black/50">
        <a className="underline" href="https://smtop100.blog/">Back to smtop100.blog</a>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------
   Home (list from /api/managers)
--------------------------------------------------------*/
function Home() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchJSON(API.managers);
        if (mounted) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || String(e));
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <Shell
      right={
        <a href="#/admin">
          <Button className="hidden sm:flex" icon={"🛠️"}>Admin</Button>
        </a>
      }
    >
      <ErrorBar error={err} onClose={() => setErr("")} />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Celebrating 25 seasons of Soccer Manager Worlds</h1>
        <div className="flex gap-3">
          <a href="#/request"><Button icon={"➕"}>Submit Your Profile</Button></a>
          <a href="#/search"><Button icon={"🔎"}>Search Managers</Button></a>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>No managers yet.</Card>
      ) : (
        <div className="grid gap-4">
          {items.map((m) => (
            <Card key={m.id} className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">{m.name}</div>
                <div className="text-sm text-black/60">{m.club}</div>
                <div className="italic text-black/70 mt-2">“{m.signature || "—"}”</div>
                <div className="mt-3">
                  <a href={`#/profile/${encodeURIComponent(m.id)}`} className="text-pink-700 font-semibold underline">
                    View Profile →
                  </a>
                </div>
              </div>
              <div className="flex gap-2">
                {m.division ? <Badge>Div {m.division}</Badge> : null}
                <Badge tone="info">{m.type || "rising"}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}

/* -------------------------------------------------------
   Request form (unchanged fields; posts to profile-request)
--------------------------------------------------------*/
function RequestForm() {
  const [form, setForm] = useState({
    "Manager Name": "",
    "Club Name": "",
    "Division": "",
    "Favourite Formation": "",
    "Career Highlights": "",
    "Tactical Philosophy": "",
    "Most Memorable Moment": "",
    "Most Feared Opponent": "",
    "Future Ambitions": "",
    "Your Top 100 Story": "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true); setErr(""); setMsg("");
    try {
      const payload = {
        "Manager Name": form["Manager Name"],
        "Club Name": form["Club Name"],
        "Division": form["Division"],
        "Favourite Formation": form["Favourite Formation"],
        "Career Highlights": form["Career Highlights"],
        "Tactical Philosophy": form["Tactical Philosophy"],
        "Most Memorable Moment": form["Most Memorable Moment"],
        "Most Feared Opponent": form["Most Feared Opponent"],
        "Future Ambitions": form["Future Ambitions"],
        "Your Top 100 Story": form["Your Top 100 Story"],
      };
      const res = await fetchJSON(API.submissions, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });
      setMsg(`Submitted ✔ (id: ${res.submissionId || "n/a"})`);
      setForm({
        "Manager Name": "",
        "Club Name": "",
        "Division": "",
        "Favourite Formation": "",
        "Career Highlights": "",
        "Tactical Philosophy": "",
        "Most Memorable Moment": "",
        "Most Feared Opponent": "",
        "Future Ambitions": "",
        "Your Top 100 Story": "",
      });
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  const Field = ({label, name, type="text", textarea=false, required=false}) => (
    <div className="mb-4">
      <label className="block text-sm font-semibold mb-1">{label}{required ? " *" : ""}</label>
      {textarea ? (
        <textarea
          className="w-full rounded-xl border border-black/10 bg-white/80 p-3 min-h-[110px]"
          value={form[name] || ""}
          onChange={(e)=>setField(name, e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="w-full rounded-xl border border-black/10 bg-white/80 p-3"
          value={form[name] || ""}
          onChange={(e)=>setField(name, e.target.value)}
          required={required}
        />
      )}
    </div>
  );

  return (
    <Shell
      right={<a href="#/"><Button>← Back</Button></a>}
    >
      <ErrorBar error={err} onClose={() => setErr("")} />
      {msg && (
        <div className="max-w-3xl mx-auto mb-4">
          <div className="rounded-xl px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">{msg}</div>
        </div>
      )}

      <Card className="max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold mb-4">Submit Your Manager Profile</h2>
        <form onSubmit={onSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Manager Name" name="Manager Name" required />
            <Field label="Club Name" name="Club Name" required />
            <Field label="Division" name="Division" />
            <Field label="Favourite Formation" name="Favourite Formation" />
          </div>

          <Field label="Career Highlights" name="Career Highlights" textarea />
          <Field label="Tactical Philosophy" name="Tactical Philosophy" textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Most Memorable Moment" name="Most Memorable Moment" />
            <Field label="Most Feared Opponent" name="Most Feared Opponent" />
          </div>
          <Field label="Future Ambitions" name="Future Ambitions" textarea />
          <Field label="Your Top 100 Story" name="Your Top 100 Story" textarea />

          <div className="pt-2">
            <Button type="submit" disabled={saving}>{saving ? "Submitting…" : "Submit Profile"}</Button>
          </div>
        </form>
      </Card>
    </Shell>
  );
}

/* -------------------------------------------------------
   Admin Panel — Approve / Reject
--------------------------------------------------------*/
function AdminPanel() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load() {
    setErr(""); setLoading(true);
    try {
      const data = await fetchJSON(API.submissions);
      // Expect array of row objects (from your function)
      const items = Array.isArray(data) ? data : [];
      // newest first by Timestamp if present
      items.sort((a,b)=>String(b["Timestamp"]||"").localeCompare(String(a["Timestamp"]||"")));
      setSubs(items);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function act(submissionId, action) {
    setBusyId(submissionId);
    setErr("");
    try {
      const res = await fetchJSON(API.submissions, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ action, submissionId })
      });
      // small pause so Google Sheets catches up; then refresh
      await sleep(400);
      await load();
      alert(`${action === "approve" ? "Approved" : "Rejected"} ✔`);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusyId("");
    }
  }

  return (
    <Shell right={<a href="#/"><Button>← Back</Button></a>}>
      <ErrorBar error={err} onClose={() => setErr("")} />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Admin — Profile Requests</h1>
        <p className="text-sm text-black/60">Approve or reject submissions. Newest first.</p>
      </div>

      <Card>
        {loading ? (
          <div>Loading…</div>
        ) : subs.length === 0 ? (
          <div>No submissions.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-black/10">
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2 pr-4">Manager</th>
                  <th className="py-2 pr-4">Club</th>
                  <th className="py-2 pr-4">Division</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((r) => {
                  const id = r["Request ID"];
                  const status = (r["Status"] || "").toLowerCase();
                  const when = r["Timestamp"] ? new Date(r["Timestamp"]).toLocaleString() : "";
                  return (
                    <tr key={id} className="border-b border-black/5 align-top">
                      <td className="py-2 pr-4 whitespace-nowrap">{when}</td>
                      <td className="py-2 pr-4">{r["Manager Name"]}</td>
                      <td className="py-2 pr-4">{r["Club Name"]}</td>
                      <td className="py-2 pr-4">{r["Division"]}</td>
                      <td className="py-2 pr-4">
                        {status === "approved" ? <Badge tone="good">approved</Badge>
                          : status === "rejected" ? <Badge tone="bad">rejected</Badge>
                          : <Badge tone="warn">pending</Badge>}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => act(id, "approve")}
                            disabled={busyId === id || status === "approved"}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700"
                          >
                            {busyId === id ? "Working…" : "Approve"}
                          </Button>
                          <Button
                            onClick={() => act(id, "reject")}
                            disabled={busyId === id || status === "rejected"}
                            className="bg-rose-600 text-white hover:bg-rose-700 border-rose-700"
                          >
                            {busyId === id ? "Working…" : "Reject"}
                          </Button>
                        </div>
                        <div className="text-[11px] text-black/50 mt-1 select-all">{id}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Shell>
  );
}

/* -------------------------------------------------------
   Profile (read-only from /api/manager?id=…)
--------------------------------------------------------*/
function Profile({ slug }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const json = await fetchJSON(API.manager(slug));
        if (mounted) setData(json);
      } catch (e) {
        setErr(e.message || String(e));
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  return (
    <Shell right={<a href="#/"><Button>← Back</Button></a>}>
      <ErrorBar error={err} onClose={() => setErr("")} />
      {!data ? (
        <Card>Loading…</Card>
      ) : data.error ? (
        <Card>Error: {data.error}</Card>
      ) : (
        <div className="grid gap-4">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">{data.name}</h1>
                <div className="text-black/60">{data.club}</div>
                <div className="mt-2 flex gap-2">
                  {data.division ? <Badge>Div {data.division}</Badge> : null}
                  <Badge tone="info">{data.type || "rising"}</Badge>
                </div>
              </div>
            </div>
            <p className="italic mt-4">“{data.signature || "—"}”</p>
          </Card>

          <Card>
            <h2 className="font-semibold mb-2">Story</h2>
            <div className="whitespace-pre-wrap">{data.story || "—"}</div>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <h3 className="font-semibold mb-2">Career Highlights</h3>
              <div className="whitespace-pre-wrap">{data.careerHighlights || "—"}</div>
            </Card>
            <Card>
              <h3 className="font-semibold mb-2">Favourite Formation</h3>
              <div>{data.favouriteFormation || "—"}</div>
            </Card>
            <Card>
              <h3 className="font-semibold mb-2">Tactical Philosophy</h3>
              <div className="whitespace-pre-wrap">{data.tacticalPhilosophy || "—"}</div>
            </Card>
            <Card>
              <h3 className="font-semibold mb-2">Most Memorable Moment</h3>
              <div className="whitespace-pre-wrap">{data.memorableMoment || "—"}</div>
            </Card>
            <Card>
              <h3 className="font-semibold mb-2">Most Feared Opponent</h3>
              <div>{data.fearedOpponent || "—"}</div>
            </Card>
            <Card>
              <h3 className="font-semibold mb-2">Future Ambitions</h3>
              <div className="whitespace-pre-wrap">{data.ambitions || "—"}</div>
            </Card>
          </div>
        </div>
      )}
    </Shell>
  );
}

/* -------------------------------------------------------
   Very tiny hash-router
--------------------------------------------------------*/
export default function App() {
  const [route, setRoute] = useState(() => window.location.hash || "#/");

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const content = useMemo(() => {
    if (route.startsWith("#/request")) return <RequestForm />;
    if (route.startsWith("#/profile/")) {
      const slug = decodeURIComponent(route.replace("#/profile/", ""));
      return <Profile slug={slug} />;
    }
    if (route.startsWith("#/admin")) return <AdminPanel />;
    return <Home />;
  }, [route]);

  return content;
}
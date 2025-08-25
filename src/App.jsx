import React, { useEffect, useMemo, useState } from "react";

/** ---------- Utilities ---------- */
const slugify = (s="") =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");

const fmt = {
  int: (n) => (Number.isFinite(n) ? Number(n).toLocaleString() : "0"),
  avg: (n) => (Number.isFinite(n) ? Number(n).toFixed(2) : "0.00"),
};

/** ---------- API ---------- */
async function apiListManagers() {
  const r = await fetch("/api/managers");
  if (!r.ok) throw new Error("Failed to load managers");
  return r.json();
}

async function apiGetManager(id) {
  const r = await fetch(`/api/manager?id=${encodeURIComponent(id)}`);
  if (!r.ok) throw new Error("Manager not found");
  return r.json();
}

async function apiSubmitProfile(payload) {
  const r = await fetch("/api/profile-request", {
    method:"POST",
    headers: { "Content-Type":"application/json", "Accept":"application/json" },
    body: JSON.stringify(payload)
  });
  const data = await r.json().catch(()=>({}));
  if (!r.ok || !data.success) {
    throw new Error(data?.error || "Failed to submit");
  }
  return data; // { success, id, message }
}

/** ---------- “Panini/Top-Trumps” card component ---------- */
function ProfileCard({ m, onOpen }) {
  const type = (m.type || "rising").toLowerCase();
  return (
    <div className="card" onClick={()=>onOpen?.(m)} role="button" tabIndex={0}>
      <div className="figure">
        {m.imageUrl
          ? <img src={m.imageUrl} alt={`${m.name} photo`} loading="lazy"/>
          : <span>🧑‍✈️</span>}
      </div>

      <h3 className="card-title">{m.name}</h3>
      <div className="card-sub">{m.club}</div>

      <div className="badges">
        <span className="badge">Div {m.division || "—"}</span>
        <span className="badge type">{type.charAt(0).toUpperCase()+type.slice(1)}</span>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:".5rem", margin:"0 0 .5rem"}}>
        <div className="stat"><div className="n" style={{color:"#ef4444"}}>{fmt.int(m.points||0)}</div><div>Points</div></div>
        <div className="stat"><div className="n" style={{color:"#2563eb"}}>{fmt.int(m.games||0)}</div><div>Games</div></div>
        <div className="stat"><div className="n" style={{color:"#7c3aed"}}>{fmt.avg(m.avgPoints||0)}</div><div>Avg</div></div>
      </div>

      {m.careerHighlights && (
        <div style={{fontStyle:"italic", color:"#4b5563"}}>
          “{m.careerHighlights.length>120 ? m.careerHighlights.slice(0,120)+"…" : m.careerHighlights}”
        </div>
      )}

      <div style={{marginTop:".75rem", textAlign:"center"}}>
        <a
          className="btn"
          href={`#/profile/${encodeURIComponent(m.id || slugify(m.name))}`}
          onClick={(e)=>e.stopPropagation()}
        >
          View Profile →
        </a>
      </div>
    </div>
  );
}

/** ---------- Header ---------- */
function Header() {
  return (
    <div className="header">
      <div className="header-inner">
        <div className="brand">🏆 Manager Profiles</div>
        <div style={{display:"flex", gap:".5rem", flexWrap:"wrap"}}>
          <a className="btn ghost" href="https://smtop100.blog">Main Site</a>
          <a className="btn secondary" href="https://legends.smtop100.blog">Legends</a>
          <a className="btn" href="#/request">Submit Profile</a>
        </div>
      </div>
    </div>
  );
}

/** ---------- Home (featured + search) ---------- */
function Home() {
  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(()=>{
    (async ()=>{
      try{
        setLoading(true);
        const rows = await apiListManagers();
        setAll(Array.isArray(rows)? rows : []);
        setErr("");
      }catch(e){ setErr(String(e.message||e)); }
      finally{ setLoading(false); }
    })();
  },[]);

  const featured = useMemo(()=>{
    if (all.length<=2) return all;
    const idxs = new Set();
    while (idxs.size<2) idxs.add(Math.floor(Math.random()*all.length));
    return [...idxs].map(i=>all[i]);
  },[all]);

  const filtered = useMemo(()=>{
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return all.filter(m=>{
      const blob = [
        m.name, m.club, m.favouriteFormation,
        m.tacticalPhilosophy, m.careerHighlights, m.story
      ].filter(Boolean).join(" ").toLowerCase();
      return blob.includes(term);
    }).slice(0,24);
  },[all,q]);

  return (
    <>
      <Header/>
      <div className="container">
        <div className="panel" style={{padding:"1.25rem", marginBottom:"1.25rem"}}>
          <h1 style={{margin:"0 0 .5rem", color:"#111"}}>TOP 100 MANAGER PROFILES</h1>
          <p style={{margin:"0", color:"#374151"}}>
            Celebrating 25 seasons of Soccer Manager Worlds excellence.
          </p>
        </div>

        <div className="panel" style={{padding:"1rem", marginBottom:"1.25rem"}}>
          <div className="controls">
            <div>
              <label style={{fontWeight:700, display:"block", marginBottom:".4rem"}}>Search</label>
              <input className="input" placeholder="Search by name, club, formation, anything…" value={q} onChange={e=>setQ(e.target.value)}/>
            </div>
            <div style={{alignSelf:"end"}}>
              <a className="btn" href="#/request">Submit your profile</a>
            </div>
          </div>
        </div>

        {loading && <div className="panel" style={{padding:"1rem"}}>Loading…</div>}
        {err && <div className="panel" style={{padding:"1rem", color:"#b91c1c", background:"#fee2e2"}}>Error: {err}</div>}

        {!loading && !err && (
          <>
            <h2 style={{color:"#111"}}>Featured</h2>
            <div className="grid">
              {featured.map(m=>(
                <ProfileCard key={m.id || m.name} m={m}/>
              ))}
            </div>

            {q && (
              <>
                <h2 style={{marginTop:"2rem", color:"#111"}}>Search results</h2>
                <div className="grid">
                  {filtered.map(m=>(
                    <ProfileCard key={"s-"+(m.id||m.name)} m={m}/>
                  ))}
                  {filtered.length===0 && <div className="panel" style={{padding:"1rem"}}>No matches.</div>}
                </div>
              </>
            )}
          </>
        )}

        <div className="footer">
          ⚽ Part of the Top 100 Community • Est. 2015
        </div>
      </div>
    </>
  );
}

/** ---------- Profile page ---------- */
function ProfilePage({ id }) {
  const [m, setM] = useState(null);
  const [err, setErr] = useState("");

  useEffect(()=>{
    (async ()=>{
      try{
        const row = await apiGetManager(id);
        setM(row); setErr("");
      }catch(e){ setErr(String(e.message||e)); }
    })();
  },[id]);

  if (err) return (<><Header/><div className="container"><div className="panel" style={{padding:"1rem"}}>Error: {err}</div></div></>);
  if (!m) return (<><Header/><div className="container"><div className="panel" style={{padding:"1rem"}}>Loading…</div></div></>);

  const type = (m.type||"rising").toLowerCase();

  return (
    <>
      <Header/>
      <div className="container">
        <a href="#/" className="btn ghost" style={{marginBottom:"1rem"}}>← Back</a>

        <div className="panel" style={{padding:"1.25rem"}}>
          <div style={{display:"grid", gridTemplateColumns:"minmax(220px, 360px) 1fr", gap:"1rem", alignItems:"start"}}>
            <div>
              <div className="figure" style={{aspectRatio:"3/4"}}>
                {m.imageUrl ? <img src={m.imageUrl} alt={`${m.name} photo`}/> : <span>🧑‍✈️</span>}
              </div>
            </div>
            <div>
              <h1 style={{margin:0}}>{m.name}</h1>
              <div style={{color:"#6b7280", marginBottom:".75rem"}}>{m.club}</div>
              <div className="badges" style={{marginBottom:"1rem"}}>
                <span className="badge">Division {m.division || "—"}</span>
                <span className="badge type">{type.charAt(0).toUpperCase()+type.slice(1)}</span>
              </div>

              <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:".75rem", margin:"0 0 1rem"}}>
                <div className="stat"><div className="n" style={{color:"#ef4444"}}>{fmt.int(m.points||0)}</div><div>Total Points</div></div>
                <div className="stat"><div className="n" style={{color:"#2563eb"}}>{fmt.int(m.games||0)}</div><div>Games Played</div></div>
                <div className="stat"><div className="n" style={{color:"#7c3aed"}}>{fmt.avg(m.avgPoints||0)}</div><div>Avg Points</div></div>
              </div>

              {m.careerHighlights && (<section style={{marginBottom:"1rem"}}>
                <h3>Career Highlights</h3>
                <p style={{whiteSpace:"pre-line"}}>{m.careerHighlights}</p>
              </section>)}

              {m.favouriteFormation && (<section style={{marginBottom:"1rem"}}>
                <h3>Favourite Formation</h3>
                <p>{m.favouriteFormation}</p>
              </section>)}

              {m.tacticalPhilosophy && (<section style={{marginBottom:"1rem"}}>
                <h3>Tactical Philosophy</h3>
                <p style={{whiteSpace:"pre-line"}}>{m.tacticalPhilosophy}</p>
              </section>)}

              {m.memorableMoment && (<section style={{marginBottom:"1rem"}}>
                <h3>Most Memorable Moment</h3>
                <p style={{whiteSpace:"pre-line"}}>{m.memorableMoment}</p>
              </section>)}

              {m.fearedOpponent && (<section style={{marginBottom:"1rem"}}>
                <h3>Most Feared Opponent</h3>
                <p>{m.fearedOpponent}</p>
              </section>)}

              {m.ambitions && (<section style={{marginBottom:"1rem"}}>
                <h3>Future Ambitions</h3>
                <p style={{whiteSpace:"pre-line"}}>{m.ambitions}</p>
              </section>)}

              {m.story && (<section>
                <h3>Top 100 Journey</h3>
                <p style={{whiteSpace:"pre-line"}}>{m.story}</p>
              </section>)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** ---------- Request form (MVP: immediate publish) ---------- */
function RequestForm() {
  const [form, setForm] = useState({
    managerName:"", clubName:"", division:"", managerType:"rising",
    totalPoints:"", gamesPlayed:"", imageUrl:"",
    favouriteFormation:"", tacticalPhilosophy:"",
    careerHighlights:"", mostMemorableMoment:"",
    mostFearedOpponent:"", futureAmbitions:"",
    story:""
  });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (k) => (e)=> setForm(s=>({...s, [k]: e.target.value}));

  const submit = async (e)=>{
    e.preventDefault();
    setMsg(""); setBusy(true);
    try{
      const payload = {
        "Manager Name": form.managerName,
        "Club Name": form.clubName,
        "Division": form.division,
        "Type": form.managerType,
        "Total Points": form.totalPoints,
        "Games Played": form.gamesPlayed,
        "Favourite Formation": form.favouriteFormation,
        "Tactical Philosophy": form.tacticalPhilosophy,
        "Career Highlights": form.careerHighlights,
        "Most Memorable Moment": form.mostMemorableMoment,
        "Most Feared Opponent": form.mostFearedOpponent,
        "Future Ambitions": form.futureAmbitions,
        "Story": form.story,
        "Image URL": form.imageUrl
      };
      const res = await apiSubmitProfile(payload);
      setMsg(res.message || "Submitted!");
      if (res.id) window.location.hash = `#/profile/${encodeURIComponent(res.id)}`;
    }catch(e){ setMsg(String(e.message||e)); }
    finally{ setBusy(false); }
  };

  return (
    <>
      <Header/>
      <div className="container">
        <a href="#/" className="btn ghost" style={{marginBottom:"1rem"}}>← Back</a>
        <div className="panel" style={{padding:"1.25rem"}}>
          <h1 style={{marginTop:0}}>Submit Your Manager Profile</h1>
          {msg && <div className="panel" style={{padding:".75rem", background:"#ecfeff", margin:"0 0 1rem"}}>{msg}</div>}
          <form onSubmit={submit}>
            <div className="controls" style={{marginBottom:"1rem"}}>
              <div>
                <label>Manager Name *</label>
                <input className="input" required value={form.managerName} onChange={update("managerName")}/>
              </div>
              <div>
                <label>Club Name *</label>
                <input className="input" required value={form.clubName} onChange={update("clubName")}/>
              </div>
              <div>
                <label>Division</label>
                <select className="select" value={form.division} onChange={update("division")}>
                  <option value="">—</option>
                  <option value="1">Division 1</option>
                  <option value="2">Division 2</option>
                  <option value="3">Division 3</option>
                  <option value="4">Division 4</option>
                  <option value="5">Division 5</option>
                </select>
              </div>
              <div>
                <label>Manager Type</label>
                <select className="select" value={form.managerType} onChange={update("managerType")}>
                  <option value="legend">Legend</option>
                  <option value="elite">Elite</option>
                  <option value="rising">Rising</option>
                  <option value="veteran">Veteran</option>
                </select>
              </div>
              <div>
                <label>Total Points</label>
                <input className="input" inputMode="numeric" value={form.totalPoints} onChange={update("totalPoints")}/>
              </div>
              <div>
                <label>Games Played</label>
                <input className="input" inputMode="numeric" value={form.gamesPlayed} onChange={update("gamesPlayed")}/>
              </div>
              <div>
                <label>Image URL (optional)</label>
                <input className="input" placeholder="https://…" value={form.imageUrl} onChange={update("imageUrl")}/>
              </div>
            </div>

            <div className="controls" style={{marginBottom:"1rem"}}>
              <div>
                <label>Favourite Formation</label>
                <input className="input" value={form.favouriteFormation} onChange={update("favouriteFormation")}/>
              </div>
              <div>
                <label>Most Feared Opponent</label>
                <input className="input" value={form.mostFearedOpponent} onChange={update("mostFearedOpponent")}/>
              </div>
            </div>

            <div style={{display:"grid", gap:"1rem"}}>
              <div>
                <label>Career Highlights</label>
                <textarea className="textarea" rows="3" value={form.careerHighlights} onChange={update("careerHighlights")}/>
              </div>
              <div>
                <label>Tactical Philosophy</label>
                <textarea className="textarea" rows="3" value={form.tacticalPhilosophy} onChange={update("tacticalPhilosophy")}/>
              </div>
              <div>
                <label>Most Memorable Moment</label>
                <textarea className="textarea" rows="3" value={form.mostMemorableMoment} onChange={update("mostMemorableMoment")}/>
              </div>
              <div>
                <label>Future Ambitions</label>
                <textarea className="textarea" rows="3" value={form.futureAmbitions} onChange={update("futureAmbitions")}/>
              </div>
              <div>
                <label>Your Top 100 Story</label>
                <textarea className="textarea" rows="6" value={form.story} onChange={update("story")}/>
              </div>
            </div>

            <div style={{marginTop:"1rem"}}>
              <button className="btn" disabled={busy}>{busy ? "Submitting…" : "Submit Profile"}</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/** ---------- App (hash router) ---------- */
export default function App(){
  const [route, setRoute] = useState(()=>window.location.hash || "#/");
  useEffect(()=>{
    const onHash = ()=> setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return ()=> window.removeEventListener("hashchange", onHash);
  },[]);

  // parse route
  const match = route.match(/^#\/profile\/(.+)$/);
  const isRequest = route === "#/request";
  const profileId = match ? decodeURIComponent(match[1]) : null;

  if (isRequest) return <RequestForm/>;
  if (profileId) return <ProfilePage id={profileId}/>;
  return <Home/>;
}
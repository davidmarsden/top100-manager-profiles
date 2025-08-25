import React, { useEffect, useMemo, useState } from "react";

/* --------------------------- helpers --------------------------- */

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatPoints = (n) => (Number.isFinite(n) ? Number(n).toLocaleString() : "0");
const formatAvgPoints = (n) =>
  Number.isFinite(n) ? Number(n).toFixed(2) : "0.00";

const badgeStyle = (kind, value) => {
  if (kind === "division") {
    const d = Number(value);
    const map = {
      1: { background: "#fbbf24", color: "#92400e" },
      2: { background: "#d1d5db", color: "#374151" },
      3: { background: "#d97706", color: "#fbbf24" },
      4: { background: "#10b981", color: "#064e3b" },
      5: { background: "#3b82f6", color: "#dbeafe" },
    };
    return map[d] || { background: "#6b7280", color: "#fff" };
  }
  const t = String(value || "rising").toLowerCase();
  const map = {
    legend: { background: "#7c3aed", color: "#e5e7eb" },
    elite: { background: "#dc2626", color: "#fee2e2" },
    rising: { background: "#2563eb", color: "#dbeafe" },
    veteran: { background: "#059669", color: "#d1fae5" },
  };
  return map[t] || { background: "#6b7280", color: "#fff" };
};

/* ------------------------ Request Form ------------------------ */

function RequestForm() {
  const [form, setForm] = useState({
    managerName: "",
    clubName: "",
    division: "",
    type: "rising",
    points: "",
    games: "",
    favouriteFormation: "",
    tacticalPhilosophy: "",
    careerHighlights: "",
    mostMemorableMoment: "",
    mostFearedOpponent: "",
    futureAmbitions: "",
    story: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const payload = {
        "Manager Name": form.managerName,
        "Club Name": form.clubName,
        Division: form.division,
        Type: form.type,
        Points: form.points,
        Games: form.games,
        "Favourite Formation": form.favouriteFormation,
        "Tactical Philosophy": form.tacticalPhilosophy,
        "Career Highlights": form.careerHighlights,
        "Most Memorable Moment": form.mostMemorableMoment,
        "Most Feared Opponent": form.mostFearedOpponent,
        "Future Ambitions": form.futureAmbitions,
        Story: form.story,
      };

      const res = await fetch("/api/profile-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Server returned non-JSON (check function routing / redirects)."
        );
      }

      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Submission failed");
      }
      setResult({ ok: true, message: "Submitted! Pending review/publish." });
      setForm((f) => ({ ...f, story: f.story })); // keep text, but you can clear if you want
    } catch (err) {
      setResult({ ok: false, message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
        color: "#333",
      }}
    >
      <div
        style={{
          background: "linear-gradient(to right, #ff9a9e, #fecfef)",
          borderBottom: "2px solid rgba(255,255,255,.3)",
          boxShadow: "0 4px 20px rgba(0,0,0,.1)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "1rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            style={{ color: "#fff", textDecoration: "none" }}
          >
            ← Back to Managers
          </a>
          <div style={{ color: "#fff", fontWeight: 700 }}>Submit Profile</div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
        <form
          onSubmit={submit}
          style={{
            background: "rgba(255,255,255,.95)",
            borderRadius: 16,
            padding: "1.5rem",
            boxShadow: "0 8px 32px rgba(0,0,0,.1)",
          }}
        >
          <h1 style={{ marginTop: 0 }}>Submit Your Manager Profile</h1>

          {result && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: 8,
                background: result.ok ? "#ecfdf5" : "#fee2e2",
                color: result.ok ? "#065f46" : "#991b1b",
              }}
            >
              {result.message}
            </div>
          )}

          <Field
            label="Manager Name *"
            value={form.managerName}
            onChange={update("managerName")}
            required
          />
          <Field
            label="Club Name *"
            value={form.clubName}
            onChange={update("clubName")}
            required
          />

          <Row>
            <Select
              label="Division"
              value={form.division}
              onChange={update("division")}
              options={[
                ["", "—"],
                ["1", "Division 1"],
                ["2", "Division 2"],
                ["3", "Division 3"],
                ["4", "Division 4"],
                ["5", "Division 5"],
              ]}
            />
            <Select
              label="Manager Type"
              value={form.type}
              onChange={update("type")}
              options={[
                ["rising", "Rising Star"],
                ["veteran", "Veteran"],
                ["elite", "Elite"],
                ["legend", "Legend"],
              ]}
            />
            <Field label="Total Points" value={form.points} onChange={update("points")} />
            <Field label="Games Played" value={form.games} onChange={update("games")} />
          </Row>

          <Field
            label="Favourite Formation"
            value={form.favouriteFormation}
            onChange={update("favouriteFormation")}
          />
          <TextArea
            label="Career Highlights"
            value={form.careerHighlights}
            onChange={update("careerHighlights")}
          />
          <TextArea
            label="Tactical Philosophy"
            value={form.tacticalPhilosophy}
            onChange={update("tacticalPhilosophy")}
          />
          <TextArea
            label="Most Memorable Moment"
            value={form.mostMemorableMoment}
            onChange={update("mostMemorableMoment")}
          />
          <Field
            label="Most Feared Opponent"
            value={form.mostFearedOpponent}
            onChange={update("mostFearedOpponent")}
          />
          <TextArea
            label="Future Ambitions"
            value={form.futureAmbitions}
            onChange={update("futureAmbitions")}
          />
          <TextArea
            label="Your Top 100 Story"
            value={form.story}
            onChange={update("story")}
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.25rem",
              border: "none",
              borderRadius: 10,
              background: "#ef476f",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Submitting…" : "Submit Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---- tiny form primitives ---- */

function Row({ children }) {
  return {
    ...children,
    type: "div",
    props: {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "0.75rem",
        marginBottom: "0.75rem",
      },
      children,
    },
  };
}

function Field({ label, value, onChange, required }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
        {label}
      </label>
      <input
        value={value}
        onChange={onChange}
        required={required}
        style={{
          width: "100%",
          padding: "0.75rem",
          borderWidth: "2px",
          borderStyle: "solid",
          borderColor: "#e5e7eb",
          borderRadius: 8,
          fontSize: "1rem",
        }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "0.75rem",
          borderWidth: "2px",
          borderStyle: "solid",
          borderColor: "#e5e7eb",
          borderRadius: 8,
          fontSize: "1rem",
          background: "#fff",
        }}
      >
        {options.map(([val, text]) => (
          <option key={val} value={val}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        rows={4}
        style={{
          width: "100%",
          padding: "0.75rem",
          borderWidth: "2px",
          borderStyle: "solid",
          borderColor: "#e5e7eb",
          borderRadius: 8,
          fontSize: "1rem",
        }}
      />
    </div>
  );
}

/* ------------------------------ App ------------------------------ */

const App = () => {
  const [managers, setManagers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // fetch managers
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/managers");
        const data = await res.json().catch(() => []);
        const normalized = (Array.isArray(data) ? data : []).map((m) => {
          const points = Number(m.points || 0);
          const games = Number(m.games || 0);
          const avg =
            m.avgPoints != null ? Number(m.avgPoints) : games ? points / games : 0;
          return {
            id: m.id || slugify(m.name),
            name: m.name || "",
            club: m.club || "",
            division: String(m.division ?? ""),
            type: String(m.type || "rising").toLowerCase(),
            points,
            games,
            avgPoints: Number(avg),
            signature: m.signature || "",
            story: m.story || "",
            // extended (optional)
            careerHighlights: m.careerHighlights || "",
            favouriteFormation: m.favouriteFormation || "",
            tacticalPhilosophy: m.tacticalPhilosophy || "",
            memorableMoment: m.memorableMoment || "",
            fearedOpponent: m.fearedOpponent || "",
            ambitions: m.ambitions || "",
          };
        });
        // de-dupe by id
        const seen = new Set();
        const uniq = [];
        for (const row of normalized) {
          if (row.id && !seen.has(row.id)) {
            seen.add(row.id);
            uniq.push(row);
          }
        }
        setManagers(uniq);
        setError("");
      } catch (e) {
        setError("Failed to load managers");
        setManagers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // URL → UI (open profile when landing on /profile/:slug)
  useEffect(() => {
    const openFromPath = () => {
      const m = window.location.pathname.match(/^\/profile\/([^/]+)$/);
      if (m) {
        const slug = decodeURIComponent(m[1]);
        // try to use list cache first
        const local = managers.find((x) => x.id === slug || slugify(x.name) === slug);
        if (local) {
          setSelectedManager(local);
          return;
        }
        // fallback to /api/manager if you have it; else build minimal
        setSelectedManager({
          id: slug,
          name: slug.replace(/-/g, " "),
          club: "",
          division: "",
          type: "rising",
          points: 0,
          games: 0,
          avgPoints: 0,
          signature: "",
          story: "",
        });
      } else {
        setSelectedManager(null);
      }
    };
    openFromPath();
    const onPop = () => openFromPath();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [managers]);

  // filtering
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const next = managers
      .filter((m) => {
        const matchesSearch =
          m.name.toLowerCase().includes(term) ||
          m.club.toLowerCase().includes(term);
        const matchesDivision =
          selectedDivision === "all" ||
          String(m.division) === String(selectedDivision);
        const matchesType =
          selectedType === "all" ||
          String(m.type || "rising").toLowerCase() === selectedType;
        return matchesSearch && matchesDivision && matchesType;
      })
      .sort((a, b) => (b.points || 0) - (a.points || 0));
    setFiltered(next);
  }, [managers, searchTerm, selectedDivision, selectedType]);

  /* ---------- page renderers ---------- */

  const renderProfile = useMemo(() => {
    if (!selectedManager) return null;
    const safeType = String(selectedManager.type || "rising").toLowerCase();
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #064e3b 100%)",
          color: "#f3f4f6",
        }}
      >
        <div
          style={{
            background: "linear-gradient(to right, #ff9a9e, #fecfef)",
            borderBottom: "2px solid rgba(255,255,255,.3)",
            boxShadow: "0 4px 20px rgba(0,0,0,.1)",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "1rem 2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => {
                setSelectedManager(null);
                window.history.pushState(null, "", "/");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: ".5rem",
              }}
            >
                ← Back to Managers
            </button>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.2rem" }}>
              Manager Profile
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
          <div
            style={{
              background: "rgba(255,255,255,.95)",
              borderRadius: 16,
              padding: "2rem",
              boxShadow: "0 20px 40px rgba(0,0,0,.2)",
              color: "#374151",
            }}
          >
            <h1 style={{ fontSize: "2.5rem", margin: 0, color: "#1f2937" }}>
              {selectedManager.name}
            </h1>
            <h2 style={{ marginTop: ".5rem", color: "#6b7280" }}>
              {selectedManager.club}
            </h2>

            <div style={{ display: "flex", gap: "1rem", margin: "1rem 0", flexWrap: "wrap" }}>
              <span
                style={{
                  padding: ".5rem 1rem",
                  borderRadius: 25,
                  fontSize: ".9rem",
                  fontWeight: 700,
                  ...badgeStyle("division", selectedManager.division),
                }}
              >
                Division {selectedManager.division || "—"}
              </span>
              <span
                style={{
                  padding: ".5rem 1rem",
                  borderRadius: 25,
                  fontSize: ".9rem",
                  fontWeight: 700,
                  ...badgeStyle("type", safeType),
                }}
              >
                {safeType.charAt(0).toUpperCase() + safeType.slice(1)}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <Stat
                label="Total Points"
                value={formatPoints(selectedManager.points || 0)}
                bubble="#f0fdf4"
                color="#166534"
              />
              <Stat
                label="Games Played"
                value={formatPoints(selectedManager.games || 0)}
                bubble="#eff6ff"
                color="#1e40af"
              />
              <Stat
                label="Avg Points"
                value={formatAvgPoints(selectedManager.avgPoints || 0)}
                bubble="#faf5ff"
                color="#7c2d12"
              />
            </div>

            {selectedManager.careerHighlights && (
              <TextBlock title="Career Highlights" body={selectedManager.careerHighlights} />
            )}
            {selectedManager.favouriteFormation && (
              <TextBlock title="Favourite Formation" body={selectedManager.favouriteFormation} />
            )}
            {selectedManager.tacticalPhilosophy && (
              <TextBlock title="Tactical Philosophy" body={selectedManager.tacticalPhilosophy} />
            )}
            {selectedManager.memorableMoment && (
              <TextBlock title="Most Memorable Moment" body={selectedManager.memorableMoment} />
            )}
            {selectedManager.fearedOpponent && (
              <TextBlock title="Most Feared Opponent" body={selectedManager.fearedOpponent} />
            )}
            {selectedManager.ambitions && (
              <TextBlock title="Future Ambitions" body={selectedManager.ambitions} />
            )}

            {selectedManager.signature && (
              <div style={{ marginTop: "1.25rem" }}>
                <h3 style={{ margin: 0, color: "#1f2937" }}>Signature Style</h3>
                <p
                  style={{
                    marginTop: ".5rem",
                    fontStyle: "italic",
                    borderLeft: "4px solid #ff9a9e",
                    paddingLeft: "1rem",
                    color: "#4b5563",
                  }}
                >
                  “{selectedManager.signature}”
                </p>
              </div>
            )}

            {selectedManager.story && (
              <div style={{ marginTop: "1.25rem" }}>
                <h3 style={{ margin: 0, color: "#1f2937" }}>Top 100 Journey</h3>
                <p style={{ whiteSpace: "pre-line", color: "#4b5563", marginTop: ".5rem" }}>
                  {selectedManager.story}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [selectedManager]);

  const renderList = useMemo(() => {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
          color: "#333",
        }}
      >
        <Header />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
          <Hero />

          <div
            style={{
              background: "rgba(255,255,255,.95)",
              borderRadius: 12,
              padding: "1.5rem",
              marginBottom: "2rem",
              boxShadow: "0 8px 32px rgba(0,0,0,.1)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "1rem",
              }}
            >
              <div>
                <Label>Search Managers</Label>
                <input
                  type="text"
                  placeholder="Search by name or club..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <Label>Division</Label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  style={selectStyle}
                >
                  <option value="all">All Divisions</option>
                  <option value="1">Division 1</option>
                  <option value="2">Division 2</option>
                  <option value="3">Division 3</option>
                  <option value="4">Division 4</option>
                  <option value="5">Division 5</option>
                </select>
              </div>
              <div>
                <Label>Manager Type</Label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={selectStyle}
                >
                  <option value="all">All Types</option>
                  <option value="legend">Legend</option>
                  <option value="elite">Elite</option>
                  <option value="rising">Rising Star</option>
                  <option value="veteran">Veteran</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                padding: "1rem",
                borderRadius: 8,
                marginBottom: "1rem",
              }}
            >
              ⚠️ API Error: {error}
            </div>
          )}

          <div style={{ textAlign: "center", marginBottom: "1.5rem", color: "#fff" }}>
            Showing {filtered.length} of {managers.length} managers
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#fff" }}>
              Loading managers…
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {filtered.map((m) => {
                const slug = m.id || slugify(m.name);
                const safeType = String(m.type || "rising").toLowerCase();
                return (
                  <div
                    key={slug}
                    style={{
                      background: "rgba(255,255,255,.95)",
                      borderRadius: 12,
                      padding: "1.5rem",
                      boxShadow: "0 8px 32px rgba(0,0,0,.1)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "1rem",
                      }}
                    >
                      <div>
                        <h3 style={{ margin: 0, color: "#1f2937" }}>{m.name}</h3>
                        <p style={{ margin: 0, color: "#6b7280" }}>{m.club}</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                        <span
                          style={{
                            padding: ".25rem .75rem",
                            borderRadius: 12,
                            fontSize: ".8rem",
                            fontWeight: 700,
                            ...badgeStyle("division", m.division),
                          }}
                        >
                          Div {m.division || "—"}
                        </span>
                        <span
                          style={{
                            padding: ".25rem .75rem",
                            borderRadius: 12,
                            fontSize: ".8rem",
                            fontWeight: 700,
                            ...badgeStyle("type", safeType),
                          }}
                        >
                          {safeType}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "1rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <MiniStat label="Points" value={formatPoints(m.points || 0)} color="#ff9a9e" />
                      <MiniStat label="Games" value={formatPoints(m.games || 0)} color="#2563eb" />
                      <MiniStat
                        label="Avg"
                        value={formatAvgPoints(m.avgPoints || 0)}
                        color="#7c2d12"
                      />
                    </div>

                    {m.signature && (
                      <p
                        style={{
                          fontStyle: "italic",
                          color: "#4b5563",
                          marginBottom: "1rem",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        “{m.signature}”
                      </p>
                    )}

                    <div style={{ textAlign: "center" }}>
                      <a
                        href={`/profile/${slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const target = managers.find(
                            (x) => x.id === slug || slugify(x.name) === slug
                          );
                          if (target) setSelectedManager(target);
                          window.history.pushState(null, "", `/profile/${slug}`);
                          window.dispatchEvent(new PopStateEvent("popstate"));
                        }}
                        style={{ color: "#ef476f", fontWeight: 600 }}
                      >
                        View Profile →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "#fff" }}>
              No managers found
            </div>
          )}

          <Footer />
        </div>
      </div>
    );
  }, [
    loading,
    error,
    filtered,
    managers,
    searchTerm,
    selectedDivision,
    selectedType,
    setSelectedManager,
  ]);

  /* -------------------------- tiny components -------------------------- */

  const Header = () => (
    <div
      style={{
        background: "linear-gradient(to right, #ff9a9e, #fecfef)",
        borderBottom: "2px solid rgba(255,255,255,.3)",
        boxShadow: "0 4px 20px rgba(0,0,0,.1)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <a
            href="https://smtop100.blog"
            style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}
          >
            ← Back to Main Site
          </a>
          <span style={{ color: "rgba(255,255,255,.7)" }}>|</span>
          <a
            href="/request"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, "", "/request");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}
          >
            Submit Profile
          </a>
        </div>
        <div style={{ color: "#fff", fontWeight: 700 }}>Manager Profiles</div>
      </div>
    </div>
  );

  const Hero = () => (
    <div style={{ textAlign: "center", marginBottom: "3rem" }}>
      <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 3rem)",
          fontWeight: 800,
          marginBottom: "1rem",
          color: "#f9fafb",
        }}
      >
        🏆 TOP 100 MANAGER PROFILES 🏆
      </h1>
      <p
        style={{
          fontSize: "1.2rem",
          maxWidth: 700,
          margin: "0 auto",
          lineHeight: 1.6,
          color: "#fff",
        }}
      >
        Celebrating 25 seasons of Soccer Manager Worlds excellence. Discover the
        stories, achievements, and legendary journeys of our Top 100 community’s
        finest managers.
      </p>
    </div>
  );

  const Footer = () => (
    <div style={{ textAlign: "center", marginTop: "4rem", paddingBottom: "2rem" }}>
      <p style={{ fontSize: "1.1rem", marginBottom: ".5rem", color: "#fff" }}>
        ⚽ Celebrating 25 Seasons of Soccer Manager Worlds Excellence ⚽
      </p>
      <p style={{ color: "rgba(255,255,255,.8)" }}>
        Part of the Top 100 Community • Est. 2015
      </p>
    </div>
  );

  const Stat = ({ label, value, bubble, color }) => (
    <div style={{ textAlign: "center", padding: "1rem", background: bubble, borderRadius: 8 }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: ".95rem", opacity: 0.9 }}>{label}</div>
    </div>
  );

  const MiniStat = ({ label, value, color }) => (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: ".8rem", color: "#6b7280" }}>{label}</div>
    </div>
  );

  const TextBlock = ({ title, body }) => (
    <div style={{ marginTop: "1rem" }}>
      <h3 style={{ margin: 0, color: "#1f2937" }}>{title}</h3>
      <p style={{ whiteSpace: "pre-line", color: "#4b5563", marginTop: ".5rem" }}>{body}</p>
    </div>
  );

  const Label = ({ children }) => (
    <label style={{ display: "block", marginBottom: ".5rem", fontWeight: 600, color: "#374151" }}>
      {children}
    </label>
  );

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    fontSize: "1rem",
  };

  const selectStyle = inputStyle;

  /* ------------------------- simple view switch ------------------------- */

  const path =
    typeof window !== "undefined" && window.location && window.location.pathname
      ? window.location.pathname
      : "/";

  const isRequestPage = path === "/request";

  return (
    <>
      {isRequestPage ? (
        <RequestForm />
      ) : selectedManager ? (
        renderProfile
      ) : (
        renderList
      )}
    </>
  );
};

export default App;

import React, { useEffect, useState } from "react";

import RequestForm from "./RequestForm.jsx";

const App = () => {
  const [managers, setManagers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- helpers ----------
  const slugify = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const formatPoints = (n) =>
    typeof n === "number" && Number.isFinite(n) ? n.toLocaleString() : "0";

  const formatAvgPoints = (n) =>
    typeof n === "number" && Number.isFinite(n) ? n.toFixed(2) : "0.00";

  const getBadgeStyle = (kind, value) => {
    if (kind === "division") {
      const d = Number(value);
      const colors = {
        1: { background: "#fbbf24", color: "#92400e" },
        2: { background: "#d1d5db", color: "#374151" },
        3: { background: "#d97706", color: "#fbbf24" },
        4: { background: "#10b981", color: "#064e3b" },
        5: { background: "#3b82f6", color: "#0b4aa6" },
      };
      return colors[d] || { background: "#6b7280", color: "white" };
    }
    // kind === "type"
    const t = String(value || "rising").toLowerCase();
    const colors = {
      legend: { background: "#7c3aed", color: "#e5e7eb" },
      elite: { background: "#dc2626", color: "#fee2e2" },
      rising: { background: "#2563eb", color: "#dbeafe" },
      veteran: { background: "#059669", color: "#d1fae5" },
    };
    return colors[t] || { background: "#6b7280", color: "white" };
  };

  // ---------- data load (list) ----------
  const fetchManagers = async () => {
    try {
      const res = await fetch("/api/managers");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      const norm = (Array.isArray(data) ? data : []).map((m) => {
        const name = String(m.name || "");
        const id = m.id ? String(m.id) : slugify(name);
        const points = Number(m.points || 0);
        const games = Number(m.games || 0);
        const avg =
          m.avgPoints != null && m.avgPoints !== ""
            ? Number(m.avgPoints)
            : games
            ? points / Math.max(1, games)
            : 0;

        return {
          id,
          name,
          club: String(m.club || ""),
          division: String(m.division ?? ""), // keep string for select filter
          type: String(m.type || "rising").toLowerCase(),
          points,
          games,
          avgPoints: Number.isFinite(avg) ? Number(avg) : 0,
          signature: String(m.signature || ""),
          story: String(m.story || ""),

          // extended fields
          careerHighlights: String(m.careerHighlights || ""),
          favouriteFormation: String(m.favouriteFormation || ""),
          tacticalPhilosophy: String(m.tacticalPhilosophy || ""),
          memorableMoment: String(m.memorableMoment || ""),
          fearedOpponent: String(m.fearedOpponent || ""),
          ambitions: String(m.ambitions || ""),
        };
      });

      // de-dupe by id (or slug(name))
      const seen = new Set();
      const deduped = [];
      for (const m of norm) {
        const key = m.id || slugify(m.name);
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(m);
        }
      }

      setManagers(deduped);
      setError("");
    } catch (e) {
      console.error("fetchManagers error:", e);
      setError(e.message || "Failed to load managers");
      setManagers([]); // let UI show empty state
    } finally {
      setLoading(false);
    }
  };

  // ---------- open a single profile by slug ----------
  const openProfileBySlug = async (slug) => {
    try {
      const res = await fetch(`/api/manager?id=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");

      const name = String(data.name || "");
      const id = data.id ? String(data.id) : slugify(name);
      const points = Number(data.points || 0);
      const games = Number(data.games || 0);
      const avg =
        data.avgPoints != null && data.avgPoints !== ""
          ? Number(data.avgPoints)
          : games
          ? points / Math.max(1, games)
          : 0;

      const shaped = {
        id,
        name,
        club: String(data.club || ""),
        division: String(data.division ?? ""),
        type: String(data.type || "rising").toLowerCase(),
        points,
        games,
        avgPoints: Number.isFinite(avg) ? Number(avg) : 0,
        signature: String(data.signature || ""),
        story: String(data.story || ""),

        careerHighlights: String(data.careerHighlights || ""),
        favouriteFormation: String(data.favouriteFormation || ""),
        tacticalPhilosophy: String(data.tacticalPhilosophy || ""),
        memorableMoment: String(data.memorableMoment || ""),
        fearedOpponent: String(data.fearedOpponent || ""),
        ambitions: String(data.ambitions || ""),
      };

      setSelected(shaped);
    } catch (e) {
      console.error("openProfileBySlug error:", e);
      setSelected(null);
    }
  };

  // ---------- reflect URL -> UI on load + back/forward ----------
  useEffect(() => {
    const match = window.location.pathname.match(/^\/profile\/([^/]+)$/);
    if (match) openProfileBySlug(decodeURIComponent(match[1]));

    const onPop = () => {
      const m = window.location.pathname.match(/^\/profile\/([^/]+)$/);
      if (m) openProfileBySlug(decodeURIComponent(m[1]));
      else setSelected(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // initial list load
  useEffect(() => {
    fetchManagers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filter + sort
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    const filteredList = managers
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

    setFiltered(filteredList);
  }, [managers, searchTerm, selectedDivision, selectedType]);

  // ---------- views ----------
  if (selected) {
    const safeType = String(selected.type || "rising").toLowerCase();
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #064e3b 100%)",
          color: "#f3f4f6",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(to right, #ff9a9e, #fecfef)",
            borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "1rem 2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => {
                  setSelected(null);
                  window.history.pushState(null, "", "/");
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
                  gap: "0.5rem",
                }}
              >
                ← Back to Managers
              </button>
              <span style={{ color: "rgba(255,255,255,.7)" }}>|</span>
              <a
                href="https://smtop100.blog"
                style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}
              >
                Main Site
              </a>
            </div>
            <div style={{ color: "#fff", fontWeight: "bold", fontSize: "1.2rem" }}>
              Manager Profile
            </div>
          </div>
        </div>

const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
if (pathname === "/request") {
  return <RequestForm />;
}

        {/* Profile */}
        <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "0 1rem" }}>
          <div
            style={{
              background: "rgba(255,255,255,.95)",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "0 20px 40px rgba(0,0,0,.2)",
              color: "#374151",
            }}
          >
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                marginBottom: ".5rem",
                color: "#1f2937",
              }}
            >
              {selected.name}
            </h1>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#6b7280" }}>
              {selected.club}
            </h2>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "2rem",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  padding: ".5rem 1rem",
                  borderRadius: "25px",
                  fontSize: ".9rem",
                  fontWeight: "bold",
                  ...getBadgeStyle("division", selected.division),
                }}
              >
                Division {selected.division || "—"}
              </span>
              <span
                style={{
                  padding: ".5rem 1rem",
                  borderRadius: "25px",
                  fontSize: ".9rem",
                  fontWeight: "bold",
                  ...getBadgeStyle("type", safeType),
                }}
              >
                {safeType.charAt(0).toUpperCase() + safeType.slice(1)}
              </span>
            </div>

            {/* Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              <div style={{ textAlign: "center", padding: "1rem", background: "#f0fdf4", borderRadius: "8px" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#166534" }}>
                  {formatPoints(selected.points || 0)}
                </div>
                <div style={{ fontSize: ".9rem", color: "#16a34a" }}>Total Points</div>
              </div>
              <div style={{ textAlign: "center", padding: "1rem", background: "#eff6ff", borderRadius: "8px" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e40af" }}>
                  {selected.games || 0}
                </div>
                <div style={{ fontSize: ".9rem", color: "#2563eb" }}>Games Played</div>
              </div>
              <div style={{ textAlign: "center", padding: "1rem", background: "#faf5ff", borderRadius: "8px" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#7c2d12" }}>
                  {formatAvgPoints(selected.avgPoints || 0)}
                </div>
                <div style={{ fontSize: ".9rem", color: "#a855f7" }}>Avg Points</div>
              </div>
            </div>

            {/* Signature */}
            {selected.signature && (
              <section style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#1f2937", marginBottom: ".5rem" }}>
                  Signature Style
                </h3>
                <p
                  style={{
                    fontSize: "1.1rem",
                    fontStyle: "italic",
                    borderLeft: "4px solid #ff9a9e",
                    paddingLeft: "1rem",
                    color: "#4b5563",
                  }}
                >
                  “{selected.signature}”
                </p>
              </section>
            )}

            {/* Story */}
            {selected.story && (
              <section>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#1f2937", marginBottom: ".5rem" }}>
                  Top 100 Journey
                </h3>
                <p style={{ lineHeight: 1.6, color: "#4b5563", whiteSpace: "pre-line" }}>
                  {selected.story}
                </p>
              </section>
            )}

            {/* Extended sections */}
            {selected.careerHighlights && (
              <section style={{ marginTop: "1.5rem" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#1f2937", marginBottom: ".5rem" }}>
                  Career Highlights
                </h3>
                <p style={{ lineHeight: 1.6, color: "#4b5563", whiteSpace: "pre-line" }}>
                  {selected.careerHighlights}
                </p>
              </section>
            )}

            {selected.favouriteFormation && (
              <section style={{ marginTop: "1.5rem" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#1f2937", marginBottom: ".5rem" }}>
                  Favourite Formation
                </h3>
                <p style={{ color: "#4b5563" }}>{selected.favouriteFormation}</p>
              </section>
            )}

            {selected.tacticalPhilosophy && (
              <section style={{ marginTop: "1.5rem" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#1f2937", marginBottom: ".5rem" }}>
                  Tactical Philosophy
                </h3>
                <p style={{ lineHeight: 1.6, color: "#4b5563", whiteSpace: "pre-line" }}>
                  {selected.tacticalPhilosophy}
                </p>
              </section>
            )}

            {selected.memorableMoment && (
              <section style={{ marginTop: "1.5rem" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#1f2937", marginBottom: ".5rem" }}>
                  Most Memorable Moment
                </h3>
                <p style={{ lineHeight: 1.6, color: "#4b5563", whiteSpace: "pre-line" }}>
                  {selected.memorableMoment}
                </p>
              </section>
            )}

            {selected.fearedOpponent && (
              <section style={{ marginTop: "1.5rem" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#1f2937", marginBottom: ".5rem" }}>
                  Most Feared Opponent
                </h3>
                <p style={{ color: "#4b5563" }}>{selected.fearedOpponent}</p>
              </section>
            )}

            {selected.ambitions && (
              <section style={{ marginTop: "1.5rem" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#1f2937", marginBottom: ".5rem" }}>
                  Future Ambitions
                </h3>
                <p style={{ lineHeight: 1.6, color: "#4b5563", whiteSpace: "pre-line" }}>
                  {selected.ambitions}
                </p>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- list page ----------
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
        color: "#333",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(to right, #ff9a9e, #fecfef)",
          borderBottom: "2px solid rgba(255,255,255,.3)",
          boxShadow: "0 4px 20px rgba(0,0,0,.1)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "1rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <a
              href="https://smtop100.blog"
              style={{
                color: "#fff",
                textDecoration: "none",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: ".5rem",
              }}
            >
              ← Back to Main Site
            </a>
            <span style={{ color: "rgba(255,255,255,.7)" }}>|</span>
            <a
              href="https://legends.smtop100.blog"
              style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}
            >
              Legends
            </a>
          </div>
          <div style={{ color: "#fff", fontWeight: "bold", fontSize: "1.2rem" }}>Manager Profiles</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: "bold",
              marginBottom: "1rem",
              color: "#f9fafb",
            }}
          >
            🏆 TOP 100 MANAGER PROFILES 🏆
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: 1.6,
              color: "#fff",
            }}
          >
            Celebrating 25 seasons of Soccer Manager Worlds excellence. Discover the stories, achievements,
            and legendary journeys of our Top 100 community&apos;s finest managers.
          </p>
        </div>

        {/* Search + Filters */}
        <div
          style={{
            background: "rgba(255,255,255,.95)",
            borderRadius: "12px",
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
              <label
                style={{
                  display: "block",
                  marginBottom: ".5rem",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
    Search Managers
              </label>
              <input
                type="text"
                placeholder="Search by name or club..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: ".75rem",
                  borderWidth: "2px",
                  borderStyle: "solid",
                  borderColor: "#e5e7eb",
                  borderRadius: "8px",
                  fontSize: "1rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: ".5rem",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Division
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                style={{
                  width: "100%",
                  padding: ".75rem",
                  borderWidth: "2px",
                  borderStyle: "solid",
                  borderColor: "#e5e7eb",
                  borderRadius: "8px",
                  fontSize: "1rem",
                }}
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
              <label
                style={{
                  display: "block",
                  marginBottom: ".5rem",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Manager Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  width: "100%",
                  padding: ".75rem",
                  borderWidth: "2px",
                  borderStyle: "solid",
                  borderColor: "#e5e7eb",
                  borderRadius: "8px",
                  fontSize: "1rem",
                }}
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

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
            }}
          >
            ⚠️ API Error: {error}
          </div>
        )}

        {/* Results summary */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "1.1rem", color: "#fff" }}>
            Showing {filtered.length} of {managers.length} managers
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: "1.2rem", color: "#fff" }}>Loading managers...</div>
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
              const slug = (m.id || m.name) ? slugify(m.id || m.name) : "";
              const safeType = String(m.type || "rising").toLowerCase();

              return (
                <div
                  key={m.id || m.name}
                  onClick={() => setSelected(m)}
                  style={{
                    background: "rgba(255,255,255,.95)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    cursor: "pointer",
                    transition: "transform .2s, box-shadow .2s",
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
                      <h3
                        style={{
                          fontSize: "1.3rem",
                          fontWeight: "bold",
                          color: "#1f2937",
                          marginBottom: ".25rem",
                        }}
                      >
                        {m.name}
                      </h3>
                      <p style={{ color: "#6b7280" }}>{m.club}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                      <span
                        style={{
                          padding: ".25rem .75rem",
                          borderRadius: "12px",
                          fontSize: ".8rem",
                          fontWeight: "bold",
                          ...getBadgeStyle("division", m.division),
                        }}
                      >
                        Div {m.division || "—"}
                      </span>
                      <span
                        style={{
                          padding: ".25rem .75rem",
                          borderRadius: "12px",
                          fontSize: ".8rem",
                          fontWeight: "bold",
                          ...getBadgeStyle("type", safeType),
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
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#ff9a9e" }}>
                        {formatPoints(m.points || 0)}
                      </div>
                      <div style={{ fontSize: ".8rem", color: "#6b7280" }}>Points</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#2563eb" }}>
                        {m.games || 0}
                      </div>
                      <div style={{ fontSize: ".8rem", color: "#6b7280" }}>Games</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#7c2d12" }}>
                        {formatAvgPoints(m.avgPoints || 0)}
                      </div>
                      <div style={{ fontSize: ".8rem", color: "#6b7280" }}>Avg</div>
                    </div>
                  </div>

                  {m.signature && (
                    <p
                      style={{
                        fontSize: ".9rem",
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
                      style={{ color: "#ff9a9e", fontWeight: 500 }}
                      href={`/profile/${slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        window.history.pushState(null, "", `/profile/${slug}`);
                        openProfileBySlug(slug);
                      }}
                    >
                      View Profile →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: ".5rem", color: "#fff" }}>
              No managers found
            </div>
            <p style={{ color: "#fff" }}>Try adjusting your search criteria</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "4rem", paddingBottom: "2rem" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: ".5rem", color: "#fff" }}>
            ⚽ Celebrating 25 Seasons of Soccer Manager Worlds Excellence ⚽
          </p>
          <p style={{ color: "rgba(255,255,255,.8)" }}>
            Part of the Top 100 Community • Est. 2015
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;

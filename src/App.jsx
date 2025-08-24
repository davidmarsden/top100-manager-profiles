import React, { useEffect, useState } from "react";

const App = () => {
  const [managers, setManagers] = useState([]);
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- fetch list + de-dupe ---
  const fetchManagers = async () => {
    try {
      const res = await fetch("/api/managers");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      // normalize rows
      const normalized = (Array.isArray(data) ? data : []).map((m) => ({
        id:
          m.id ||
          String(m.name || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, ""),
        name: m.name || "",
        club: m.club || "",
        division: String(m.division ?? ""),
        type: (m.type || "rising").toLowerCase(),
        points: Number(m.points || 0),
        games: Number(m.games || 0),
        avgPoints:
          m.avgPoints != null
            ? Number(m.avgPoints)
            : Number(m.games ? (Number(m.points || 0) / Number(m.games || 1)) : 0),
        signature: m.signature || "",
        story: m.story || "",
      }));

      // de-dupe by id (fallback to slug(name))
      const slugify = (s) =>
        String(s || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      const seen = new Set();
      const uniq = [];
      for (const m of normalized) {
        const key = m.id || slugify(m.name);
        if (!seen.has(key)) {
          seen.add(key);
          uniq.push(m);
        }
      }

      setManagers(uniq);
      setError("");
    } catch (e) {
      setError(e.message || "Failed to load managers");
      setManagers([]);
    } finally {
      setLoading(false);
    }
  };

  // --- open profile from URL slug ---
  const openProfileBySlug = async (slug) => {
    try {
      const res = await fetch(`/api/manager?id=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");

      const m = {
        id: data.id || slug,
        name: data.name || "",
        club: data.club || "",
        division: String(data.division ?? ""),
        type: (data.type || "rising").toLowerCase(),
        points: Number(data.points || 0),
        games: Number(data.games || 0),
        avgPoints:
          data.avgPoints != null
            ? Number(data.avgPoints)
            : Number(
                data.games ? (Number(data.points || 0) / Number(data.games || 1)) : 0
              ),
        signature: data.signature || "",
        story: data.story || "",
      };
      setSelectedManager(m);
    } catch (e) {
      console.error("openProfileBySlug error:", e);
      setSelectedManager(null);
    }
  };

  // reflect URL -> UI once, and handle back/forward
  useEffect(() => {
    const match = window.location.pathname.match(/^\/profile\/([^/]+)$/);
    if (match) openProfileBySlug(decodeURIComponent(match[1]));

    const onPop = () => {
      const m = window.location.pathname.match(/^\/profile\/([^/]+)$/);
      if (m) openProfileBySlug(decodeURIComponent(m[1]));
      else setSelectedManager(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // initial list load
  useEffect(() => {
    fetchManagers();
  }, []);

  // filtering + sort
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    let filtered = managers.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(term) ||
        m.club.toLowerCase().includes(term);
      const matchesDivision =
        selectedDivision === "all" ||
        String(m.division) === String(selectedDivision);
      const matchesType =
        selectedType === "all" ||
        (m.type || "rising").toLowerCase() === selectedType;
      return matchesSearch && matchesDivision && matchesType;
    });

    filtered.sort((a, b) => (b.points || 0) - (a.points || 0));
    setFilteredManagers(filtered);
  }, [managers, searchTerm, selectedDivision, selectedType]);

  const formatPoints = (n) =>
    typeof n === "number" ? n.toLocaleString() : "0";
  const formatAvgPoints = (n) =>
    typeof n === "number" ? n.toFixed(2) : "0.00";

  const getBadgeStyle = (type, division) => {
    if (type === "division") {
      const d = Number(division);
      const colors = {
        1: { background: "#fbbf24", color: "#92400e" },
        2: { background: "#d1d5db", color: "#374151" },
        3: { background: "#d97706", color: "#fbbf24" },
        4: { background: "#10b981", color: "#ecfdf5" },
        5: { background: "#3b82f6", color: "#dbeafe" },
      };
      return colors[d] || { background: "#6b7280", color: "white" };
    } else {
      const colors = {
        legend: { background: "#7c3aed", color: "#e5e7eb" },
        elite: { background: "#dc2626", color: "#fee2e2" },
        rising: { background: "#2563eb", color: "#dbeafe" },
        veteran: { background: "#059669", color: "#d1fae5" },
      };
      return colors[(division || "").toLowerCase()] || {
        background: "#6b7280",
        color: "white",
      };
    }
  };

  // ---------- Profile drawer ----------
  if (selectedManager) {
    const safeType = (selectedManager.type || "rising").toLowerCase();
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
                  setSelectedManager(null);
                  window.history.pushState(null, "", "/");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                ← Back to Managers
              </button>
              <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>|</span>
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

        <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "0 1rem" }}>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              color: "#374151",
            }}
          >
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                marginBottom: "0.5rem",
                color: "#1f2937",
              }}
            >
              {selectedManager.name}
            </h1>
            <h2
              style={{
                fontSize: "1.5rem",
                marginBottom: "1rem",
                color: "#6b7280",
              }}
            >
              {selectedManager.club}
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
                  padding: "0.5rem 1rem",
                  borderRadius: "25px",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  ...getBadgeStyle("division", selectedManager.division),
                }}
              >
                Division {selectedManager.division ?? "—"}
              </span>
              <span
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "25px",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  ...getBadgeStyle("type", safeType),
                }}
              >
                {safeType.charAt(0).toUpperCase() + safeType.slice(1)}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  padding: "1rem",
                  background: "#f0fdf4",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#166534" }}
                >
                  {formatPoints(selectedManager.points || 0)}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#16a34a" }}>Total Points</div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  padding: "1rem",
                  background: "#eff6ff",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e40af" }}
                >
                  {selectedManager.games || 0}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#2563eb" }}>Games Played</div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  padding: "1rem",
                  background: "#faf5ff",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#7c2d12" }}
                >
                  {formatAvgPoints(selectedManager.avgPoints || 0)}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#a855f7" }}>Avg Points</div>
              </div>
            </div>

            {selectedManager.signature && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h3
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                    color: "#1f2937",
                  }}
                >
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
                  “{selectedManager.signature}”
                </p>
              </div>
            )}

            {selectedManager.story && (
              <div>
                <h3
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                    color: "#1f2937",
                  }}
                >
                  Top 100 Journey
                </h3>
                <p
                  style={{
                    lineHeight: "1.6",
                    color: "#4b5563",
                    whiteSpace: "pre-line",
                  }}
                >
                  {selectedManager.story}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- List page ----------
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
            <a
              href="https://smtop100.blog"
              style={{
                color: "#fff",
                textDecoration: "none",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              ← Back to Main Site
            </a>
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>|</span>
            <a
              href="https://legends.smtop100.blog"
              style={{ color: "#fff", textDecoration: "none", fontWeight: "500" }}
            >
              Legends
            </a>
          </div>
          <div style={{ color: "#fff", fontWeight: "bold", fontSize: "1.2rem" }}>
            Manager Profiles
          </div>
        </div>
      </div>

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
              lineHeight: "1.6",
              color: "#fff",
            }}
          >
            Celebrating 25 seasons of Soccer Manager Worlds excellence. Discover
            the stories, achievements, and legendary journeys of our Top 100
            community&apos;s finest managers.
          </p>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
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
                  marginBottom: "0.5rem",
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
                  padding: "0.75rem",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "1rem",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
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
                  padding: "0.75rem",
                  border: "2px solid "#e5e7eb",
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
    marginBottom: "0.5rem",
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
    padding: "0.75rem",
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
            ⚠️ API Error (using sample data): {error}
          </div>
        )}

        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "1.1rem", color: "#fff" }}>
            Showing {filteredManagers.length} of {managers.length} managers
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: "1.2rem", color: "#fff" }}>
              Loading managers...
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {filteredManagers.map((manager) => {
              const slug =
                (manager.id || manager.name)
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "");
              const safeType = (manager.type || "rising").toLowerCase();
              return (
                <div
                  key={manager.id || manager.name}
                  onClick={() => setSelectedManager(manager)}
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
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
                          marginBottom: "0.25rem",
                        }}
                      >
                        {manager.name}
                      </h3>
                      <p style={{ color: "#6b7280" }}>{manager.club}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                          ...getBadgeStyle("division", manager.division),
                        }}
                      >
                        Div {manager.division ?? "—"}
                      </span>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
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
                      <div
                        style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#ff9a9e" }}
                      >
                        {formatPoints(manager.points || 0)}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Points</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#2563eb" }}
                      >
                        {manager.games || 0}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Games</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#7c2d12" }}
                      >
                        {formatAvgPoints(manager.avgPoints || 0)}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Avg</div>
                    </div>
                  </div>

                  {manager.signature && (
                    <p
                      style={{
                        fontSize: "0.9rem",
                        fontStyle: "italic",
                        color: "#4b5563",
                        marginBottom: "1rem",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      “{manager.signature}”
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

        {filteredManagers.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem", color: "#fff" }}>
              No managers found
            </div>
            <p style={{ color: "#fff" }}>Try adjusting your search criteria</p>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "4rem", paddingBottom: "2rem" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "#fff" }}>
            ⚽ Celebrating 25 Seasons of Soccer Manager Worlds Excellence ⚽
          </p>
          <p style={{ color: "rgba(255, 255, 255, 0.8)" }}>
            Part of the Top 100 Community • Est. 2015
          </p>
        </div>
      </div>
    </div>
  );
};
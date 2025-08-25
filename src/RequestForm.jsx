import React, { useState } from "react";

export default function RequestForm() {
  const [form, setForm] = useState({
    managerName: "",
    clubName: "",
    division: "",
    managerType: "rising", // optional; not required by backend
    totalPoints: "",
    gamesPlayed: "",
    favouriteFormation: "",
    tacticalPhilosophy: "",
    mostFearedOpponent: "",
    careerHighlights: "",
    mostMemorableMoment: "",
    futureAmbitions: "",
    story: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.managerName.trim()) return "Manager Name is required.";
    if (!form.clubName.trim()) return "Club Name is required.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const v = validate();
    if (v) { setMsg(v); return; }

    setSubmitting(true);
    try {
      // Build payload using the exact labels your function accepts
      const payload = {
        "Manager Name": form.managerName,
        "Club Name": form.clubName,
        "Division": form.division,
        "Career Highlights": form.careerHighlights,
        "Favourite Formation": form.favouriteFormation,
        "Tactical Philosophy": form.tacticalPhilosophy,
        "Most Memorable Moment": form.mostMemorableMoment,
        "Most Feared Opponent": form.mostFearedOpponent,
        "Future Ambitions": form.futureAmbitions,
        "Story": form.story,

        // Optional extras that your function gracefully ignores (or can use later)
        "Type": form.managerType,
        "Points": form.totalPoints,
        "Games": form.gamesPlayed,
      };

      const res = await fetch("/api/profile-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // If the function/url is misconfigured and returns HTML, this will throw.
      const data = await res.json().catch(() => {
        throw new Error("Server did not return JSON. Check /api/profile-request route and redirects.");
      });

      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setMsg("✅ Submitted! Your profile is pending review.");
      // Optional: clear form after success
      setForm({
        managerName: "",
        clubName: "",
        division: "",
        managerType: "rising",
        totalPoints: "",
        gamesPlayed: "",
        favouriteFormation: "",
        tacticalPhilosophy: "",
        mostFearedOpponent: "",
        careerHighlights: "",
        mostMemorableMoment: "",
        futureAmbitions: "",
        story: "",
      });
    } catch (err) {
      console.error(err);
      setMsg(`⚠️ ${err.message || "Network error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Styling matches the rest of your inline style approach
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
        color: "#333",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: "linear-gradient(to right, #ff9a9e, #fecfef)",
          borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
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
            <span style={{ color: "rgba(255,255,255,0.7)" }}>|</span>
            <a href="https://smtop100.blog" style={{ color: "#fff", textDecoration: "none" }}>
              Main Site
            </a>
          </div>
          <div style={{ color: "#fff", fontWeight: "bold", fontSize: "1.2rem" }}>
            Submit Profile
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
        <div
          style={{
            background: "rgba(255,255,255,0.98)",
            borderRadius: 16,
            padding: "1.5rem",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <h1 style={{ marginTop: 0 }}>Submit Your Manager Profile</h1>

          {msg && (
            <div
              style={{
                background: msg.startsWith("✅") ? "#ecfdf5" : "#fee2e2",
                color: msg.startsWith("✅") ? "#065f46" : "#991b1b",
                padding: "0.75rem 1rem",
                borderRadius: 8,
                marginBottom: "1rem",
              }}
            >
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Required fields */}
            <label style={labelStyle}>Manager Name *</label>
            <input
              name="managerName"
              value={form.managerName}
              onChange={update}
              placeholder="e.g., David Marsden"
              style={inputStyle}
              required
            />

            <label style={labelStyle}>Club Name *</label>
            <input
              name="clubName"
              value={form.clubName}
              onChange={update}
              placeholder="e.g., Hamburger SV"
              style={inputStyle}
              required
            />

            {/* Quick grid for small fields */}
            <div style={grid3}>
              <div>
                <label style={labelStyle}>Division</label>
                <select
                  name="division"
                  value={form.division}
                  onChange={update}
                  style={inputStyle}
                >
                  <option value="">—</option>
                  <option>Division 1</option>
                  <option>Division 2</option>
                  <option>Division 3</option>
                  <option>Division 4</option>
                  <option>Division 5</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Manager Type</label>
                <select
                  name="managerType"
                  value={form.managerType}
                  onChange={update}
                  style={inputStyle}
                >
                  <option value="rising">Rising</option>
                  <option value="elite">Elite</option>
                  <option value="legend">Legend</option>
                  <option value="veteran">Veteran</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Total Points</label>
                <input
                  name="totalPoints"
                  value={form.totalPoints}
                  onChange={update}
                  inputMode="numeric"
                  placeholder="e.g., 1815"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={grid3}>
              <div>
                <label style={labelStyle}>Games Played</label>
                <input
                  name="gamesPlayed"
                  value={form.gamesPlayed}
                  onChange={update}
                  inputMode="numeric"
                  placeholder="e.g., 1016"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Favourite Formation</label>
                <input
                  name="favouriteFormation"
                  value={form.favouriteFormation}
                  onChange={update}
                  placeholder="e.g., 4-2-3-1"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Most Feared Opponent</label>
                <input
                  name="mostFearedOpponent"
                  value={form.mostFearedOpponent}
                  onChange={update}
                  placeholder="e.g., Paul Masters"
                  style={inputStyle}
                />
              </div>
            </div>

            <label style={labelStyle}>Career Highlights</label>
            <textarea
              name="careerHighlights"
              value={form.careerHighlights}
              onChange={update}
              rows={3}
              placeholder="Optional: proudest moments and accomplishments"
              style={textareaStyle}
            />

            <label style={labelStyle}>Tactical Philosophy</label>
            <textarea
              name="tacticalPhilosophy"
              value={form.tacticalPhilosophy}
              onChange={update}
              rows={3}
              placeholder="Optional: how you approach the game tactically"
              style={textareaStyle}
            />

            <label style={labelStyle}>Most Memorable Moment</label>
            <textarea
              name="mostMemorableMoment"
              value={form.mostMemorableMoment}
              onChange={update}
              rows={3}
              placeholder="Optional: a special moment from your Top 100 journey"
              style={textareaStyle}
            />

            <label style={labelStyle}>Future Ambitions</label>
            <textarea
              name="futureAmbitions"
              value={form.futureAmbitions}
              onChange={update}
              rows={3}
              placeholder="Optional: what you hope to achieve next"
              style={textareaStyle}
            />

            <label style={labelStyle}>Your Top 100 Story</label>
            <textarea
              name="story"
              value={form.story}
              onChange={update}
              rows={5}
              placeholder="Optional: share what makes your journey special"
              style={textareaStyle}
            />

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: "1rem",
                width: "100%",
                padding: "0.9rem 1rem",
                border: "none",
                borderRadius: 10,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                background: submitting ? "#fca5a5" : "#f87171",
                color: "#fff",
              }}
            >
              {submitting ? "Submitting…" : "Submit Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---- tiny inline styles reused ---- */
const labelStyle = {
  display: "block",
  margin: "1rem 0 0.5rem 0",
  fontWeight: 600,
  color: "#374151",
};

const inputStyle = {
  width: "100%",
  padding: "0.75rem",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "#e5e7eb",
  borderRadius: "8px",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const textareaStyle = {
  ...inputStyle,
  lineHeight: 1.5,
  resize: "vertical",
};

const grid3 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
  marginTop: "0.5rem",
};
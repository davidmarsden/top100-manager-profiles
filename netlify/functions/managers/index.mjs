import { getSheets, SHEET_ID, TAB_MANAGERS, json, mapRow } from "../_sheets.mjs";

export default async () => {
  try {
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_MANAGERS}!A:Z`
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return json(200, []); // no data yet

    const header = rows[0];
    const items = rows.slice(1).map(r => {
      const m = mapRow(header, r);

      // normalize + compute
      const toSlug = (s) => String(s || "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

      const points = Number(m.points || m.totalPoints || 0);
      const games = Number(m.games || m.totalGames || 0);
      const avg = m.avgPoints != null && m.avgPoints !== ""
        ? Number(m.avgPoints)
        : (games ? points / games : 0);

      return {
        id: m.id || toSlug(m.name),
        name: m.name || "",
        club: m.club || "",
        division: String(m.division || ""),
        type: String(m.type || "rising").toLowerCase(),
        points, games, avgPoints: Number.isFinite(avg) ? avg : 0,
        signature: m.signature || "",
        story: m.story || "",
        careerHighlights: m.careerHighlights || "",
        favouriteFormation: m.favouriteFormation || "",
        tacticalPhilosophy: m.tacticalPhilosophy || "",
        memorableMoment: m.memorableMoment || "",
        fearedOpponent: m.fearedOpponent || "",
        ambitions: m.ambitions || ""
      };
    });

    return json(200, items);
  } catch (e) {
    console.error("managers error", e);
    return json(200, []); // keep UI rendering
  }
};
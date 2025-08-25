import type { Context } from "@netlify/functions";
import { getSheets, SHEET_ID, TAB_MANAGERS, json, okCors, mapRow } from "./_sheets.mts";

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") return okCors();
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_MANAGERS}!A:Z`
    });

function shapeRow(r: any) {
  const toSlug = (s: string) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const points = Number(r.points || r.totalPoints || 0);
  const games = Number(r.games || r.totalGames || 0);
  const avgPoints =
    r.avgPoints != null ? Number(r.avgPoints) : (games ? points / games : 0);

  return {
    id: r.id || toSlug(r.name),
    name: r.name || "",
    club: r.club || "",
    division: Number(r.division ?? "") || "",
    type: String(r.type || "rising").toLowerCase(),
    points,
    games,
    avgPoints,
    signature: r.signature || "",
    story: r.story || "",
  };
}

    const rows = res.data.values || [];
    if (rows.length <= 1) return json(200, []);
    const header = rows[0];
    const items = rows.slice(1).map(r => mapRow(header, r));
    return json(200, items);
  } catch (e: any) {
    console.error("managers error", e);
    return json(200, []); // keep UI rendering
  }
};


import type { Context } from "@netlify/functions";
import { getSheets, SHEET_ID, TAB_MANAGERS, json, okCors } from "./_sheets.mts";

// helpers
const slug = (s: string) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getCol = (header: string[], ...candidates: string[]) => {
  // case-insensitive column lookup
  const lc = header.map(h => (h || "").toString().trim().toLowerCase());
  for (const c of candidates) {
    const i = lc.indexOf(c.toLowerCase());
    if (i >= 0) return i;
  }
  return -1;
};

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") return okCors();
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const url = new URL(req.url);

    // 1) support /api/manager?id=slug
    let id = (url.searchParams.get("id") || "").trim();

    // 2) support /api/manager/<slug> (wildcard path)
    if (!id) {
      const parts = url.pathname.split("/").filter(Boolean);
      // pathname might be /api/manager/<slug>
      const maybe = parts[parts.length - 1];
      if (maybe && maybe !== "manager") id = maybe;
    }
    if (!id) return json(400, { error: "Missing id" });

    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_MANAGERS}!A:Z`,
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return json(404, { error: "Not found" });

    const header = rows[0].map(h => (h || "").toString().trim());

    // locate important columns (tolerant to naming)
    const idIdx    = getCol(header, "id", "Id", "ID");
    const nameIdx  = getCol(header, "name", "Name");
    const clubIdx  = getCol(header, "club", "Club");
    const divIdx   = getCol(header, "division", "Division", "div");
    const sigIdx   = getCol(header, "signature", "Signature", "summary");
    const storyIdx = getCol(header, "story", "Story", "bio", "profile");

    // optional stats
    const typeIdx  = getCol(header, "type", "Type");
    const ptsIdx   = getCol(header, "points", "Points");
    const gmsIdx   = getCol(header, "games", "Games");
    const avgIdx   = getCol(header, "avgPoints", "AvgPoints", "Average", "avg");

    // iterate and match by id, or by slug(name) when id is missing
    const findMatch = () => {
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i] || [];
        const rowId   = idIdx >= 0 ? (r[idIdx] || "").toString() : "";
        const rowName = nameIdx >= 0 ? (r[nameIdx] || "").toString() : "";
        if (rowId && slug(rowId) === slug(id)) return r;
        if (!rowId && rowName && slug(rowName) === slug(id)) return r;
      }
      return null;
    };

    const row = findMatch();
    if (!row) return json(404, { error: "Not found" });

    const payload = {
      id:     idIdx   >= 0 ? row[idIdx]   || "" : slug(nameIdx >= 0 ? row[nameIdx] : ""),
      name:   nameIdx >= 0 ? row[nameIdx] || "" : "",
      club:   clubIdx >= 0 ? row[clubIdx] || "" : "",
      division: divIdx >= 0 ? row[divIdx] || "" : "",
      signature: sigIdx >= 0 ? row[sigIdx] || "" : "",
      story:  storyIdx >= 0 ? row[storyIdx] || "" : "",
      type:   typeIdx >= 0 ? row[typeIdx] || "rising" : "rising",
      points: Number(ptsIdx >= 0 ? row[ptsIdx] || 0 : 0),
      games:  Number(gmsIdx >= 0 ? row[gmsIdx] || 0 : 0),
      avgPoints: Number(avgIdx >= 0 ? row[avgIdx] || 0 : 0),
    };

    return json(200, payload);
  } catch (e: any) {
    console.error("manager error", e);
    return json(500, { error: "Server error", details: e?.message });
  }
};

// NOTE: wildcard path so /api/manager/<slug> also hits this function
export const config = { path: "/api/manager/*" };
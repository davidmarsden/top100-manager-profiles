import type { Context } from "@netlify/functions";
import { getSheets, SHEET_ID, TAB_MANAGERS, json, okCors } from "./_sheets.mts";

// helpers
const slug = (s: string) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getCol = (header: string[], ...candidates: string[]) => {
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

    // accept /api/manager?id=slug  (decode!)
    let id = url.searchParams.get("id");
    if (id) id = decodeURIComponent(id.trim());

    // accept /api/manager/<slug>   (decode!)
    if (!id) {
      const parts = url.pathname.split("/").filter(Boolean);
      const maybe = parts[parts.length - 1];
      if (maybe && maybe !== "manager") id = decodeURIComponent(maybe);
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
    const idIdx    = getCol(header, "id");
    const nameIdx  = getCol(header, "name");
    const clubIdx  = getCol(header, "club");
    const divIdx   = getCol(header, "division");
    const sigIdx   = getCol(header, "signature");
    const storyIdx = getCol(header, "story");
    const typeIdx  = getCol(header, "type");
    const ptsIdx   = getCol(header, "points");
    const gmsIdx   = getCol(header, "games");
    const avgIdx   = getCol(header, "avgpoints", "avg", "average");

    let row: string[] | null = null;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] || [];
      const rowId   = idIdx   >= 0 ? (r[idIdx]   || "").toString() : "";
      const rowName = nameIdx >= 0 ? (r[nameIdx] || "").toString() : "";
      if (rowId && slug(rowId) === slug(id)) { row = r; break; }
      if (!rowId && rowName && slug(rowName) === slug(id)) { row = r; break; }
    }
    if (!row) return json(404, { error: "Not found" });

    const payload = {
      id:       idIdx   >= 0 ? row[idIdx]   || "" : slug(nameIdx >= 0 ? row[nameIdx] : ""),
      name:     nameIdx >= 0 ? row[nameIdx] || "" : "",
      club:     clubIdx >= 0 ? row[clubIdx] || "" : "",
      division: divIdx  >= 0 ? row[divIdx]  || "" : "",
      signature: sigIdx >= 0 ? row[sigIdx]  || "" : "",
      story:    storyIdx>= 0 ? row[storyIdx]|| "" : "",
      type:     typeIdx >= 0 ? row[typeIdx] || "rising" : "rising",
      points:   Number(ptsIdx >= 0 ? row[ptsIdx] || 0 : 0),
      games:    Number(gmsIdx >= 0 ? row[gmsIdx] || 0 : 0),
      avgPoints:Number(avgIdx >= 0 ? row[avgIdx] || 0 : 0),
    };

    return json(200, payload);
  } catch (e: any) {
    console.error("manager error", e);
    return json(500, { error: "Server error", details: e?.message });
  }
};

// wildcard so /api/manager/<slug> works
export const config = { path: "/api/manager/*" };
import type { Context } from "@netlify/functions";
import { getSheets, SHEET_ID, TAB_MANAGERS, json, okCors, mapRow } from "./_sheets.mts";

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") return okCors();
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id")?.trim().toLowerCase();
    if (!id) return json(400, { error: "Missing id" });

    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_MANAGERS}!A:Z`
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return json(404, { error: "Not found" });
    const header = rows[0];

    for (let i = 1; i < rows.length; i++) {
      const obj = mapRow(header, rows[i]);
      if ((obj["id"] || "").toLowerCase() === id) {
        // Provide safe fallbacks for fields the UI might expect
        const payload = {
          id: obj["id"] || "",
          name: obj["name"] || "",
          club: obj["club"] || "",
          division: obj["division"] || "",
          signature: obj["signature"] || "",
          story: obj["story"] || "",
          // optional fields the UI may render:
          type: obj["type"] || "rising",
          points: Number(obj["points"] || 0),
          games: Number(obj["games"] || 0),
          avgPoints: Number(obj["avgPoints"] || 0)
        };
        return json(200, payload);
      }
    }
    return json(404, { error: "Not found" });
  } catch (e: any) {
    console.error("manager error", e);
    return json(500, { error: "Server error", details: e?.message });
  }
};

export const config = { path: "/api/manager" };
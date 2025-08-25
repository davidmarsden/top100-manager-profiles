import { getSheets, SHEET_ID, TAB_MANAGERS, json, mapRow } from "../_sheets.mjs";

export default async (req) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return json(400, { error: "Missing id" });

    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_MANAGERS}!A:Z`
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return json(404, { error: "Not found" });
    const header = rows[0];
    const idIdx = header.findIndex(h => String(h).trim().toLowerCase() === "id");
    if (idIdx < 0) return json(500, { error: "No id column in Managers sheet" });

    for (let i = 1; i < rows.length; i++) {
      if ((rows[i][idIdx] || "") === id) {
        const m = mapRow(header, rows[i]);
        return json(200, m);
      }
    }
    return json(404, { error: "Not found" });
  } catch (e) {
    console.error("manager error", e);
    return json(500, { error: "Server error" });
  }
};
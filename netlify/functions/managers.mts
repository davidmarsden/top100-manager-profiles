import type { Context } from "@netlify/functions";
import { getSheets, SHEET_ID, TAB_MANAGERS, json, okCors, mapRow } from "./_sheets.mts";

export const config = { path: "/api/managers" };

export default async (req: Request, _ctx: Context) => {
  if (req.method === "OPTIONS") return okCors();
  if (req.method !== "GET") return json(405, { error:"Method not allowed" });

if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT) {
  return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
}

  try{
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_MANAGERS}!A:Z`
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return json(200, []);
    const header = rows[0].map(String);
    const items = rows.slice(1).map(r => mapRow(header, r));

    return json(200, items);
  }catch(e:any){
    console.error("managers error", e);
    return json(200, []); // keep UI usable
  }
};
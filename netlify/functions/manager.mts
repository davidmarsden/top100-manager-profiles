import type { Context } from "@netlify/functions";
import { getSheets, SHEET_ID, TAB_MANAGERS, json, okCors, mapRow } from "./_sheets.mts";

export const config = { path: "/api/manager" };

const slugify = (s:string="") => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");

export default async (req: Request, _ctx: Context) => {
  if (req.method === "OPTIONS") return okCors();
  if (req.method !== "GET") return json(405, { error:"Method not allowed" });

  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";

  try{
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_MANAGERS}!A:Z`
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return json(404, { error:"Not found" });
    const header = rows[0].map(String);
    const idIdx = header.findIndex(h => h.toLowerCase()==="id");
    const nameIdx = header.findIndex(h => h.toLowerCase()==="name");
    if (idIdx < 0 || nameIdx < 0) return json(500, { error:"Bad Managers header" });

    const needle = id.toLowerCase();
    for (let i=1;i<rows.length;i++){
      const row = rows[i];
      const rid = String(row[idIdx] || "");
      const rname = String(row[nameIdx] || "");
      if (rid.toLowerCase() === needle || slugify(rname) === needle) {
        return json(200, mapRow(header, row));
      }
    }
    return json(404, { error:"Not found" });
  }catch(e:any){
    console.error("manager error", e);
    return json(404, { error:"Not found" });
  }
};
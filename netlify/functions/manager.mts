// netlify/functions/manager.mts
import { google } from "googleapis";

/* ---------- small helpers ---------- */
const asJSON = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    },
  });

const parseCreds = (raw: string) => {
  return raw.trim().startsWith("{")
    ? JSON.parse(raw)
    : JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
};

/* ---------- function ---------- */
export default async (req: Request): Promise<Response> => {
  try {
    // env
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT || "";
    if (!SHEET_ID) return asJSON({ error: "Missing GOOGLE_SHEET_ID" }, 500);
    if (!raw) return asJSON({ error: "Missing GOOGLE_SERVICE_ACCOUNT" }, 500);

    // request
    const url = new URL(req.url);
    const id = url.searchParams.get("id")?.trim();
    if (!id) return asJSON({ error: "Missing id" }, 400);

    // auth + sheets client
    const { client_email, private_key } = parseCreds(raw);
    const auth = new google.auth.JWT(
      client_email,
      undefined,
      private_key,
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );
    const sheets = google.sheets({ version: "v4", auth });

    // read Managers!A1:Z
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Managers!A1:Z",
    });

    const rows = data.values || [];
    if (rows.length < 2) return asJSON({ error: "Not found" }, 404);

    const header = rows[0].map((h) => String(h).trim().toLowerCase());
    const col = (name: string) => header.findIndex((h) => h === name.toLowerCase());
    const get = (r: string[], n: string) => r[col(n)] ?? "";

    // find by exact id in column "id"
    const iId = col("id");
    const hit = rows.slice(1).find((r) => (r[iId] || "").toString() === id);
    if (!hit) return asJSON({ error: "Not found" }, 404);

    const points = Number(get(hit, "points") || 0);
    const games = Number(get(hit, "games") || 0);
    const avgRaw = String(get(hit, "avgPoints") || get(hit, "avgpoints") || "");
    const avg = avgRaw !== "" ? Number(avgRaw) : games ? points / games : 0;

    const item = {
      id: String(get(hit, "id") || ""),
      name: String(get(hit, "name") || ""),
      club: String(get(hit, "club") || ""),
      division: String(get(hit, "division") || ""),
      signature: String(get(hit, "signature") || ""),
      story: String(get(hit, "story") || ""),
      careerHighlights: String(get(hit, "careerHighlights") || get(hit, "career highlights") || ""),
      favouriteFormation: String(get(hit, "favouriteFormation") || get(hit, "favourite formation") || ""),
      tacticalPhilosophy: String(get(hit, "tacticalPhilosophy") || get(hit, "tactical philosophy") || ""),
      memorableMoment: String(get(hit, "memorableMoment") || get(hit, "most memorable moment") || ""),
      fearedOpponent: String(get(hit, "fearedOpponent") || get(hit, "most feared opponent") || ""),
      ambitions: String(get(hit, "ambitions") || get(hit, "future ambitions") || ""),
      type: String(get(hit, "type") || "rising").toLowerCase(),
      points: Number.isFinite(points) ? points : 0,
      games: Number.isFinite(games) ? games : 0,
      avgPoints: Number.isFinite(avg) ? Number(avg.toFixed(2)) : 0,
    };

    return asJSON(item);
  } catch (err: any) {
    return asJSON({ error: true, message: err?.message ?? String(err) }, 500);
  }
};
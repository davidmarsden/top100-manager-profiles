// netlify/functions/managers.mts
import { json } from "@netlify/functions";
import { google } from "googleapis";

export default async () => {
  try {
    // EARLY GUARD: if env is missing, don't try Google — just return empty list.
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT) {
      console.warn("managers: missing GOOGLE_SHEET_ID or GOOGLE_SERVICE_ACCOUNT");
      return json(200, []); // always JSON
    }

    const svc = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!);
    const auth = new google.auth.JWT({
      email: svc.client_email,
      key: svc.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: "Managers!A1:Z",
    });

    const rows = data.values || [];
    if (rows.length < 2) return json(200, []);

    const headers = rows[0].map((h) => String(h).trim().toLowerCase());
    const idx = (name: string) => headers.indexOf(name);
    const get = (r: any[], name: string) => r[idx(name)] ?? "";

    const out = rows.slice(1).map((r) => {
      const name = String(get(r, "name") || "");
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const points = Number(get(r, "points") || 0);
      const games = Number(get(r, "games") || 0);
      const avgFromSheet = get(r, "avgpoints");
      const avgPoints = avgFromSheet !== "" ? Number(avgFromSheet) : games ? points / games : 0;

      return {
        id: String(get(r, "id") || slug),
        name,
        club: String(get(r, "club") || ""),
        division: String(get(r, "division") || ""),
        signature: String(get(r, "signature") || ""),
        story: String(get(r, "story") || ""),
        type: String(get(r, "type") || "rising").toLowerCase(),
        points,
        games,
        avgPoints: Number.isFinite(avgPoints) ? Number(avgPoints) : 0,
      };
    });

    return json(200, out);
  } catch (e: any) {
    console.error("managers error", e?.message || e);
    // IMPORTANT: still return JSON (not an HTML error page)
    return json(200, []);
  }
};
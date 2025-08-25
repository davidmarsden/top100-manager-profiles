// netlify/functions/manager.mts
import { json } from "@netlify/functions";
import { google } from "googleapis";

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id") || "";
    if (!id) return json(400, { error: "missing id" });

    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT) {
      console.warn("manager: missing env; returning stub");
      return json(200, { id, name: "", club: "", division: "", type: "rising", points: 0, games: 0, avgPoints: 0, signature: "", story: "" });
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
    if (rows.length < 2) return json(404, { error: "not found" });

    const headers = rows[0].map((h) => String(h).trim().toLowerCase());
    const idx = (name: string) => headers.indexOf(name);
    const get = (r: any[], name: string) => r[idx(name)] ?? "";

    const match = rows.slice(1).find((r) => String(get(r, "id") || "").toLowerCase() === id.toLowerCase());
    if (!match) return json(404, { error: "not found" });

    const name = String(get(match, "name") || "");
    const points = Number(get(match, "points") || 0);
    const games = Number(get(match, "games") || 0);
    const avgFromSheet = get(match, "avgpoints");
    const avgPoints = avgFromSheet !== "" ? Number(avgFromSheet) : games ? points / games : 0;

    return json(200, {
      id: String(get(match, "id") || id),
      name,
      club: String(get(match, "club") || ""),
      division: String(get(match, "division") || ""),
      type: String(get(match, "type") || "rising").toLowerCase(),
      points,
      games,
      avgPoints: Number.isFinite(avgPoints) ? Number(avgPoints) : 0,
      signature: String(get(match, "signature") || ""),
      story: String(get(match, "story") || ""),
    });
  } catch (e: any) {
    console.error("manager error", e?.message || e);
    return json(404, { error: "not found" });
  }
};
import { json } from "@netlify/functions";
import { google } from "googleapis";

export const config = { path: "/api/managers" };

export default async () => {
  try {
    const auth = new google.auth.JWT({
      email: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || "{}").client_email,
      key: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || "{}").private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
    // Read Managers tab starting at row 1: first row must be headers
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Managers!A1:Z",
    });

    const rows = data.values || [];
    if (rows.length < 2) return json(200, []);

    const headers = rows[0].map((h) => String(h).trim().toLowerCase());
    const out = rows.slice(1).map((r) => {
      const idx = (name: string) => headers.indexOf(name);
      const get = (name: string) => r[idx(name)] ?? "";

      const name = String(get("name") || "");
      const slugFromName = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const points = Number(get("points") || 0);
      const games = Number(get("games") || 0);
      const avgPointsHeader = get("avgpoints"); // header can be "avgPoints" or "avgpoints"
      const avgPoints =
        avgPointsHeader !== ""
          ? Number(avgPointsHeader)
          : games
          ? points / games
          : 0;

      const type = String(get("type") || "rising").toLowerCase();

      return {
        id: String(get("id") || slugFromName),
        name,
        club: String(get("club") || ""),
        division: String(get("division") || ""),
        signature: String(get("signature") || ""),
        story: String(get("story") || ""),
        type,
        points,
        games,
        avgPoints: Number.isFinite(avgPoints) ? Number(avgPoints) : 0,
      };
    });

    return json(200, out);
  } catch (e) {
    console.error("managers error", e);
    // Keep the UI rendering, just show empty + your in-app fallback
    return json(200, []);
  }
};
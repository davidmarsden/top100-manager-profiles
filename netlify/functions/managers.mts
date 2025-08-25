// netlify/functions/managers.mts
import { google } from "googleapis";

const asJSON = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });

export default async () => {
  try {
    // --- env ---
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT || "";
    if (!SHEET_ID) return asJSON({ error: "Missing GOOGLE_SHEET_ID" }, 500);
    if (!raw) return asJSON({ error: "Missing GOOGLE_SERVICE_ACCOUNT" }, 500);

    // parse service account (raw JSON or base64 JSON)
    let creds: any;
    try {
      creds = raw.trim().startsWith("{")
        ? JSON.parse(raw)
        : JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    } catch (e: any) {
      return asJSON(
        { error: "Failed to parse GOOGLE_SERVICE_ACCOUNT", detail: e?.message },
        500
      );
    }

    // --- auth + sheets client ---
    const auth = new google.auth.JWT(
      creds.client_email,
      undefined,
      creds.private_key,
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );
    const sheets = google.sheets({ version: "v4", auth });

    // --- read Managers!A1:Z ---
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Managers!A1:Z",
    });

    const rows = data.values || [];
    if (rows.length < 2) return asJSON([]);

    const header = rows[0].map((h) => String(h).trim());
    const idx = (n: string) =>
      header.findIndex((h) => h.toLowerCase() === n.toLowerCase());
    const get = (r: string[], n: string) => r[idx(n)] ?? "";

    const items = rows.slice(1).map((r) => {
      const name = String(get(r, "name") || "");
      const slug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "unknown";

      const points = Number(get(r, "points") || 0);
      const games = Number(get(r, "games") || 0);
      const avgRaw = String(get(r, "avgPoints") || get(r, "avgpoints") || "");
      const avg =
        avgRaw !== "" ? Number(avgRaw) : games ? points / games : 0;

      return {
        id: String(get(r, "id") || slug),
        name,
        club: String(get(r, "club") || ""),
        division: String(get(r, "division") || ""),
        signature: String(get(r, "signature") || ""),
        story: String(get(r, "story") || ""),

        // optional extended columns if present
        careerHighlights:
          String(get(r, "careerHighlights") || get(r, "Career Highlights") || ""),
        favouriteFormation:
          String(get(r, "favouriteFormation") || get(r, "Favourite Formation") || ""),
        tacticalPhilosophy:
          String(get(r, "tacticalPhilosophy") || get(r, "Tactical Philosophy") || ""),
        memorableMoment:
          String(get(r, "memorableMoment") || get(r, "Most Memorable Moment") || ""),
        fearedOpponent:
          String(get(r, "fearedOpponent") || get(r, "Most Feared Opponent") || ""),
        ambitions:
          String(get(r, "ambitions") || get(r, "Future Ambitions") || ""),

        type: String(get(r, "type") || "rising").toLowerCase(),
        points: Number.isFinite(points) ? points : 0,
        games: Number.isFinite(games) ? games : 0,
        avgPoints: Number.isFinite(avg) ? Number(avg.toFixed(2)) : 0,
      };
    });

    return asJSON(items);
  } catch (err: any) {
    return asJSON(
      { error: true, message: err?.message || String(err) || "unknown" },
      500
    );
  }
};
import type { Context } from "@netlify/functions";
import {
  getSheets,
  SHEET_ID,
  TAB_MANAGERS,
  json,
  okCors,
  mapRow,
} from "./_sheets.mts";

export default async (req: Request, _context: Context) => {
  // CORS / method guard
  if (req.method === "OPTIONS") return okCors();
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_MANAGERS}!A:Z`,
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return json(200, []);

    const header = rows[0];

    // util
    const slugify = (s: string) =>
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    // shape a single mapped row into API object
    const shape = (r: any) => {
      const name = String(r.name || "").trim();

      // numbers
      const points = Number(r.points || r.totalPoints || 0);
      const games = Number(r.games || r.totalGames || 0);
      const avg =
        r.avgPoints != null && r.avgPoints !== ""
          ? Number(r.avgPoints)
          : games
          ? points / Math.max(1, games)
          : 0;

      // allow different header spellings that mapRow might have produced
      const careerHighlights =
        r.careerHighlights ||
        r.career_highlights ||
        r["career highlights"] ||
        "";
      const favouriteFormation =
        r.favouriteFormation ||
        r.favoriteFormation ||
        r["favourite formation"] ||
        r["favorite formation"] ||
        "";
      const tacticalPhilosophy =
        r.tacticalPhilosophy || r["tactical philosophy"] || "";
      const memorableMoment =
        r.memorableMoment || r["most memorable moment"] || "";
      const fearedOpponent =
        r.fearedOpponent || r["most feared opponent"] || "";
      const ambitions = r.ambitions || r["future ambitions"] || "";

      // signature falls back to career highlights if not provided
      const signature = (r.signature || "").trim() || careerHighlights;

      return {
        // identity / basics
        id: (r.id && String(r.id)) || slugify(name),
        name,
        club: String(r.club || ""),
        division:
          r.division === 0 || r.division === "0" || r.division === ""
            ? ""
            : String(r.division ?? ""), // keep as string for UI filters
        type: String(r.type || "rising").toLowerCase(),

        // stats
        points,
        games,
        avgPoints: Number.isFinite(avg) ? Number(avg) : 0,

        // storytelling
        signature,
        story: String(r.story || ""),

        // NEW: extended submission fields
        careerHighlights: String(careerHighlights || ""),
        favouriteFormation: String(favouriteFormation || ""),
        tacticalPhilosophy: String(tacticalPhilosophy || ""),
        memorableMoment: String(memorableMoment || ""),
        fearedOpponent: String(fearedOpponent || ""),
        ambitions: String(ambitions || ""),
      };
    };

    // map rows -> keyed objects via your helper, then normalize
    const mapped = rows.slice(1).map((r) => mapRow(header, r)).map(shape);

    // de-dupe by id (fallback to slug(name))
    const seen = new Set<string>();
    const deduped = mapped.filter((m) => {
      const key = m.id || slugify(m.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return json(200, deduped);
  } catch (e: any) {
    console.error("managers error", e);
    // keep the UI rendering gracefully
    return json(200, []);
  }
};
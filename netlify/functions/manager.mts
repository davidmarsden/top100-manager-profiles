// netlify/functions/manager.mts
import type { Context } from "@netlify/functions";
import {
  getSheets,
  SHEET_ID,
  TAB_MANAGERS,
  json,
  okCors,
  mapRow,
} from "./_sheets.mts";

export const config = { path: "/api/manager" }; // query ?id=... ; your redirects can also route /api/manager/* here

export default async (req: Request, _ctx: Context) => {
  if (req.method === "OPTIONS") return okCors();
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const url = new URL(req.url);
  // Support both /api/manager?id=slug and /api/manager/<slug>
  const fromQuery = url.searchParams.get("id") || "";
  const fromPath = url.pathname.split("/").pop() || "";
  const rawId = decodeURIComponent(fromQuery || fromPath || "").trim();

  if (!rawId) return json(400, { error: "Missing id parameter" });

  // helpers
  const slugify = (s: string) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  try {
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_MANAGERS}!A:Z`,
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return json(404, { error: "Manager not found" });

    const header = rows[0];

    // Row → shaped object (same shaping as /api/managers)
    const shape = (r: any) => {
      const name = String(r.name || "").trim();

      const points = Number(r.points || r.totalPoints || 0);
      const games = Number(r.games || r.totalGames || 0);
      const avg =
        r.avgPoints != null && r.avgPoints !== ""
          ? Number(r.avgPoints)
          : games
          ? points / Math.max(1, games)
          : 0;

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

      const signature = (r.signature || "").trim() || careerHighlights;

      const obj = {
        id: (r.id && String(r.id)) || slugify(name),
        name,
        club: String(r.club || ""),
        division:
          r.division === 0 || r.division === "0" || r.division === ""
            ? ""
            : String(r.division ?? ""),
        type: String(r.type || "rising").toLowerCase(),
        points,
        games,
        avgPoints: Number.isFinite(avg) ? Number(avg) : 0,
        signature,
        story: String(r.story || ""),
        // extended submission fields
        careerHighlights: String(careerHighlights || ""),
        favouriteFormation: String(favouriteFormation || ""),
        tacticalPhilosophy: String(tacticalPhilosophy || ""),
        memorableMoment: String(memorableMoment || ""),
        fearedOpponent: String(fearedOpponent || ""),
        ambitions: String(ambitions || ""),
      };

      return obj;
    };

    // map rows -> objects, then find match by id/slug/name
    const mapped = rows.slice(1).map((r) => shape(mapRow(header, r)));

    const findBy = slugify(rawId);
    const found =
      mapped.find((m) => (m.id && slugify(m.id)) === findBy) ||
      mapped.find((m) => slugify(m.name) === findBy) ||
      mapped.find((m) => String(m.name || "").toLowerCase() === rawId.toLowerCase());

    if (!found) return json(404, { error: "Manager not found" });

    return json(200, found);
  } catch (e: any) {
    console.error("manager error", e);
    return json(500, { error: "Failed to load manager" });
  }
};
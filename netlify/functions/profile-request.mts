// netlify/functions/profile-request.mts
import type { Handler } from "@netlify/functions";
import { ensureHeaders, SUBMISSIONS_HEADERS, appendObject, upsertManagerById, MANAGERS_HEADERS, readObjects } from "./_sheets.mts";

const slugify = (s:string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === "POST") {
      await ensureHeaders("Submissions", SUBMISSIONS_HEADERS);
      const body = JSON.parse(event.body || "{}");

      const now = new Date().toISOString();
      const reqId = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;

      const row = {
        "Timestamp": now,
        "Request ID": reqId,
        "Manager Name": body.managerName || "",
        "Club Name": body.clubName || "",
        "Division": body.division || "",
        "Type": body.type || body.managerType || "",
        "Total Points": body.totalPoints || "",
        "Games Played": body.gamesPlayed || "",
        "Career Highlights": body.careerHighlights || "",
        "Favourite Formation": body.favouriteFormation || "",
        "Tactical Philosophy": body.tacticalPhilosophy || "",
        "Most Memorable Moment": body.memorableMoment || "",
        "Most Feared Opponent": body.fearedOpponent || "",
        "Future Ambitions": body.ambitions || "",
        "Story": body.story || "",
        "Status": "pending",
        "Image URL": body.imageUrl || "",
      };

      await appendObject("Submissions", row, SUBMISSIONS_HEADERS);
      return resp(200, { ok: true, requestId: reqId });
    }

    if (event.httpMethod === "PUT") {
      const { action, submissionId } = JSON.parse(event.body || "{}");
      if (!submissionId) return resp(400, { error: "submissionId required" });

      const subs = await readObjects("Submissions");
      const sub = subs.find(s => s["Request ID"] === submissionId);
      if (!sub) return resp(404, { error: "submission not found" });

      if (action === "reject") {
        sub["Status"] = "rejected";
        // simple overwrite: write back row 1 headers + all subs (optional)
        // or leave as-is if you don’t need to persist the status change in the sheet
        return resp(200, { ok: true, action: "rejected" });
      }

      // APPROVE -> map to Managers row
      await ensureHeaders("Managers", MANAGERS_HEADERS);

      const id = slugify(sub["Manager Name"] || "");
      const managerRecord = {
        id,
        name: sub["Manager Name"] || "",
        club: sub["Club Name"] || "",
        division: sub["Division"] || "",
        type: sub["Type"] || "",
        points: sub["Total Points"] || "",
        games: sub["Games Played"] || "",
        signature: sub["Most Memorable Moment"] || sub["Career Highlights"] || "",
        careerHighlights: sub["Career Highlights"] || "",
        favouriteFormation: sub["Favourite Formation"] || "",
        tacticalPhilosophy: sub["Tactical Philosophy"] || "",
        memorableMoment: sub["Most Memorable Moment"] || "",
        fearedOpponent: sub["Most Feared Opponent"] || "",
        ambitions: sub["Future Ambitions"] || "",
        story: sub["Story"] || "",
        avgPoints: "", // optional calc later
      };

      await upsertManagerById(id, managerRecord);
      return resp(200, { ok: true, action: "approved", id });
    }

    if (event.httpMethod === "GET") {
      // list submissions for admin
      const subs = await readObjects("Submissions");
      subs.sort((a,b)=> (b["Timestamp"]||"").localeCompare(a["Timestamp"]||""));
      return resp(200, subs);
    }

    return resp(405, { error: "Method not allowed" });
  } catch (err:any) {
    return resp(500, { error: err?.message || "server error" });
  }
};

const resp = (status:number, body:any) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
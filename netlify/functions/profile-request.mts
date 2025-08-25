import type { Context } from "@netlify/functions";
import {
  getSheets, SHEET_ID,
  TAB_SUBMISSIONS, SUBMISSION_COLUMNS,
  TAB_MANAGERS, MANAGER_COLUMNS,
  toRow, mapRow, json, okCors, colLetters
} from "./_sheets.mts";

export const config = { path: "/api/profile-request" };

const toSlug = (s:string="") => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");

export default async (req: Request, _ctx: Context) => {
  if (req.method === "OPTIONS") return okCors();
  if (req.method === "POST") return submit(req);
  if (req.method === "PUT")  return approveOrReject(req); // keep hook for future
  return json(405, { error:"Method not allowed" });
};

async function submit(req:Request){
  try{
    const body = await req.json();

    const pick = (...keys:string[])=>{
      for (const k of keys){
        if (k in body){
          const v = (body as any)[k];
          if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
        }
      }
      return "";
    };

    const managerName = pick("Manager Name","managerName","name");
    const clubName    = pick("Club Name","clubName","club");
    if (!managerName) return json(400,{error:"Manager Name required"});
    if (!clubName)    return json(400,{error:"Club Name required"});

    const division            = pick("Division","division","div");
    const type                = (pick("Type","type") || "rising").toLowerCase();
    const totalPoints         = pick("Total Points","points");
    const gamesPlayed         = pick("Games Played","games");
    const favouriteFormation  = pick("Favourite Formation","favoriteFormation");
    const tacticalPhilosophy  = pick("Tactical Philosophy","tacticalPhilosophy");
    const mostMemorableMoment = pick("Most Memorable Moment","mostMemorableMoment");
    const mostFearedOpponent  = pick("Most Feared Opponent","mostFearedOpponent");
    const careerHighlights    = pick("Career Highlights","careerHighlights");
    const futureAmbitions     = pick("Future Ambitions","futureAmbitions");
    const story               = pick("Story","story","Your Top 100 Story","yourTop100Story");
    const imageUrl            = pick("Image URL","imageUrl");

    const now = new Date().toISOString();
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

    const sheets = await getSheets();

    // 1) append to Submissions
    const subRecord: Record<string,string> = {
      "Timestamp": now,
      "Request ID": submissionId,
      "Manager Name": managerName,
      "Club Name": clubName,
      "Division": division,
      "Type": type,
      "Total Points": totalPoints,
      "Games Played": gamesPlayed,
      "Favourite Formation": favouriteFormation,
      "Tactical Philosophy": tacticalPhilosophy,
      "Most Memorable Moment": mostMemorableMoment,
      "Most Feared Opponent": mostFearedOpponent,
      "Career Highlights": careerHighlights,
      "Future Ambitions": futureAmbitions,
      "Story": story,
      "Image URL": imageUrl,
      "Status": "approved" // immediate publish for MVP
    };
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${TAB_SUBMISSIONS}!A:Z`,
      valueInputOption: "RAW",
      requestBody: { values: [toRow(subRecord, SUBMISSION_COLUMNS)] }
    });

    // 2) upsert to Managers
    const id = toSlug(managerName);
    const points = Number(totalPoints || 0);
    const games  = Number(gamesPlayed || 0);
    const avgPoints = games ? points / games : 0;

    const signature = (careerHighlights || tacticalPhilosophy || mostMemorableMoment || story || `${managerName} - ${clubName}`).slice(0,150);

    const managerRecord: Record<string,any> = {
      id, name: managerName, club: clubName, division, type,
      points: String(points), games: String(games), avgPoints: String(avgPoints),
      signature, story,
      careerHighlights, favouriteFormation, tacticalPhilosophy,
      memorableMoment: mostMemorableMoment, fearedOpponent: mostFearedOpponent,
      ambitions: futureAmbitions, imageUrl
    };

    // Read Managers to update/insert
    const manRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: `${TAB_MANAGERS}!A:Z`
    });
    const mRows = manRes.data.values || [];
    let header = (mRows[0] || []).map(String);

    // write header if empty
    if (mRows.length === 0){
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID, range: `${TAB_MANAGERS}!A:Z`, valueInputOption:"RAW",
        requestBody: { values: [MANAGER_COLUMNS] }
      });
      header = MANAGER_COLUMNS;
    }

    const idIdx = header.findIndex(h => h.toLowerCase()==="id");
    let existing = -1;
    if (idIdx >= 0){
      for (let i=1;i<mRows.length;i++){
        if ((mRows[i][idIdx] || "") === id){ existing = i; break; }
      }
    }

    if (existing >= 0){
      const rowNum = existing + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_MANAGERS}!A${rowNum}:Z${rowNum}`,
        valueInputOption: "RAW",
        requestBody: { values: [toRow(managerRecord, MANAGER_COLUMNS)] }
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${TAB_MANAGERS}!A:Z`,
        valueInputOption: "RAW",
        requestBody: { values: [toRow(managerRecord, MANAGER_COLUMNS)] }
      });
    }

    return json(200, { success:true, id, message:"Profile submitted & published." });
  }catch(e:any){
    console.error("submit error", e);
    return json(500, { error:"Failed to submit profile", details: e?.message });
  }
}

// kept for future moderation UI (approve/reject)
async function approveOrReject(_req:Request){
  return json(501, { error:"Not implemented in MVP" });
}
import type { Context } from "@netlify/functions";
import {
  getSheets, SHEET_ID,
  TAB_SUBMISSIONS, SUBMISSION_COLUMNS,
  TAB_MANAGERS, MANAGER_COLUMNS,
  toRow, mapRow, json, okCors, colLetters
} from "./_sheets.mts";

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") return okCors();
  if (req.method === "POST") return submitProfile(req);
  if (req.method === "GET")  return listSubmissions();
  if (req.method === "PUT")  return approveOrReject(req);
  return json(405, { error: "Method not allowed" });
};

// POST /api/profile-request
async function submitProfile(req: Request) {
  try {
    const body = await req.json();

    // helper to read first-present key
    const get = (...keys: string[]) => {
      for (const k of keys) {
        const v = (body as any)[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
      }
      return "";
    };

    // accept either Sheet header names or camelCase field names from the FE
    const managerName = get("Manager Name", "managerName", "name");
    const clubName    = get("Club Name", "clubName", "club");
    if (!managerName) return json(400, { error: "Missing required field: Manager Name" });
    if (!clubName)    return json(400, { error: "Missing required field: Club Name" });

    const division            = get("Division", "division");
    const careerHighlights    = get("Career Highlights", "careerHighlights");
    const favouriteFormation  = get("Favourite Formation", "favouriteFormation");
    const tacticalPhilosophy  = get("Tactical Philosophy", "tacticalPhilosophy");
    const mostMemorableMoment = get("Most Memorable Moment", "memorableMoment");
    const mostFearedOpponent  = get("Most Feared Opponent", "fearedOpponent");
    const futureAmbitions     = get("Future Ambitions", "futureAmbitions");
    const story               = get("Story", "story");
    const yourTop100Story     = get("Your Top 100 Story", "yourTop100Story"); // old UI field

    const timestamp = new Date().toISOString();
    const requestId = `sub_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

    // If the old "Your Top 100 Story" is present, append it to Story
    const combinedStory = [story, yourTop100Story].filter(Boolean).join("\n\n");

    const record: Record<string, any> = {
      "Timestamp": timestamp,
      "Request ID": requestId,
      "Manager Name": managerName,
      "Club Name": clubName,
      "Division": division,
      "Career Highlights": careerHighlights,
      "Favourite Formation": favouriteFormation,
      "Tactical Philosophy": tacticalPhilosophy,
      "Most Memorable Moment": mostMemorableMoment,
      "Most Feared Opponent": mostFearedOpponent,
      "Future Ambitions": futureAmbitions,
      "Story": combinedStory,
      "Status": "pending",
    };

    const sheets = await getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${TAB_SUBMISSIONS}!A:Z`,
      valueInputOption: "RAW",
      requestBody: { values: [toRow(record, SUBMISSION_COLUMNS)] }
    });

    return json(200, { success: true, submissionId: requestId, message: "Profile submitted and pending review." });
  } catch (e: any) {
    console.error("submitProfile error", e);
    return json(500, { error: "Failed to submit profile", details: e?.message });
  }
}

// GET /api/profile-request
async function listSubmissions() {
  try {
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_SUBMISSIONS}!A:Z`
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return json(200, []);
    const header = rows[0];
    const items = rows.slice(1).map(r => mapRow(header, r));
    return json(200, items);
  } catch (e: any) {
    console.error("listSubmissions error", e);
    return json(500, { error: "Failed to fetch submissions", details: e?.message });
  }
}

// PUT /api/profile-request  { action: "approve"|"reject", submissionId: "sub_..." }
async function approveOrReject(req: Request) {
  try {
    const { action, submissionId } = await req.json();
    if (!submissionId) return json(400, { error: "Missing submissionId" });
    if (!["approve","reject"].includes(action)) return json(400, { error: "Invalid action" });

    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_SUBMISSIONS}!A:Z`
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return json(404, { error: "Submission not found" });
    const header = rows[0];

    const idIdx = header.indexOf("Request ID");
    const statusIdx = header.indexOf("Status");
    if (idIdx < 0 || statusIdx < 0) return json(500, { error: "Required columns not found" });

    let rowNumber = -1;
    let rowData: Record<string,string> | null = null;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] === submissionId) {
        rowNumber = i + 1;
        rowData = mapRow(header, rows[i]);
        break;
      }
    }
    if (rowNumber === -1 || !rowData) return json(404, { error: "Submission not found" });

    if (action === "reject") {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_SUBMISSIONS}!${colLetters(statusIdx)}${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [["rejected"]] }
      });
      return json(200, { success: true, message: "Submission rejected" });
    }

    // APPROVE → mark approved…
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${TAB_SUBMISSIONS}!${colLetters(statusIdx)}${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values: [["approved"]] }
    });

    // …and publish to Managers
    const managerId = (rowData["Manager Name"] || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const signature =
      (rowData["Career Highlights"] ||
       rowData["Tactical Philosophy"] ||
       rowData["Most Memorable Moment"] ||
       rowData["Story"] ||
       `${rowData["Manager Name"]} - ${rowData["Club Name"]}`
      ).slice(0,150);

    const storyParts = [
      rowData["Story"],
      rowData["Career Highlights"] && `Career Highlights: ${rowData["Career Highlights"]}`,
      rowData["Tactical Philosophy"] && `Tactical Philosophy: ${rowData["Tactical Philosophy"]}`,
      rowData["Favourite Formation"] && `Favourite Formation: ${rowData["Favourite Formation"]}`,
      rowData["Most Memorable Moment"] && `Most Memorable Moment: ${rowData["Most Memorable Moment"]}`,
      rowData["Most Feared Opponent"] && `Most Feared Opponent: ${rowData["Most Feared Opponent"]}`,
      rowData["Future Ambitions"] && `Future Ambitions: ${rowData["Future Ambitions"]}`,
    ].filter(Boolean) as string[];

    const fullStory = storyParts.join("\n\n").trim();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${TAB_MANAGERS}!A:Z`,
      valueInputOption: "RAW",
      requestBody: { values: [[
        managerId,
        rowData["Manager Name"] || "",
        rowData["Club Name"] || "",
        rowData["Division"] || "",
        signature,
        fullStory
      ]] }
    });

    return json(200, { success: true, message: "Profile approved and published" });
  } catch (e: any) {
    console.error("approveOrReject error", e);
    return json(500, { error: "Failed to process approval", details: e?.message });
  }
}

export const config = { path: "/api/profile-request" };
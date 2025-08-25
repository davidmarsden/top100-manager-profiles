// netlify/functions/profile-request.mts
import type { Context } from "@netlify/functions";
import {
  getSheets, SHEET_ID,
  TAB_SUBMISSIONS, SUBMISSION_COLUMNS,
  TAB_MANAGERS, MANAGER_COLUMNS,
  toRow, mapRow, json, okCors, colLetters
} from "./_sheets.mts";

export const config = { path: "/api/profile-request" };

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

    // helper: pick first non-empty value across many possible keys
    const get = (...keys: string[]) => {
      for (const k of keys) {
        if (k in body) {
          const v = (body as any)[k];
          if (v !== undefined && v !== null && String(v).trim() !== "") {
            return String(v).trim();
          }
        }
      }
      return "";
    };

    // Required
    const managerName = get("Manager Name", "managerName", "name");
    const clubName    = get("Club Name", "clubName", "club");
    if (!managerName) return json(400, { error: "Missing required field: Manager Name" });
    if (!clubName)    return json(400, { error: "Missing required field: Club Name" });

    // Optional (accept legacy + camelCase + US/UK spellings)
    const division            = get("Division", "division", "div");
    const careerHighlights    = get("Career Highlights", "careerHighlights", "achievements", "highlights");
    const favouriteFormation  = get("Favourite Formation", "favoriteFormation", "favourite", "favorite", "formation", "favFormation");
    const tacticalPhilosophy  = get("Tactical Philosophy", "tacticalPhilosophy", "tactics", "philosophy");
    const mostMemorableMoment = get("Most Memorable Moment", "mostMemorableMoment", "memorableMoment");
    const mostFearedOpponent  = get("Most Feared Opponent", "mostFearedOpponent", "fearedOpponent");
    const futureAmbitions     = get("Future Ambitions", "futureAmbitions", "ambitions", "goals");

    // Story can come from either/both fields; merge them
    const storyPrimary  = get("Story", "story");
    const storyExtra    = get("Your Top 100 Story", "yourTop100Story");
    const combinedStory = [storyPrimary, storyExtra].filter(Boolean).join("\n\n");

    const timestamp = new Date().toISOString();
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

    const record: Record<string, any> = {
      "Timestamp": timestamp,
      "Request ID": submissionId,
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

    return json(200, { success: true, submissionId, message: "Profile submitted and pending review." });
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

    // Load Submissions to find the row
    const subRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_SUBMISSIONS}!A:Z`
    });

    const rows = subRes.data.values || [];
    if (rows.length <= 1) return json(404, { error: "Submission not found" });
    const header = rows[0];

    const idIdx     = header.indexOf("Request ID");
    const statusIdx = header.indexOf("Status");
    if (idIdx < 0 || statusIdx < 0) {
      return json(500, { error: "Required columns not found in Submissions" });
    }

    let rowNumber = -1;
    let rowData: Record<string,string> | null = null;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] === submissionId) {
        rowNumber = i + 1; // 1-based for Sheets
        rowData = mapRow(header, rows[i]);
        break;
      }
    }
    if (rowNumber === -1 || !rowData) return json(404, { error: "Submission not found" });

    // REJECT branch — just set status
    if (action === "reject") {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_SUBMISSIONS}!${colLetters(statusIdx)}${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [["rejected"]] }
      });
      return json(200, { success: true, message: "Submission rejected" });
    }

    // APPROVE branch:
    // 1) mark submission as approved
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${TAB_SUBMISSIONS}!${colLetters(statusIdx)}${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values: [["approved"]] }
    });

    // 2) upsert into Managers (includes extended fields)
    const toSlug = (s: string) =>
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    const managerId = toSlug(rowData["Manager Name"] || "");

    // A short signature fallback (kept for the grid card)
    const signature =
      (rowData["Career Highlights"] ||
       rowData["Tactical Philosophy"] ||
       rowData["Most Memorable Moment"] ||
       rowData["Story"] ||
       `${rowData["Manager Name"] || ""} - ${rowData["Club Name"] || ""}`
      || "").slice(0, 150);

    // Full story stays as-is in its own field; extended fields are written separately
    const managerRecord: Record<string, any> = {
      // NOTE: Your MANAGER_COLUMNS in _sheets.mts should include these keys
      // e.g. ["id","name","club","division","signature","story","careerHighlights","favouriteFormation","tacticalPhilosophy","memorableMoment","fearedOpponent","ambitions","type","points","games","avgPoints"]
      id: managerId,
      name: rowData["Manager Name"] || "",
      club: rowData["Club Name"] || "",
      division: rowData["Division"] || "",
      signature,
      story: rowData["Story"] || "",
      careerHighlights: rowData["Career Highlights"] || "",
      favouriteFormation: rowData["Favourite Formation"] || "",
      tacticalPhilosophy: rowData["Tactical Philosophy"] || "",
      memorableMoment: rowData["Most Memorable Moment"] || "",
      fearedOpponent: rowData["Most Feared Opponent"] || "",
      ambitions: rowData["Future Ambitions"] || "",
      // optional defaults the site can rely on
      type: "rising",
      points: "",
      games: "",
      avgPoints: ""
    };

    // Read Managers to upsert by id
    const manRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_MANAGERS}!A:Z`
    });
    const mRows = manRes.data.values || [];
    let mHeader = mRows[0] || [];

    // If Managers is empty, write header row first using MANAGER_COLUMNS
    if (mRows.length === 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${TAB_MANAGERS}!A:Z`,
        valueInputOption: "RAW",
        requestBody: { values: [MANAGER_COLUMNS] }
      });
      mHeader = MANAGER_COLUMNS;
    }

    // Find existing row by "id" column
    const idColIdx = mHeader.findIndex(h => String(h).trim().toLowerCase() === "id");
    let existingRowIndex = -1;
    if (idColIdx >= 0) {
      for (let i = 1; i < mRows.length; i++) {
        if ((mRows[i][idColIdx] || "") === managerId) {
          existingRowIndex = i; // 0-based (i=1 means row 2 in sheet)
          break;
        }
      }
    }

    if (existingRowIndex >= 0) {
      // UPDATE (overwrite entire row by columns)
      const rowNum = existingRowIndex + 1; // sheet is 1-based
      const values = [toRow(managerRecord, MANAGER_COLUMNS)];
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_MANAGERS}!A${rowNum}:Z${rowNum}`,
        valueInputOption: "RAW",
        requestBody: { values }
      });
    } else {
      // INSERT
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${TAB_MANAGERS}!A:Z`,
        valueInputOption: "RAW",
        requestBody: { values: [toRow(managerRecord, MANAGER_COLUMNS)] }
      });
    }

    return json(200, { success: true, message: "Submission approved and profile published/updated" });
  } catch (e: any) {
    console.error("approveOrReject error", e);
    return json(500, { error: "Failed to process approval", details: e?.message });
  }
}
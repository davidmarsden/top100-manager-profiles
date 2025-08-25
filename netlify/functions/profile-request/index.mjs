import {
  getSheets, SHEET_ID,
  TAB_SUBMISSIONS, SUBMISSION_COLUMNS,
  json, ok, toRow, mapRow, colLetters,
  TAB_MANAGERS, MANAGER_COLUMNS
} from "../_sheets.mjs";

export default async (req) => {
  if (req.method === "OPTIONS") return ok();
  if (req.method === "GET")    return listSubmissions();
  if (req.method === "POST")   return submitProfile(req);
  if (req.method === "PUT")    return approveOrReject(req);
  return json(405, { error: "Method not allowed" });
};

async function submitProfile(req) {
  try {
    const body = await req.json();

    const get = (...keys) => {
      for (const k of keys) {
        if (k in body) {
          const v = body[k];
          if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
        }
      }
      return "";
    };

    const managerName = get("Manager Name","managerName","name");
    const clubName    = get("Club Name","clubName","club");
    if (!managerName) return json(400, { error: "Missing Manager Name" });
    if (!clubName)    return json(400, { error: "Missing Club Name" });

    const division            = get("Division","division");
    const careerHighlights    = get("Career Highlights","careerHighlights");
    const favouriteFormation  = get("Favourite Formation","favoriteFormation","favourite","favorite");
    const tacticalPhilosophy  = get("Tactical Philosophy","tacticalPhilosophy");
    const mostMemorableMoment = get("Most Memorable Moment","mostMemorableMoment");
    const mostFearedOpponent  = get("Most Feared Opponent","mostFearedOpponent");
    const futureAmbitions     = get("Future Ambitions","futureAmbitions");
    const story               = get("Story","story","Your Top 100 Story","yourTop100Story");

    const timestamp = new Date().toISOString();
    const requestId = `sub_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

    const record = {
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
      "Story": story,
      "Status": "pending"
    };

    const sheets = await getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${TAB_SUBMISSIONS}!A:Z`,
      valueInputOption: "RAW",
      requestBody: { values: [toRow(record, SUBMISSION_COLUMNS)] }
    });

    return json(200, { ok: true, submissionId: requestId });
  } catch (e) {
    console.error("submitProfile error", e);
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}

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
  } catch (e) {
    console.error("listSubmissions error", e);
    return json(500, { error: "Failed to list submissions" });
  }
}

async function approveOrReject(req) {
  try {
    const { action, submissionId } = await req.json();
    if (!submissionId) return json(400, { error: "Missing submissionId" });
    if (!["approve","reject"].includes(action)) return json(400, { error: "Invalid action" });

    const sheets = await getSheets();
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_SUBMISSIONS}!A:Z`
    });
    const rows = getRes.data.values || [];
    if (rows.length <= 1) return json(404, { error: "Submission not found" });
    const header = rows[0];
    const idIdx = header.indexOf("Request ID");
    const statusIdx = header.indexOf("Status");
    if (idIdx < 0 || statusIdx < 0) return json(500, { error: "Required columns missing" });

    let rowNumber = -1, row = null;
    for (let i = 1; i < rows.length; i++) {
      if ((rows[i][idIdx] || "") === submissionId) { rowNumber = i + 1; row = rows[i]; break; }
    }
    if (rowNumber < 0) return json(404, { error: "Submission not found" });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${TAB_SUBMISSIONS}!${colLetters(statusIdx)}${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values: [[action === "approve" ? "approved" : "rejected"]] }
    });

    if (action === "reject") return json(200, { ok: true, message: "Rejected" });

    // If approved → publish to Managers
    const data = mapRow(header, row);
    const toSlug = (s) => String(s || "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const id = toSlug(data["Manager Name"]);

    const signature = (
      data["Career Highlights"] ||
      data["Tactical Philosophy"] ||
      data["Most Memorable Moment"] ||
      data["Story"] ||
      `${data["Manager Name"]} - ${data["Club Name"]}`
    ).slice(0, 150);

    const managerRecord = {
      id,
      name: data["Manager Name"] || "",
      club: data["Club Name"] || "",
      division: data["Division"] || "",
      signature,
      story: data["Story"] || "",
      careerHighlights: data["Career Highlights"] || "",
      favouriteFormation: data["Favourite Formation"] || "",
      tacticalPhilosophy: data["Tactical Philosophy"] || "",
      memorableMoment: data["Most Memorable Moment"] || "",
      fearedOpponent: data["Most Feared Opponent"] || "",
      ambitions: data["Future Ambitions"] || "",
      type: "rising",
      points: "",
      games: "",
      avgPoints: ""
    };

    // upsert into Managers
    const manRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_MANAGERS}!A:Z`
    });
    const mRows = manRes.data.values || [];
    const mHeader = mRows[0] || MANAGER_COLUMNS;

    let idCol = mHeader.findIndex(h => String(h).toLowerCase() === "id");
    if (idCol < 0) { // empty sheet → write headers first
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${TAB_MANAGERS}!A:Z`,
        valueInputOption: "RAW",
        requestBody: { values: [MANAGER_COLUMNS] }
      });
      idCol = 0;
    }

    let existing = -1;
    for (let i = 1; i < mRows.length; i++) {
      if ((mRows[i][idCol] || "") === id) { existing = i; break; }
    }

    const payload = [MANAGER_COLUMNS.map((c) => managerRecord[c] ?? "")];

    if (existing >= 0) {
      const rowNum = existing + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_MANAGERS}!A${rowNum}:Z${rowNum}`,
        valueInputOption: "RAW",
        requestBody: { values: payload }
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${TAB_MANAGERS}!A:Z`,
        valueInputOption: "RAW",
        requestBody: { values: payload }
      });
    }

    return json(200, { ok: true, message: "Approved & published", id });
  } catch (e) {
    console.error("approveOrReject error", e);
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}
// netlify/functions/_sheets.mts
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
if (!SHEET_ID) throw new Error("GOOGLE_SHEET_ID missing");

export const SUBMISSIONS_HEADERS = [
  "Timestamp","Request ID","Manager Name","Club Name","Division","Type",
  "Total Points","Games Played","Career Highlights","Favourite Formation",
  "Tactical Philosophy","Most Memorable Moment","Most Feared Opponent",
  "Future Ambitions","Story","Status","Image URL",
];

export const MANAGERS_HEADERS = [
  "id","name","club","division","signature","story","careerHighlights",
  "favouriteFormation","tacticalPhilosophy","memorableMoment",
  "fearedOpponent","ambitions","type","points","games","avgPoints",
];

const norm = (s:string) =>
  s.trim().toLowerCase().replace(/\s+/g," ").replace(/[^a-z0-9 ]/g,"").replace(/ +/g,"_");

async function getSheets() {
  const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!), scopes: SCOPES });
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

export async function ensureHeaders(sheetName:string, headers:string[]) {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${sheetName}!1:1` });
  const row = (res.data.values?.[0] ?? []) as string[];

  const equal =
    row.length === headers.length &&
    row.every((v, i) => v?.trim() === headers[i]);

  if (!equal) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!1:1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
  }
}

export async function readObjects(sheetName:string) {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${sheetName}` });
  const values = res.data.values ?? [];
  if (values.length === 0) return [];
  const headers = values[0].map(String);
  const mapIdx: Record<string, number> = {};
  headers.forEach((h, i) => (mapIdx[norm(h)] = i));

  return values.slice(1).filter(r => r.some(c => c !== "" && c != null)).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = (row[i] ?? "").toString()));
    return obj;
  });
}

// Append using a header row (creates empty cells for missing keys)
export async function appendObject(sheetName:string, obj:Record<string, any>, headers:string[]) {
  const sheets = await getSheets();
  const row = headers.map(h => obj[h] ?? "");
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

// Overwrite a Managers row by id
export async function upsertManagerById(id:string, record:Record<string, any>) {
  const sheets = await getSheets();
  // read all to find index
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `Managers` });
  const values = res.data.values ?? [];
  let rowIndex = -1;
  if (values.length > 1) {
    for (let i = 1; i < values.length; i++) {
      if ((values[i][0] ?? "") === id) { rowIndex = i; break; }
    }
  }
  const row = MANAGERS_HEADERS.map(h => record[h] ?? "");
  if (rowIndex === -1) {
    await appendObject("Managers", record, MANAGERS_HEADERS);
  } else {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Managers!${rowIndex + 1}:${rowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });
  }
}
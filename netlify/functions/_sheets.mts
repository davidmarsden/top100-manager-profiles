// Shared helper for Google Sheets access and JSON/CORS utilities
import { google } from "googleapis";

export const SHEET_ID = process.env.GOOGLE_SHEET_ID;
export const TAB_SUBMISSIONS = "Submissions";
export const TAB_MANAGERS = "Managers";

// EXACT header order we’ll write to Managers (include extended fields)
export const MANAGER_COLUMNS = [
  "id","name","club","division","signature","story",
  "careerHighlights","favouriteFormation","tacticalPhilosophy",
  "memorableMoment","fearedOpponent","ambitions",
  "type","points","games","avgPoints"
];

export const SUBMISSION_COLUMNS = [
  "Timestamp","Request ID","Manager Name","Club Name","Division",
  "Career Highlights","Favourite Formation","Tactical Philosophy",
  "Most Memorable Moment","Most Feared Opponent","Future Ambitions",
  "Story","Status"
];

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() }
  });
}

export function ok() {
  return new Response(null, { status: 200, headers: corsHeaders() });
}

export function toRow(obj, cols) {
  return cols.map((c) => obj[c] ?? "");
}

export function mapRow(header, row) {
  const o = {};
  for (let i = 0; i < header.length; i++) o[header[i]] = row[i] ?? "";
  return o;
}

export function colLetters(zeroIdx) {
  let s = "", x = zeroIdx + 1;
  while (x > 0) { const m = (x - 1) % 26; s = String.fromCharCode(65 + m) + s; x = Math.floor((x - 1) / 26); }
  return s;
}

export async function getSheets() {
  // GOOGLE_SERVICE_ACCOUNT can be plain JSON or base64-encoded JSON
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT || "";
  const creds = raw.trim().startsWith("{")
    ? JSON.parse(raw)
    : JSON.parse(Buffer.from(raw, "base64").toString("utf8"));

  const jwt = new google.auth.JWT(
    creds.client_email,
    undefined,
    creds.private_key,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
  return google.sheets({ version: "v4", auth: jwt });
}
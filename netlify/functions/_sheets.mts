// netlify/functions/_sheets.mts
import { google } from 'googleapis';

export const SHEET_ID = Netlify.env.get("GOOGLE_SHEET_ID");
export const TAB_SUBMISSIONS = "Submissions";
export const TAB_MANAGERS = "Managers";

// EXACT header order for Submissions (must match the Submissions tab row 1):
export const SUBMISSION_COLUMNS = [
  "Timestamp",
  "Request ID",
  "Manager Name",
  "Club Name",
  "Division",
  "Career Highlights",
  "Favourite Formation",
  "Tactical Philosophy",
  "Most Memorable Moment",
  "Most Feared Opponent",
  "Future Ambitions",
  "Story",
  "Status",
];

// === Managers columns ===
// Update your Google Sheet "Managers" tab first row to match this EXACT order.
export const MANAGER_COLUMNS = [
  "id",
  "name",
  "club",
  "division",
  "signature",
  "story",
  // Extended fields used by individual profile pages:
  "careerHighlights",
  "favouriteFormation",
  "tacticalPhilosophy",
  "memorableMoment",
  "fearedOpponent",
  "ambitions",
  // Optional numeric/meta fields (kept for cards/sorting; safe to leave blank):
  "type",
  "points",
  "games",
  "avgPoints",
];

function parseServiceAccount() {
  const raw = Netlify.env.get("GOOGLE_SERVICE_ACCOUNT") || "";
  const json = raw.trim().startsWith("{")
    ? JSON.parse(raw)
    : JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  return json;
}

export async function getSheets() {
  const creds = parseServiceAccount();
  const jwt = new google.auth.JWT(
    creds.client_email,
    undefined,
    creds.private_key,
    // RW scope so we can append/update both tabs
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
  return google.sheets({ version: "v4", auth: jwt });
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}

export function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}

export function okCors() {
  return new Response(null, { status: 200, headers: corsHeaders() });
}

export function toRow(obj: Record<string, any>, cols: string[]) {
  return cols.map(c => obj[c] ?? "");
}

export function mapRow(header: string[], row: string[]) {
  const o: Record<string,string> = {};
  for (let i=0;i<header.length;i++) o[header[i]] = row[i] ?? "";
  return o;
}

export function colLetters(zeroBasedIndex: number) {
  let s = "", x = zeroBasedIndex + 1;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}
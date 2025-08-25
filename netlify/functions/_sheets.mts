// netlify/functions/_sheets.mts
// Unified Google Sheets helper used by all Netlify functions.
// - Works with a Service Account in env GOOGLE_SERVICE_ACCOUNT (JSON string)
// - Uses spreadsheet id from env GOOGLE_SHEET_ID
// - Exports both new and legacy helper names so older functions keep working.

import { google } from "googleapis";

/* -------------------- Configuration -------------------- */

export const SHEET_ID =
  process.env.GOOGLE_SHEET_ID?.trim() ??
  (() => {
    throw new Error("GOOGLE_SHEET_ID env var is required");
  })();

export const TAB_SUBMISSIONS = "Submissions";
export const TAB_MANAGERS = "Managers";

/** Headings for the Submissions (moderation) sheet. */
export const SUBMISSIONS_HEADERS = [
  "Timestamp",
  "Request ID",
  "Manager Name",
  "Club Name",
  "Division",
  "Type",
  "Total Points",
  "Games Played",
  "Career Highlights",
  "Favourite Formation",
  "Tactical Philosophy",
  "Most Memorable Moment",
  "Most Feared Opponent",
  "Future Ambitions",
  "Story",
  "Status",
  "Image URL",
] as const;

/** Headings for the Managers (published) sheet. */
export const MANAGERS_HEADERS = [
  "id",
  "name",
  "club",
  "division",
  "signature",
  "story",
  "careerHighlights",
  "favouriteFormation",
  "tacticalPhilosophy",
  "memorableMoment",
  "fearedOpponent",
  "ambitions",
  "type",
  "points",
  "games",
  "avgPoints",
  "imageUrl",
] as const;

/* ---------- Back-compat aliases (expected by older code) ---------- */
export const SUBMISSION_COLUMNS = SUBMISSIONS_HEADERS;
export const MANAGER_COLUMNS = MANAGERS_HEADERS;

/* -------------------- Auth & client -------------------- */

function parseServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT env var is required");

  try {
    // Accepts raw JSON string or base64 JSON
    const text =
      raw.trim().startsWith("{")
        ? raw
        : Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(text);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT is not valid JSON/base64 JSON");
  }
}

/** Returns an authenticated sheets client */
export async function getSheets() {
  const creds = parseServiceAccount();
  const scopes = ["https://www.googleapis.com/auth/spreadsheets"];
  const auth = new google.auth.JWT(
    creds.client_email,
    undefined,
    creds.private_key,
    scopes
  );
  await auth.authorize();

  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

/* -------------------- HTTP helpers -------------------- */

/** JSON response wrapper — returns a real Web Response (Netlify next-gen expects this) */
export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

/** ok(data) -> 200 JSON Response */
export const ok = (data: unknown): Response => json(200, data);

/* -------------------- Sheet utilities -------------------- */

/** A1-style column letters from 0-based index (0 -> A, 25 -> Z, 26 -> AA …) */
export function colLetters(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/** Normalize a header key for object access (trim & collapse spaces) */
function norm(h: string) {
  return h.replace(/\s+/g, " ").trim();
}

/** Row -> object using provided headers (header names preserved as given) */
export function mapRow<T extends readonly string[]>(
  headers: T,
  row: (string | number | null | undefined)[]
): Record<T[number], string> {
  const out: Record<string, string> = {};
  headers.forEach((h, i) => {
    const v = row[i];
    out[h] =
      v === null || v === undefined ? "" : typeof v === "string" ? v : String(v);
  });
  return out as Record<T[number], string>;
}

/** Object -> row aligned to headers */
export function toRow<T extends readonly string[]>(
  obj: Record<string, any>,
  headers: T
): (string | number)[] {
  const byNorm: Record<string, any> = {};
  // allow loose matching (e.g. “Favourite Formation ” vs “Favourite Formation”)
  Object.keys(obj).forEach((k) => (byNorm[norm(k)] = obj[k]));
  return headers.map((h) => {
    const v = byNorm[norm(h)] ?? obj[h];
    return v === undefined || v === null ? "" : v;
  });
}

/** Ensure the first row of a tab matches the expected headers. Creates the tab if missing. */
export async function ensureHeaders(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  tab: string,
  headers: readonly string[]
) {
  // Try read first row; if the sheet/tab is missing we'll create it.
  let needsCreate = false;
  try {
    await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tab}!A1:A1`,
    });
  } catch (err: any) {
    if (String(err?.code) === "400" || String(err?.code) === "404") {
      needsCreate = true;
    } else {
      throw err;
    }
  }

  if (needsCreate) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tab } } }],
      },
    });
  }

  // Write headers (idempotent)
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${tab}!A1:${colLetters(headers.length - 1)}1`,
    valueInputOption: "RAW",
    requestBody: { values: [Array.from(headers)] },
  });
}

/** Read all rows (objects) from a tab using the supplied headers. */
export async function readObjects<T extends readonly string[]>(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  tab: string,
  headers: T
): Promise<Record<T[number], string>[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tab}!A2:${colLetters(headers.length - 1)}`,
    majorDimension: "ROWS",
  });
  const rows = (res.data.values ?? []) as any[][];
  return rows.map((r) => mapRow(headers, r));
}

/** Append one object (aligned by headers) to a tab. */
export async function appendObject<T extends readonly string[]>(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  tab: string,
  headers: T,
  obj: Record<string, any>
) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tab}!A1:${colLetters(headers.length - 1)}`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [toRow(obj, headers)] },
  });
}

/**
 * Upsert a manager by `id` (first column in MANAGERS_HEADERS).
 * If a row with the same id exists, it is updated; otherwise appended.
 */
export async function upsertManagerById(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  obj: Record<string, any>
) {
  const headers = MANAGERS_HEADERS;
  const idIndex = 0; // "id" is first column by our definition

  // Fetch existing ids
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${TAB_MANAGERS}!A2:A`,
    majorDimension: "COLUMNS",
  });
  const ids = ((res.data.values?.[0] ?? []) as string[]).map((s) => String(s));

  const rowValues = toRow(obj, headers);

  const foundIndex = ids.findIndex((v) => v === String(obj.id));
  if (foundIndex === -1) {
    // Append
    await appendObject(sheets, sheetId, TAB_MANAGERS, headers, obj);
    return { action: "inserted" as const };
  }

  // Update row N (offset + 2 due to header row and 1-based index)
  const rowNumber = foundIndex + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${TAB_MANAGERS}!A${rowNumber}:${colLetters(headers.length - 1)}${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [rowValues] },
  });
  return { action: "updated" as const };
}

/* -------------------- Convenience loaders -------------------- */

/** Ensure both tabs exist with the correct headers (safe to call before writes). */
export async function ensureAllTabs() {
  const sheets = await getSheets();
  await ensureHeaders(sheets, SHEET_ID, TAB_SUBMISSIONS, SUBMISSIONS_HEADERS);
  await ensureHeaders(sheets, SHEET_ID, TAB_MANAGERS, MANAGERS_HEADERS);
  return sheets;
}

/* -------------------- Types (optional help for TS) -------------------- */

export type SubmissionRow = Record<(typeof SUBMISSIONS_HEADERS)[number], string>;
export type ManagerRow = Record<(typeof MANAGERS_HEADERS)[number], string>;
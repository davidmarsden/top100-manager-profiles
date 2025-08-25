// netlify/functions/repair-submissions.mts
import { google } from "googleapis";

const JSONResp = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });

const SUBMISSIONS_TAB = "Submissions";
const SUBMISSIONS_HEADERS = [
  "Timestamp","Request ID","Manager Name","Club Name","Division","Type",
  "Total Points","Games Played","Career Highlights","Favourite Formation",
  "Tactical Philosophy","Most Memorable Moment","Most Feared Opponent",
  "Future Ambitions","Story","Status","Image URL"
];

const EXPECTED_TYPES = ["rising","legend","evergreen","icon","newcomer","hall of fame"];

async function getSheetsRW() {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT || "";
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID");
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT");

  const creds = raw.trim().startsWith("{")
    ? JSON.parse(raw)
    : JSON.parse(Buffer.from(raw, "base64").toString("utf8"));

  const auth = new google.auth.JWT(
    creds.client_email,
    undefined,
    creds.private_key,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, SHEET_ID };
}

export default async () => {
  try {
    const { sheets, SHEET_ID } = await getSheetsRW();

    // Read current sheet
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SUBMISSIONS_TAB}!A1:Z`,
    });
    const rows: string[][] = data.values || [];
    if (rows.length === 0) return JSONResp({ ok: true, repaired: 0, note: "empty sheet" });

    // Ensure canonical header row
    const header = SUBMISSIONS_HEADERS;
    const headerMap = new Map(header.map((h, i) => [h, i]));

    // Convert row array -> object using current first row as keys
    const currentHeader = rows[0].map((h) => String(h).trim());
    const toObj = (r: string[]) =>
      currentHeader.reduce<Record<string, string>>((acc, h, i) => {
        acc[h] = (r[i] ?? "").toString();
        return acc;
      }, {});
    const bodyRows = rows.slice(1).map(toObj);

    let repaired = 0;

    const fixed = bodyRows.map((r) => {
      // Normalize into our canonical object with safe defaults
      const o: Record<string, string> = {};
      for (const h of header) o[h] = r[h] ?? "";

      // Heuristic 1: if Type looks like a paragraph (>= 20 chars) but Career Highlights empty,
      // swap them.
      const typeVal = (o["Type"] || "").trim();
      const chVal = (o["Career Highlights"] || "").trim();
      if (typeVal.length >= 20 && chVal === "") {
        o["Career Highlights"] = typeVal;
        o["Type"] = ""; // unknown; let admin fix if needed
        repaired++;
      }

      // Heuristic 2: Type should be one of our known set (case-insensitive).
      if (o["Type"] && !EXPECTED_TYPES.includes(o["Type"].toLowerCase())) {
        // If Type is short but invalid, leave it; admin can fix later.
      }

      // Heuristic 3: Games/Points numeric sanity. If Total Points is non-numeric
      // but Games Played is numeric (or vice versa), try swapping.
      const tp = o["Total Points"].trim();
      const gp = o["Games Played"].trim();
      const isNum = (s: string) => s !== "" && !Number.isNaN(Number(s));
      if (!isNum(tp) && isNum(gp)) {
        // If Career Highlights is numeric, we definitely messed up elsewhere; ignore.
        // Try swap once.
        o["Total Points"] = gp;
        o["Games Played"] = tp;
        repaired++;
      }

      // Heuristic 4: Status default pending if blank (for legacy rows)
      if (!o["Status"]) o["Status"] = "pending";

      return o;
    });

    // Write back: header + fixed rows in canonical order
    const values = [header, ...fixed.map((o) => header.map((h) => o[h] ?? ""))];
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: `${SUBMISSIONS_TAB}!A:Z`,
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SUBMISSIONS_TAB}!A1`,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    return JSONResp({ ok: true, repaired, rows: fixed.length });
  } catch (err: any) {
    return JSONResp({ ok: false, error: err?.message || String(err) }, 500);
  }
};
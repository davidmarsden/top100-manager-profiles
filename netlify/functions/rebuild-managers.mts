// netlify/functions/rebuild-managers.mts
import { google } from "googleapis";

const JSONResp = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });

const SUBMISSIONS_TAB = "Submissions";
const MANAGERS_TAB = "Managers";

const SUBMISSIONS_HEADERS = [
  "Timestamp","Request ID","Manager Name","Club Name","Division","Type",
  "Total Points","Games Played","Career Highlights","Favourite Formation",
  "Tactical Philosophy","Most Memorable Moment","Most Feared Opponent",
  "Future Ambitions","Story","Status","Image URL"
];

const MANAGERS_HEADERS = [
  "id","name","club","division","type","points","games","signature",
  "careerHighlights","favouriteFormation","tacticalPhilosophy",
  "memorableMoment","fearedOpponent","ambitions","story","avgPoints"
];

const slugify = (s: string) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function getSheets() {
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

async function readAll(sheets: any, SHEET_ID: string, tab: string) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A1:Z`,
  });
  const rows: string[][] = res.data.values || [];
  if (rows.length === 0) return { header: [], data: [] as any[] };

  const header = rows[0].map((h) => String(h).trim());
  const idx = (name: string) => header.findIndex((h) => h === name);
  const toObj = (r: string[]) =>
    header.reduce<Record<string, string>>((acc, h, i) => {
      acc[h] = (r[i] ?? "").toString();
      return acc;
    }, {});
  const data = rows.slice(1).map(toObj);
  return { header, data };
}

async function writeRows(
  sheets: any,
  SHEET_ID: string,
  tab: string,
  header: string[],
  rows: Record<string, string | number>[]
) {
  // clear entire sheet
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A:Z`,
  });

  // write header + data
  const values = [header, ...rows.map((o) => header.map((h) => o[h] ?? ""))];
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A1`,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

export default async () => {
  try {
    const { sheets, SHEET_ID } = await getSheets();

    // 1) Ensure canonical headers on both tabs (don’t trust existing headers)
    const subs = await readAll(sheets, SHEET_ID, SUBMISSIONS_TAB);
    const fixedSubsRows =
      subs.data.filter((r) => r["Request ID"] && r["Request ID"] !== "Request ID");
    await writeRows(sheets, SHEET_ID, SUBMISSIONS_TAB, SUBMISSIONS_HEADERS, fixedSubsRows);

    // 2) Build managers from approved submissions only
    const approved = fixedSubsRows.filter(
      (r) => (r["Status"] || "").toLowerCase() === "approved"
    );

    const managers = approved.map((s) => {
      const id = slugify(s["Manager Name"]);
      const points = s["Total Points"] || "";
      const games = s["Games Played"] || "";
      let avg = "";
      const p = Number(points);
      const g = Number(games);
      if (Number.isFinite(p) && Number.isFinite(g) && g > 0) {
        avg = (p / g).toFixed(2);
      }
      return {
        id,
        name: s["Manager Name"] || "",
        club: s["Club Name"] || "",
        division: s["Division"] || "",
        type: (s["Type"] || "rising").toLowerCase(),
        points,
        games,
        signature: s["Most Memorable Moment"] || s["Career Highlights"] || "",
        careerHighlights: s["Career Highlights"] || "",
        favouriteFormation: s["Favourite Formation"] || "",
        tacticalPhilosophy: s["Tactical Philosophy"] || "",
        memorableMoment: s["Most Memorable Moment"] || "",
        fearedOpponent: s["Most Feared Opponent"] || "",
        ambitions: s["Future Ambitions"] || "",
        story: s["Story"] || "",
        avgPoints: avg,
      };
    });

    // 3) Write Managers fresh
    await writeRows(sheets, SHEET_ID, MANAGERS_TAB, MANAGERS_HEADERS, managers);

    return JSONResp({
      ok: true,
      submissionsFound: fixedSubsRows.length,
      approvedCount: approved.length,
      managersWritten: managers.length,
      managersHeader: MANAGERS_HEADERS,
    });
  } catch (err: any) {
    return JSONResp({ ok: false, error: err?.message || String(err) }, 500);
  }
};
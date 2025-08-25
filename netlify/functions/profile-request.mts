// netlify/functions/profile-request.mts
import { google } from "googleapis";

/* ---------- config ---------- */
const TAB_SUBMISSIONS = "Submissions";
const TAB_MANAGERS = "Managers";

const SUBMISSIONS_HEADERS = [
  "Timestamp","Request ID","Manager Name","Club Name","Division","Type",
  "Total Points","Games Played",
  "Career Highlights","Favourite Formation","Tactical Philosophy",
  "Most Memorable Moment","Most Feared Opponent","Future Ambitions",
  "Story","Status","Image URL"
];

const MANAGERS_HEADERS = [
  "id","name","club","division","type",
  "points","games","signature",
  "careerHighlights","favouriteFormation","tacticalPhilosophy",
  "memorableMoment","fearedOpponent","ambitions","story","avgPoints"
];

/* ---------- helpers ---------- */
const asJSON = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
      "access-control-allow-headers": "content-type",
      "cache-control": "no-store",
    },
  });

const parseCreds = (raw: string) => {
  return raw.trim().startsWith("{")
    ? JSON.parse(raw)
    : JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const toRow = (obj: Record<string, any>, headers: string[]) =>
  headers.map((h) => (obj[h] ?? "").toString());

/* ---------- bootstrap sheets client ---------- */
async function getSheets() {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT || "";
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID");
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT");

  const { client_email, private_key } = parseCreds(raw);
  const auth = new google.auth.JWT(
    client_email,
    undefined,
    private_key,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, SHEET_ID };
}

async function ensureHeaders(
  sheets: ReturnType<typeof google.sheets> extends infer T ? any : never,
  SHEET_ID: string,
  tab: string,
  headers: string[]
) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A1:Z1`,
  });
  const first = res.data.values?.[0] || [];
  const current = first.map((v) => String(v));
  if (current.join("\t") !== headers.join("\t")) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${tab}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
  }
}

async function readObjects(
  sheets: any,
  SHEET_ID: string,
  tab: string
): Promise<Record<string, string>[]> {
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A1:Z`,
  });
  const rows = data.values || [];
  if (rows.length < 2) return [];
  const header = rows[0].map((h: any) => String(h));
  return rows.slice(1).map((r: any[]) =>
    Object.fromEntries(header.map((h: string, i: number) => [h, r[i] ?? ""]))
  );
}

async function appendRow(
  sheets: any,
  SHEET_ID: string,
  tab: string,
  values: any[]
) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A:A`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
}

async function upsertManagerById(
  sheets: any,
  SHEET_ID: string,
  record: Record<string, any>
) {
  // read managers to see if the id exists
  const list = await readObjects(sheets, SHEET_ID, TAB_MANAGERS);
  const idx = list.findIndex((r) => r.id === record.id);

  if (idx === -1) {
    // append
    await appendRow(
      sheets,
      SHEET_ID,
      TAB_MANAGERS,
      toRow(record, MANAGERS_HEADERS)
    );
  } else {
    // update exact row (add 2 for header + 1-based index)
    const rowNum = idx + 2;
    const range = `${TAB_MANAGERS}!A${rowNum}:${String.fromCharCode(
      65 + MANAGERS_HEADERS.length - 1
    )}${rowNum}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: { values: [toRow(record, MANAGERS_HEADERS)] },
    });
  }
}

/* ---------- function ---------- */
export default async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") return asJSON(null, 204);

  try {
    const { sheets, SHEET_ID } = await getSheets();

    if (req.method === "POST") {
      await ensureHeaders(sheets, SHEET_ID, TAB_SUBMISSIONS, SUBMISSIONS_HEADERS);
      const body = await req.json().catch(() => ({}));

      const now = new Date().toISOString();
      const reqId =
        `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

      const rowObj: Record<string, any> = {
        "Timestamp": now,
        "Request ID": reqId,
        "Manager Name": body.managerName ?? "",
        "Club Name": body.clubName ?? "",
        "Division": body.division ?? "",
        "Type": body.type ?? body.managerType ?? "",
        "Total Points": body.totalPoints ?? "",
        "Games Played": body.gamesPlayed ?? "",
        "Career Highlights": body.careerHighlights ?? "",
        "Favourite Formation": body.favouriteFormation ?? "",
        "Tactical Philosophy": body.tacticalPhilosophy ?? "",
        "Most Memorable Moment": body.memorableMoment ?? "",
        "Most Feared Opponent": body.fearedOpponent ?? "",
        "Future Ambitions": body.ambitions ?? "",
        "Story": body.story ?? "",
        "Status": "pending",
        "Image URL": body.imageUrl ?? "",
      };

      await appendRow(sheets, SHEET_ID, TAB_SUBMISSIONS, toRow(rowObj, SUBMISSIONS_HEADERS));
      return asJSON({ ok: true, requestId: reqId });
    }

    if (req.method === "PUT") {
      const { action, submissionId } = await req.json().catch(() => ({}));
      if (!submissionId) return asJSON({ error: "submissionId required" }, 400);

      const subs = await readObjects(sheets, SHEET_ID, TAB_SUBMISSIONS);
      const sub = subs.find((s) => s["Request ID"] === submissionId);
      if (!sub) return asJSON({ error: "submission not found" }, 404);

      if (action === "reject") {
        // (optional) write back Status column if you want to persist it
        return asJSON({ ok: true, action: "rejected" });
      }

      // approve → upsert into Managers
      await ensureHeaders(sheets, SHEET_ID, TAB_MANAGERS, MANAGERS_HEADERS);
      const record = {
  id: slugify(sub["Manager Name"] || ""),
  name: sub["Manager Name"] || "",
  club: sub["Club Name"] || "",
  division: sub["Division"] || "",
  type: (sub["Type"] || "rising").toLowerCase(),
  points: sub["Total Points"] || "0",
  games: sub["Games Played"] || "0",
  signature: sub["Most Memorable Moment"] || sub["Career Highlights"] || "",
  careerHighlights: sub["Career Highlights"] || "",
  favouriteFormation: sub["Favourite Formation"] || "",
  tacticalPhilosophy: sub["Tactical Philosophy"] || "",
  memorableMoment: sub["Most Memorable Moment"] || "",
  fearedOpponent: sub["Most Feared Opponent"] || "",
  ambitions: sub["Future Ambitions"] || "",
  story: sub["Story"] || "",
  avgPoints: "", // optional calc later
};

      await upsertManagerById(sheets, SHEET_ID, record);
      return asJSON({ ok: true, action: "approved", id: record.id });
    }

    if (req.method === "GET") {
      const subs = await readObjects(sheets, SHEET_ID, TAB_SUBMISSIONS);
      subs.sort((a, b) => (b["Timestamp"] || "").localeCompare(a["Timestamp"] || ""));
      return asJSON(subs);
    }

    return asJSON({ error: "Method not allowed" }, 405);
  } catch (err: any) {
    return asJSON({ error: true, message: err?.message ?? String(err) }, 500);
  }
};
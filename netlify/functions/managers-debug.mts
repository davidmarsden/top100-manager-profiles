// netlify/functions/managers-debug.mts
import { google } from "googleapis";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });

export default async () => {
  try {
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT || "";
    if (!SHEET_ID) return json({ error: "Missing GOOGLE_SHEET_ID" }, 500);
    if (!raw) return json({ error: "Missing GOOGLE_SERVICE_ACCOUNT" }, 500);

    const creds = raw.trim().startsWith("{")
      ? JSON.parse(raw)
      : JSON.parse(Buffer.from(raw, "base64").toString("utf8"));

    const auth = new google.auth.JWT(
      creds.client_email,
      undefined,
      creds.private_key,
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );
    const sheets = google.sheets({ version: "v4", auth });

    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Managers!A1:Z",
    });

    const rows = data.values || [];
    return json({
      rowCount: rows.length,
      header: rows[0] || [],
      firstRows: rows.slice(1, 6),
    });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 500);
  }
};
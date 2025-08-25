import { Handler } from "@netlify/functions";
import { google } from "googleapis";

export const handler: Handler = async () => {
  try {
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || "{}");
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!creds.client_email || !creds.private_key || !sheetId) {
      throw new Error("Missing Google Sheets credentials");
    }

    const auth = new google.auth.JWT(
      creds.client_email,
      undefined,
      creds.private_key,
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );

    const sheets = google.sheets({ version: "v4", auth });
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Managers!A2:Z",
    });

    const rows = resp.data.values || [];
    const managers = rows.map((r) => ({
      id: r[0],
      name: r[1],
      club: r[2],
      division: r[3],
      signature: r[4],
      story: r[5],
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(managers),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: true,
        message: err.message,
        stack: err.stack,
      }),
    };
  }
};
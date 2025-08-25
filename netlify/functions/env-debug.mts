export const config = { path: "/api/env-debug" };

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b, null, 2), {
    status: s,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });

export default async () => {
  const keys = [
    "GOOGLE_SHEET_ID",
    "GOOGLE_SERVICE_ACCOUNT",
    "GOOGLE_SHEETS_WEBHOOK_URL",
  ];
  return json({
    ok: true,
    present: Object.fromEntries(keys.map(k => [k, !!process.env[k]])),
  });
};
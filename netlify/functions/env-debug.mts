// netlify/functions/env-debug.mts
export const config = { path: "/api/env-debug" };

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b, null, 2), {
    status: s,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });

export default async () => {
  const vars = [
    "GOOGLE_SHEET_ID",
    "GOOGLE_SERVICE_ACCOUNT",
    "GOOGLE_SHEETS_WEBHOOK_URL",
    "NODE_VERSION",
  ];
  const present = Object.fromEntries(vars.map(k => [k, !!process.env[k]]));
  return json({ ok: true, present });
};
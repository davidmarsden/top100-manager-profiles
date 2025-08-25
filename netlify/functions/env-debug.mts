// netlify/functions/env-debug.mts
export const config = { path: "/api/env-debug" };

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b, null, 2), {
    status: s,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });

export default async () => {
  const id = process.env.GOOGLE_SHEET_ID || "";
  const sa = process.env.GOOGLE_SERVICE_ACCOUNT || "";
  let looksLikeJson = false;
  let clientEmail = "";
  try {
    const raw = sa.trim().startsWith("{") ? sa : Buffer.from(sa, "base64").toString("utf8");
    const obj = JSON.parse(raw);
    looksLikeJson = !!obj?.client_email;
    clientEmail = obj?.client_email || "";
  } catch {}
  return json({
    hasSheetId: Boolean(id),
    sheetIdPreview: id ? id.slice(0, 6) + "..." : "",
    hasServiceAccount: Boolean(sa),
    serviceAccountLooksValid: looksLikeJson,
    serviceAccountEmail: clientEmail, // safe to show to you
  });
};
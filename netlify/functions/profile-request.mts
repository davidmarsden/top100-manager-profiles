// netlify/functions/profile-request.mts
export const config = { path: "/api/profile-request" };

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    },
  });

export default async (req: Request) => {
  if (req.method === "OPTIONS") return json({});
  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    return json({ ok: true, received: body });
  }
  // simple GET handler for quick health checks
  return json({ ok: true, hint: "POST here to submit a profile." });
};
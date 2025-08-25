function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

export default async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 200, headers: cors() });

  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, note: "profile-request GET placeholder" }), {
      headers: { "content-type": "application/json", ...cors() }
    });
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      return new Response(JSON.stringify({ ok: true, received: body }), {
        headers: { "content-type": "application/json", ...cors() }
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
        status: 400,
        headers: { "content-type": "application/json", ...cors() }
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "content-type": "application/json", ...cors() }
  });
};
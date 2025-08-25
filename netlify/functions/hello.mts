export default async () => {
  return new Response(JSON.stringify({ ok: true, message: "hello from functions" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
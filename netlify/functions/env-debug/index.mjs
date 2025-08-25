export default async () => {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => k.startsWith("GOOGLE_"))
  );
  return new Response(JSON.stringify({ ok: true, env }, null, 2), {
    headers: { "content-type": "application/json" }
  });
};
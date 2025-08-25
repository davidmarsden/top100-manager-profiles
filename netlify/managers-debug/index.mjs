export default async () => {
  const info = {
    now: new Date().toISOString(),
    envKeys: Object.keys(process.env).filter(k => k.startsWith("GOOGLE_")),
    cwd: process.cwd()
  };
  return new Response(JSON.stringify(info, null, 2), {
    headers: { "content-type": "application/json" }
  });
};
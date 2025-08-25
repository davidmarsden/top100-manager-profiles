// netlify/functions/managers.mts
export default async (_req, _ctx) => {
  try {
    const demo = [
      {
        id: "demo-manager",
        name: "Demo Manager",
        club: "Demo FC",
        division: "1",
        signature: "Loves a 4-3-3.",
        story: "This is a test record coming from the managers function.",
      },
    ];

    return new Response(JSON.stringify(demo), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: true,
        message: err?.message || String(err) || "unknown",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
      }
    );
  }
};
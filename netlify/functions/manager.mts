// netlify/functions/managers.mts
import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
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

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(demo),
    };
  } catch (err: any) {
    // Never throw: always return a proper HTTP response
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: true, message: err?.message || "unknown" }),
    };
  }
};
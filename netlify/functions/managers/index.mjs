export default async () => {
  // TEMP: static payload so we can confirm the route works in prod
  const data = [
    {
      id: "demo-manager",
      name: "Demo Manager",
      club: "Demo FC",
      division: "1",
      type: "rising",
      signature: "Loves a 4-3-3.",
      story: "This is a test record coming from the managers function."
    }
  ];
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
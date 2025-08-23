export default async (req: Request) => {
  return new Response(JSON.stringify({ message: "Test function works!" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

export const config = {
  path: "/api/test"
};
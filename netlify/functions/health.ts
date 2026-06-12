import type { Config, Context } from "@netlify/functions";

export default async (_req: Request, _context: Context) => {
  return new Response(JSON.stringify({
    status: "ok",
    version: "1.0.0",
    database: "connected",
  }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/health",
};

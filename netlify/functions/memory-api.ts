import type { Config, Context } from "@netlify/functions";
import * as db from "./_shared/db";

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // GET /api/memory
  if (req.method === "GET" && path === "/api/memory") {
    const memories = await db.listMemories();
    return jsonResponse(memories);
  }

  // DELETE /api/memory/:id
  const match = path.match(/^\/api\/memory\/([^/]+)$/);
  if (req.method === "DELETE" && match) {
    const ok = await db.deleteMemory(match[1]);
    if (!ok) return errorResponse("Memory not found", 404);
    return jsonResponse({ message: "Memory deleted" });
  }

  return errorResponse("Not found", 404);
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ detail: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default handleRequest;

export const config: Config = {
  path: ["/api/memory", "/api/memory/:id"],
};

import type { Config, Context } from "@netlify/functions";
import * as db from "./_shared/db";

async function handleRequest(req: Request, context: Context): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // GET /api/chat/conversations
  if (req.method === "GET" && path === "/api/chat/conversations") {
    const convs = await db.listConversations();
    const summaries = await Promise.all(
      convs.map(async (c) => {
        const messages = await db.getMessages(c.id);
        const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
        return {
          id: c.id,
          title: c.title,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          isActive: c.isActive,
          messageCount: messages.length,
          lastMessage: lastMsg ? lastMsg.content.slice(0, 50) : null,
        };
      })
    );
    return jsonResponse(summaries);
  }

  // GET /api/chat/conversations/:id
  const detailMatch = path.match(/^\/api\/chat\/conversations\/([^/]+)$/);
  if (req.method === "GET" && detailMatch) {
    const conv = await db.getConversation(detailMatch[1]);
    if (!conv) return errorResponse("Conversation not found", 404);

    const messages = await db.getMessages(conv.id);
    return jsonResponse({
      conversation: {
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        isActive: conv.isActive,
        messageCount: messages.length,
        lastMessage: messages.length > 0 ? messages[messages.length - 1].content.slice(0, 50) : null,
      },
      messages,
    });
  }

  // DELETE /api/chat/conversations/:id
  if (req.method === "DELETE" && detailMatch) {
    const ok = await db.deleteConversation(detailMatch[1]);
    if (!ok) return errorResponse("Conversation not found", 404);
    return jsonResponse({ message: "Conversation deleted" });
  }

  // PUT /api/chat/conversations/:id/title
  const titleMatch = path.match(/^\/api\/chat\/conversations\/([^/]+)\/title$/);
  if (req.method === "PUT" && titleMatch) {
    const body = await req.json() as { title?: string };
    if (!body.title) return errorResponse("Title is required", 400);
    const updated = await db.updateConversation(titleMatch[1], { title: body.title });
    if (!updated) return errorResponse("Conversation not found", 404);

    const messages = await db.getMessages(updated.id);
    return jsonResponse({
      id: updated.id,
      title: updated.title,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      isActive: updated.isActive,
      messageCount: messages.length,
      lastMessage: null,
    });
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
  path: ["/api/chat/conversations", "/api/chat/conversations/:id", "/api/chat/conversations/:id/title"],
};

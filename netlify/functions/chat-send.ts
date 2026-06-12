import type { Config, Context } from "@netlify/functions";
import { processMessage } from "./_shared/orchestrate";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json() as { conversationId?: string | null; message?: string; useMemory?: boolean };
    const { conversationId = null, message = "", useMemory = true } = body;

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of processMessage(conversationId, message, useMemory)) {
            const data = JSON.stringify(event.data);
            const chunk = `event: ${event.event}\ndata: ${data}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          const errorChunk = `event: error\ndata: ${JSON.stringify({ message: String(err) })}\n\n`;
          controller.enqueue(encoder.encode(errorChunk));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/chat/send",
};

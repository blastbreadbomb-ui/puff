import type { LLMMessage } from "./types";

const API_KEY = Netlify.env.get("DEEPSEEK_API_KEY") || "";
const BASE_URL = "https://api.deepseek.com";
const MODEL = "deepseek-chat";
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TEMPERATURE = 0.7;

function headers(): Record<string, string> {
  return {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function* chatStream(
  messages: LLMMessage[],
  temperature?: number,
  maxTokens?: number,
): AsyncGenerator<string, void, undefined> {
  const payload = {
    model: MODEL,
    messages,
    temperature: temperature ?? DEFAULT_TEMPERATURE,
    max_tokens: maxTokens ?? DEFAULT_MAX_TOKENS,
    stream: true,
  };

  const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;

      try {
        const chunk = JSON.parse(data);
        const content = chunk?.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // Skip malformed chunks
      }
    }
  }
}

export async function chat(
  messages: LLMMessage[],
  temperature?: number,
  maxTokens?: number,
): Promise<string> {
  const payload = {
    model: MODEL,
    messages,
    temperature: temperature ?? DEFAULT_TEMPERATURE,
    max_tokens: maxTokens ?? DEFAULT_MAX_TOKENS,
    stream: false,
  };

  const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as Record<string, unknown>;
  const choices = data.choices as Array<{ message: { content: string } }>;
  return choices?.[0]?.message?.content ?? "";
}

export async function chatJson(
  messages: LLMMessage[],
  temperature: number = 0.3,
): Promise<Record<string, unknown>> {
  const systemMsg = messages[0]?.content ?? "";
  const instruction = systemMsg + "\n\n请严格按照JSON格式回复，不要包含任何其他内容。";
  const modifiedMessages: LLMMessage[] = [
    { role: "system", content: instruction },
    ...messages.slice(1),
  ];

  const content = await chat(modifiedMessages, temperature);

  // Try to parse JSON from response
  let cleaned = content.trim();
  // Remove markdown code blocks
  if (cleaned.startsWith("```")) {
    const lines = cleaned.split("\n");
    cleaned = lines.slice(1, lines[lines.length - 1]?.trim() === "```" ? -1 : undefined).join("\n");
  }

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // Fallback: try to find JSON in response
    const match = cleaned.match(/\{[^}]+\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as Record<string, unknown>;
      } catch {
        // ignore
      }
    }
    return { error: "Failed to parse JSON", raw: content };
  }
}

import * as db from "./db";
import { chatStream, chat } from "./llm";
import { analyze as analyzeEmotion } from "./emotion";
import { assess as assessRisk } from "./risk";
import * as memoryManager from "./memory";
import { SYSTEM_PROMPT } from "./persona";
import type { SSEEvent, LLMMessage } from "./types";

export async function* processMessage(
  conversationId: string | null,
  userMessage: string,
  useMemory: boolean,
): AsyncGenerator<SSEEvent, void, undefined> {
  // ===== Step 0: Create or get conversation =====
  let convId = conversationId;
  if (!convId) {
    const conv = await db.createConversation(
      userMessage.length > 30 ? userMessage.slice(0, 30) : userMessage
    );
    convId = conv.id;
  } else {
    const existing = await db.getConversation(convId);
    if (!existing) {
      const conv = await db.createConversation(
        userMessage.length > 30 ? userMessage.slice(0, 30) : userMessage
      );
      convId = conv.id;
    }
  }

  // ===== Step 1: Risk Detection =====
  const riskResult = await assessRisk(userMessage);

  // Save user message with risk info
  const userMsg = await db.addMessage({
    conversationId: convId,
    role: "user",
    content: userMessage,
    riskLevel: riskResult.level,
  });

  // Yield risk event
  yield {
    event: "risk",
    data: {
      level: riskResult.level,
      action: riskResult.action,
      message: riskResult.message,
    },
  };

  // If high risk, save safety log and send intervention
  if (riskResult.level === "high" && riskResult.action === "intervene") {
    await db.addSafetyLog({
      msgId: userMsg.id,
      riskLevel: "high",
      triggerKeywords: riskResult.triggerKeywords.join(", "),
      actionTaken: "intervene",
    });

    const intervention = riskResult.message || "";
    const assistantMsg = await db.addMessage({
      conversationId: convId,
      role: "assistant",
      content: intervention,
      riskLevel: "high",
    });

    yield {
      event: "chunk",
      data: { content: intervention },
    };
    yield {
      event: "done",
      data: {
        conversationId: convId,
        messageId: assistantMsg.id,
        emotionTag: "警惕",
        riskLevel: "high",
        fullResponse: intervention,
      },
    };
    return;
  }

  // ===== Step 2: Emotion Analysis =====
  const emotionResult = await analyzeEmotion(userMessage);

  // Save emotion record
  const now = new Date();
  await db.addEmotionRecord({
    date: now.toISOString().split("T")[0],
    hour: now.getHours(),
    dominantEmotion: emotionResult.emotion,
    intensity: emotionResult.intensity,
    score: emotionResult.score,
  });

  // Yield emotion event
  yield {
    event: "emotion",
    data: {
      emotion: emotionResult.emotion,
      intensity: emotionResult.intensity,
      score: emotionResult.score,
    },
  };

  // ===== Step 3: Build Messages for LLM =====
  const messages: LLMMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  // Add memory context
  if (useMemory) {
    const memoryContext = await memoryManager.buildContextString();
    if (memoryContext) {
      messages[0].content += memoryContext;
    }
  }

  // Add conversation history (last 20 messages)
  const recentMessages = await db.getMessages(convId, 20);
  for (const msg of recentMessages) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // ===== Step 4: Stream LLM Response =====
  let fullResponse = "";

  try {
    for await (const chunk of chatStream(messages)) {
      fullResponse += chunk;
      yield {
        event: "chunk",
        data: { content: chunk },
      };
    }
  } catch {
    // Fallback response
    fullResponse = "抱歉呢，我这边网络好像有点问题呢...你稍等一下，我马上回来~";
    yield {
      event: "chunk",
      data: { content: fullResponse },
    };
  }

  // ===== Step 5: Save Assistant Message =====
  const assistantMsg = await db.addMessage({
    conversationId: convId,
    role: "assistant",
    content: fullResponse,
    riskLevel: riskResult.level,
  });

  // ===== Step 6: Extract & Update Memories =====
  try {
    await memoryManager.extractMemories(userMessage, fullResponse, userMsg.id);
  } catch {
    // Memory extraction failure shouldn't break chat
  }

  // ===== Step 7: Update Conversation Title =====
  const conv = await db.getConversation(convId);
  if (conv && (conv.title === "新的对话" || (conv.title === userMessage.slice(0, 30) && recentMessages.length <= 3))) {
    try {
      const titleMessages: LLMMessage[] = [
        { role: "system", content: "你是一个助手。请用5-8个字总结用户想聊的话题。只返回总结，不要其他内容。" },
        { role: "user", content: userMessage },
      ];
      let newTitle = await chat(titleMessages, 0.3, 20);
      newTitle = newTitle.trim().replace(/[。，！？]/g, "");
      if (newTitle && newTitle.length <= 20) {
        await db.updateConversation(convId, { title: newTitle });
      }
    } catch {
      // Title generation failure is non-critical
    }
  }

  // ===== Done =====
  yield {
    event: "done",
    data: {
      conversationId: convId,
      messageId: assistantMsg.id,
      emotionTag: emotionResult.emotion,
      riskLevel: riskResult.level,
      fullResponse,
    },
  };
}

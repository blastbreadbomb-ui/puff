import { getStore } from "@netlify/blobs";
import type { Conversation, Message, EmotionRecord, UserMemory, SafetyLog } from "./types";

// Blob store keys for each collection
const STORE_NAME = "ai-sister-db";
const KEY_CONVERSATIONS = "conversations";
const KEY_MESSAGES_PREFIX = "messages/";
const KEY_EMOTION_RECORDS = "emotion_records";
const KEY_MEMORIES = "memories";
const KEY_SAFETY_LOGS = "safety_logs";

function store() {
  return getStore(STORE_NAME);
}

function genId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// ========== Generic Helpers ==========
async function readList<T>(key: string): Promise<T[]> {
  try {
    const raw = await store().get(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeList<T>(key: string, data: T[]): Promise<void> {
  await store().set(key, JSON.stringify(data));
}

// ========== Conversations ==========
export async function createConversation(title: string): Promise<Conversation> {
  const convs = await readList<Conversation>(KEY_CONVERSATIONS);
  const conv: Conversation = {
    id: genId(),
    title,
    createdAt: now(),
    updatedAt: now(),
    isActive: true,
  };
  convs.push(conv);
  await writeList(KEY_CONVERSATIONS, convs);
  return conv;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const convs = await readList<Conversation>(KEY_CONVERSATIONS);
  return convs.find(c => c.id === id) ?? null;
}

export async function listConversations(): Promise<Conversation[]> {
  const convs = await readList<Conversation>(KEY_CONVERSATIONS);
  return convs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | null> {
  const convs = await readList<Conversation>(KEY_CONVERSATIONS);
  const idx = convs.findIndex(c => c.id === id);
  if (idx === -1) return null;
  convs[idx] = { ...convs[idx], ...updates, updatedAt: now() };
  await writeList(KEY_CONVERSATIONS, convs);
  return convs[idx];
}

export async function deleteConversation(id: string): Promise<boolean> {
  const convs = await readList<Conversation>(KEY_CONVERSATIONS);
  const filtered = convs.filter(c => c.id !== id);
  if (filtered.length === convs.length) return false;
  await writeList(KEY_CONVERSATIONS, filtered);
  // Also delete messages
  await store().delete(KEY_MESSAGES_PREFIX + id);
  return true;
}

// ========== Messages ==========
export async function addMessage(msg: Omit<Message, "id" | "createdAt">): Promise<Message> {
  const key = KEY_MESSAGES_PREFIX + msg.conversationId;
  const messages = await readList<Message>(key);
  const full: Message = {
    ...msg,
    id: genId(),
    createdAt: now(),
  };
  messages.push(full);
  await writeList(key, messages);

  // Update conversation timestamp
  await updateConversation(msg.conversationId, { updatedAt: now() });

  return full;
}

export async function getMessages(conversationId: string, limit?: number): Promise<Message[]> {
  const key = KEY_MESSAGES_PREFIX + conversationId;
  const messages = await readList<Message>(key);
  if (limit && messages.length > limit) {
    return messages.slice(-limit);
  }
  return messages;
}

// ========== Emotion Records ==========
export async function addEmotionRecord(record: Omit<EmotionRecord, "id" | "createdAt">): Promise<EmotionRecord> {
  const records = await readList<EmotionRecord>(KEY_EMOTION_RECORDS);
  const full: EmotionRecord = {
    ...record,
    id: genId(),
    createdAt: now(),
  };
  records.push(full);
  await writeList(KEY_EMOTION_RECORDS, records);
  return full;
}

export async function getEmotionRecords(since: string): Promise<EmotionRecord[]> {
  const records = await readList<EmotionRecord>(KEY_EMOTION_RECORDS);
  return records
    .filter(r => r.date >= since)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.hour - b.hour;
    });
}

// ========== Memories ==========
export async function listMemories(): Promise<UserMemory[]> {
  const memories = await readList<UserMemory>(KEY_MEMORIES);
  return memories.sort((a, b) => b.importance - a.importance);
}

export async function addOrUpdateMemory(
  memory: Omit<UserMemory, "id" | "createdAt" | "updatedAt">
): Promise<UserMemory> {
  const memories = await readList<UserMemory>(KEY_MEMORIES);
  const idx = memories.findIndex(m => m.category === memory.category && m.key === memory.key);

  if (idx !== -1) {
    memories[idx] = {
      ...memories[idx],
      value: memory.value,
      importance: Math.max(memories[idx].importance, memory.importance),
      sourceMsgId: memory.sourceMsgId ?? memories[idx].sourceMsgId,
      updatedAt: now(),
    };
    await writeList(KEY_MEMORIES, memories);
    return memories[idx];
  } else {
    const full: UserMemory = {
      ...memory,
      id: genId(),
      createdAt: now(),
      updatedAt: now(),
    };
    memories.push(full);
    await writeList(KEY_MEMORIES, memories);
    return full;
  }
}

export async function deleteMemory(id: string): Promise<boolean> {
  const memories = await readList<UserMemory>(KEY_MEMORIES);
  const filtered = memories.filter(m => m.id !== id);
  if (filtered.length === memories.length) return false;
  await writeList(KEY_MEMORIES, filtered);
  return true;
}

// ========== Safety Logs ==========
export async function addSafetyLog(log: Omit<SafetyLog, "id" | "createdAt">): Promise<SafetyLog> {
  const logs = await readList<SafetyLog>(KEY_SAFETY_LOGS);
  const full: SafetyLog = {
    ...log,
    id: genId(),
    createdAt: now(),
  };
  logs.push(full);
  await writeList(KEY_SAFETY_LOGS, logs);
  return full;
}

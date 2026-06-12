import * as db from "./db";
import type { UserMemory } from "./types";

const CATEGORY_NAME = "name";
const CATEGORY_PREFERENCE = "preference";
const CATEGORY_EXPERIENCE = "experience";
const CATEGORY_SENSITIVE = "sensitive_topic";
const CATEGORY_MILESTONE = "milestone";

export async function getAll(): Promise<UserMemory[]> {
  return db.listMemories();
}

export async function getByCategory(category: string): Promise<UserMemory[]> {
  const all = await db.listMemories();
  return all.filter(m => m.category === category);
}

export async function buildContextString(): Promise<string> {
  const memories = await db.listMemories();
  const top = memories.slice(0, 20);
  if (top.length === 0) return "";

  const lines = ["\n## 关于用户的信息（请自然地在对话中使用，不要刻意提及）："];
  for (const m of top) {
    if (m.category === CATEGORY_NAME) {
      lines.push(`- 用户的名字/称呼：${m.value}`);
    } else if (m.category === CATEGORY_PREFERENCE) {
      lines.push(`- 用户喜欢/偏好：${m.key} — ${m.value}`);
    } else if (m.category === CATEGORY_EXPERIENCE) {
      lines.push(`- 用户的经历：${m.key} — ${m.value}`);
    } else if (m.category === CATEGORY_SENSITIVE) {
      lines.push(`- ⚠️ 敏感话题（避免直接提及，谨慎讨论）：${m.key}`);
    } else if (m.category === CATEGORY_MILESTONE) {
      lines.push(`- 🎯 成长里程碑：${m.key} — ${m.value}`);
    }
  }
  return lines.join("\n");
}

export async function addOrUpdate(
  category: string,
  key: string,
  value: string,
  importance: number = 1,
  sourceMsgId?: string,
): Promise<UserMemory> {
  return db.addOrUpdateMemory({
    category: category as UserMemory["category"],
    key,
    value,
    importance,
    sourceMsgId,
  });
}

export async function remove(id: string): Promise<boolean> {
  return db.deleteMemory(id);
}

export async function extractMemories(
  userMessage: string,
  _assistantResponse: string,
  msgId: string,
): Promise<UserMemory[]> {
  const newMemories: UserMemory[] = [];

  const namePatterns = ["我叫", "我是", "我的名字是", "叫我", "你可以叫我"];
  for (const pattern of namePatterns) {
    if (userMessage.includes(pattern)) {
      const idx = userMessage.indexOf(pattern) + pattern.length;
      let namePart = userMessage.slice(idx, idx + 20).trim();
      for (const delim of ["，", "。", " ", "、", "！", "？", "\n"]) {
        if (namePart.includes(delim)) {
          namePart = namePart.split(delim)[0];
        }
      }
      if (namePart && namePart.length <= 10) {
        const mem = await addOrUpdate(CATEGORY_NAME, "user_name", namePart, 5, msgId);
        newMemories.push(mem);
      }
      break;
    }
  }

  return newMemories;
}

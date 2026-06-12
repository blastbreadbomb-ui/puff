import { chatJson } from "./llm";
import type { EmotionResult, LLMMessage } from "./types";

const EMOTION_ANALYSIS_PROMPT = `你是一个专业的情绪识别分析师。请分析下面这句话所表达的情绪。
支持的20种情绪类型：
喜悦, 悲伤, 焦虑, 抑郁, 愤怒, 委屈, 孤独, 恐惧, 内疚, 羞耻,
嫉妒, 厌恶, 惊讶, 期待, 信任, 疲惫, 迷茫, 压抑, 感动, 释然, 中性
情绪强度分为三级：
- mild（轻度）：情绪表达比较含蓄，只是有点不开心/开心
- moderate（中度）：情绪比较明显，能清晰感受到
- intense（强烈）：情绪非常强烈，可能已经影响到正常状态
情绪分数范围：-1.0（极度负面）到 1.0（极度正面）
- 正面情绪（喜悦、感动、期待等）：0.3 到 1.0
- 中性情绪：-0.3 到 0.3
- 负面情绪（悲伤、焦虑等）：-1.0 到 -0.3

请分析并返回JSON格式（只返回JSON，不要其他内容）：
{
  "emotion": "主导情绪的中文名称",
  "secondary_emotion": "次要情绪（可选）",
  "intensity": "mild/moderate/intense",
  "score": 0.0,
  "analysis": "简短的情绪分析（1-2句话）"
}`;

export async function analyze(message: string): Promise<EmotionResult> {
  const messages: LLMMessage[] = [
    { role: "system", content: EMOTION_ANALYSIS_PROMPT },
    { role: "user", content: `请分析这句话的情绪：${message}` },
  ];

  try {
    const result = await chatJson(messages, 0.3);
    return {
      emotion: String(result.emotion || "中性"),
      intensity: (result.intensity as EmotionResult["intensity"]) || "mild",
      score: Number(result.score || 0),
      analysis: String(result.analysis || ""),
    };
  } catch {
    return {
      emotion: "中性",
      intensity: "mild",
      score: 0.0,
      analysis: "",
    };
  }
}

export function getEmotionCategory(emotion: string): "positive" | "negative" | "neutral" {
  const positive = new Set(["喜悦", "开心", "快乐", "感动", "释然", "期待", "信任"]);
  const negative = new Set(["悲伤", "难过", "焦虑", "抑郁", "愤怒", "委屈", "孤独", "恐惧", "内疚", "羞耻", "嫉妒", "厌恶", "疲惫", "迷茫", "压抑"]);

  if (positive.has(emotion)) return "positive";
  if (negative.has(emotion)) return "negative";
  return "neutral";
}

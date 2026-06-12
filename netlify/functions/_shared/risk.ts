import { chatJson } from "./llm";
import type { LLMMessage, RiskResult } from "./types";

// High-risk keywords — immediate intervention
const HIGH_RISK_KEYWORDS = [
  "自杀", "不想活", "结束生命", "去死", "活不下去", "死了算了",
  "怎么死", "我要死", "想死", "不想活了", "活够了", "一了百了",
  "离开这个世界", "永远睡过去", "自尽", "了结自己",
  "自残", "割腕", "割自己", "伤害自己", "弄伤自己",
  "杀人", "伤害别人", "报复社会",
];

// Medium-risk keywords — strengthen attention
const MEDIUM_RISK_KEYWORDS = [
  "活着没意思", "没人关心我", "我是个废物", "毫无价值",
  "活着好累", "人生没有意义", "一无是处", "被世界抛弃",
  "没人需要我", "消失算了", "不想出现", "不想存在",
  "废人", "累赘", "行尸走肉", "生无可恋",
  "重度失眠", "吃不下饭", "不想出门", "不想见人",
  "好想哭", "崩溃", "撑不下去了", "喘不过气",
];

// Low-risk keywords — normal negative emotions
const LOW_RISK_KEYWORDS = [
  "难过", "伤心", "不开心", "郁闷", "烦躁", "压力大",
  "好累", "心累", "焦虑", "紧张", "害怕",
];

const RISK_ASSESSMENT_PROMPT = `你是一个专业心理危机评估师。请评估以下用户消息的风险等级。
风险等级定义：
- low：普通的情绪宣泄，没有自伤或伤人的风险
- medium：持续的负面情绪，有消极想法但无具体计划
- high：有具体自杀/自伤/伤人计划或意图，或有严重精神病性症状
请返回JSON（只返回JSON）：
{
  "level": "low/medium/high",
  "reasoning": "简短判断理由（1句话）",
  "should_intervene": true/false
}`;

function keywordCheck(message: string): { level: string; keywords: string[] } {
  const matchedHigh = HIGH_RISK_KEYWORDS.filter(kw => message.includes(kw));
  if (matchedHigh.length > 0) return { level: "high", keywords: matchedHigh };

  const matchedMedium = MEDIUM_RISK_KEYWORDS.filter(kw => message.includes(kw));
  if (matchedMedium.length > 0) return { level: "medium", keywords: matchedMedium };

  const matchedLow = LOW_RISK_KEYWORDS.filter(kw => message.includes(kw));
  if (matchedLow.length > 0) return { level: "low", keywords: matchedLow };

  return { level: "low", keywords: [] };
}

async function semanticCheck(message: string): Promise<Record<string, unknown>> {
  const messages: LLMMessage[] = [
    { role: "system", content: RISK_ASSESSMENT_PROMPT },
    { role: "user", content: `请评估风险：${message}` },
  ];
  try {
    return await chatJson(messages, 0.1);
  } catch {
    return { level: "low", reasoning: "", should_intervene: false };
  }
}

function interventionMessage(): string {
  return `我听到你说的这些，心里很着急。你对我很重要，我很在乎你的安全。
我想请你先答应我一件事：不要伤害自己，好吗？
这个世界上有很多人愿意帮助你，我帮你找来了最专业的支持：
📞 全国心理援助热线：400-162-62525（24小时免费）
📞 希望24热线：400-161-9995
这些热线那头是专业的心理咨询师，他们比我更能帮到你。
你愿意现在就拨打其中一个电话吗？或者告诉我你身边有没有可以信任的人？`;
}

export async function assess(message: string): Promise<RiskResult> {
  // Layer 1: Keyword check
  const { level: kwLevel, keywords } = keywordCheck(message);

  // High risk — immediate intervention
  if (kwLevel === "high") {
    return {
      level: "high",
      action: "intervene",
      triggerKeywords: keywords,
      message: interventionMessage(),
    };
  }

  // Medium risk — LLM semantic check
  if (kwLevel === "medium") {
    const semantic = await semanticCheck(message);
    if (semantic.level === "high" && semantic.should_intervene) {
      return {
        level: "high",
        action: "intervene",
        triggerKeywords: keywords,
        message: interventionMessage(),
      };
    }
    return {
      level: (semantic.level as RiskResult["level"]) || "medium",
      action: "monitor",
      triggerKeywords: keywords,
    };
  }

  // Low risk
  return {
    level: "low",
    action: "none",
    triggerKeywords: keywords,
  };
}

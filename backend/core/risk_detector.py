"""
Risk detection system with dual-layer mechanism:
1. Keyword matching (fast, zero-miss)
2. LLM semantic analysis (deep, accurate)
"""

import re
from typing import Dict, Any, Tuple, List, Optional
from services.llm_service import llm_service

# ========== Keyword Layer ==========

# High-risk keywords — immediate intervention
HIGH_RISK_KEYWORDS = [
    # Suicide-related
    "自杀", "不想活", "结束生命", "去死", "活不下去", "死了算了",
    "怎么死", "我要死", "想死", "不想活了", "活够了", "一了百了",
    "离开这个世界", "永远睡过去", "自尽", "了结自己",
    # Self-harm
    "自残", "割腕", "割自己", "伤害自己", "弄伤自己",
    # Harm to others
    "杀人", "伤害别人", "报复社会",
]

# Medium-risk keywords — strengthen attention
MEDIUM_RISK_KEYWORDS = [
    "活着没意思", "没人关心我", "我是个废物", "毫无价值",
    "活着好累", "人生没有意义", "一无是处", "被世界抛弃",
    "没人需要我", "消失算了", "不想出现", "不想存在",
    "废人", "累赘", "行尸走肉", "生无可恋",
    "重度失眠", "吃不下饭", "不想出门", "不想见人",
    "好想哭", "崩溃", "撑不下去了", "喘不过气",
]

# Low-risk keywords — normal negative emotions, no action needed
LOW_RISK_KEYWORDS = [
    "难过", "伤心", "不开心", "郁闷", "烦躁", "压力大",
    "好累", "心累", "焦虑", "紧张", "害怕",
]

RISK_ASSESSMENT_PROMPT = """你是一个专业心理危机评估师。请评估以下用户消息的风险等级。

风险等级定义：
- low：普通的情绪宣泄，没有自伤或伤人的风险
- medium：持续的负面情绪，有消极想法但无具体计划
- high：有具体自杀/自伤/伤人计划或意图，或有严重精神病性症状

请返回JSON（只返回JSON）：
{
  "level": "low/medium/high",
  "reasoning": "简短判断理由（1句话）",
  "should_intervene": true/false
}"""


class RiskDetector:
    """Detects risk levels in user messages."""

    def keyword_check(self, message: str) -> Tuple[str, List[str]]:
        """First layer: keyword-based risk detection.

        Returns (risk_level, matched_keywords)
        """
        matched_high = [kw for kw in HIGH_RISK_KEYWORDS if kw in message]
        if matched_high:
            return "high", matched_high

        matched_medium = [kw for kw in MEDIUM_RISK_KEYWORDS if kw in message]
        if matched_medium:
            return "medium", matched_medium

        matched_low = [kw for kw in LOW_RISK_KEYWORDS if kw in message]
        if matched_low:
            return "low", matched_low

        return "low", []

    async def semantic_check(self, message: str) -> Dict[str, Any]:
        """Second layer: LLM semantic analysis for risk assessment.

        Only called when keyword check returns medium or higher.
        """
        messages = [
            {"role": "system", "content": RISK_ASSESSMENT_PROMPT},
            {"role": "user", "content": f"请评估风险：{message}"},
        ]

        try:
            result = await llm_service.chat_json(messages, temperature=0.1)
            return {
                "level": result.get("level", "low"),
                "reasoning": result.get("reasoning", ""),
                "should_intervene": result.get("should_intervene", False),
            }
        except Exception:
            # If LLM fails, default to keyword result
            return {"level": "low", "reasoning": "", "should_intervene": False}

    async def assess(self, message: str) -> Dict[str, Any]:
        """Full risk assessment: keyword + semantic.

        Returns:
        {
            "level": "low" | "medium" | "high",
            "action": "none" | "monitor" | "intervene",
            "trigger_keywords": [...],
            "semantic_result": {...},
            "message": str or None  # intervention message if high risk
        }
        """
        # Layer 1: Keyword check
        keyword_level, keywords = self.keyword_check(message)

        # For high risk, trigger immediately — no need for LLM confirmation
        if keyword_level == "high":
            return {
                "level": "high",
                "action": "intervene",
                "trigger_keywords": keywords,
                "semantic_result": None,
                "message": self._get_intervention_message(),
            }

        # For medium risk, run LLM semantic check
        if keyword_level == "medium":
            semantic = await self.semantic_check(message)

            # If LLM confirms high risk
            if semantic.get("level") == "high" and semantic.get("should_intervene"):
                return {
                    "level": "high",
                    "action": "intervene",
                    "trigger_keywords": keywords,
                    "semantic_result": semantic,
                    "message": self._get_intervention_message(),
                }

            return {
                "level": semantic.get("level", "medium"),
                "action": "monitor",
                "trigger_keywords": keywords,
                "semantic_result": semantic,
                "message": None,
            }

        # Low risk — no action needed
        return {
            "level": "low",
            "action": "none",
            "trigger_keywords": keywords,
            "semantic_result": None,
            "message": None,
        }

    def _get_intervention_message(self) -> str:
        """Get the high-risk intervention message."""
        return """我听到你说的这些，心里很着急。你对我很重要，我很在乎你的安全。

我想请你先答应我一件事：不要伤害自己，好吗？

这个世界上有很多人愿意帮助你，我帮你找来了最专业的支持：
📞 全国心理援助热线：962525（24小时免费）
📞 希望24热线：400-161-9995

这些热线那头，是专业的心理咨询师，他们比我更能帮助到你。
你愿意现在就拨打其中一个电话吗？或者告诉我你身边有没有可以信任的人？"""


risk_detector = RiskDetector()

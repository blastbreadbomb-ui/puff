import type { Config, Context } from "@netlify/functions";
import * as db from "./_shared/db";

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // GET /api/emotion/trend?days=30
  if (path === "/api/emotion/trend") {
    const days = parseInt(url.searchParams.get("days") || "30", 10);
    const sinceDate = daysAgo(days);
    const records = await db.getEmotionRecords(sinceDate);
    const result = records.map(r => ({
      id: r.id,
      date: r.date,
      hour: r.hour,
      dominantEmotion: r.dominantEmotion,
      intensity: r.intensity,
      score: r.score,
      summary: r.summary,
    }));
    return jsonResponse(result);
  }

  // GET /api/emotion/report?days=7
  if (path === "/api/emotion/report") {
    const days = parseInt(url.searchParams.get("days") || "7", 10);
    const sinceDate = daysAgo(days);
    const endDate = today();
    const records = await db.getEmotionRecords(sinceDate);

    if (records.length === 0) {
      return jsonResponse({
        period: `${days}天`,
        startDate: sinceDate,
        endDate,
        dominantEmotion: "暂无",
        emotionDistribution: {},
        dailyScores: [],
        summary: "还没有足够的情绪数据呢，多和晓语聊聊天吧~",
        suggestion: "每天花10分钟记录自己的情绪，能帮助你更好地觉察自己哦。",
      });
    }

    // Calculate daily scores
    const dailyData: Record<string, { scores: number[]; emotions: string[] }> = {};
    for (const r of records) {
      if (!dailyData[r.date]) dailyData[r.date] = { scores: [], emotions: [] };
      dailyData[r.date].scores.push(r.score);
      dailyData[r.date].emotions.push(r.dominantEmotion);
    }

    const dailyScores = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        const avgScore = data.scores.reduce((s, v) => s + v, 0) / data.scores.length;
        const emotionCounts: Record<string, number> = {};
        for (const e of data.emotions) {
          emotionCounts[e] = (emotionCounts[e] || 0) + 1;
        }
        const dominant = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "未知";
        return { date, score: Math.round(avgScore * 100) / 100, dominantEmotion: dominant };
      });

    // Emotion distribution
    const emotionDist: Record<string, number> = {};
    for (const r of records) {
      emotionDist[r.dominantEmotion] = (emotionDist[r.dominantEmotion] || 0) + 1;
    }

    // Overall dominant
    const dominantEntries = Object.entries(emotionDist).sort(([, a], [, b]) => b - a);
    const dominantEmotion = dominantEntries[0]?.[0] || "未知";

    // Average score
    const allScores = records.map(r => r.score);
    const avgScore = allScores.length > 0
      ? allScores.reduce((s, v) => s + v, 0) / allScores.length
      : 0;

    const { summary, suggestion } = generateInsights(dominantEmotion, avgScore, emotionDist, days);

    return jsonResponse({
      period: `${days}天`,
      startDate: sinceDate,
      endDate,
      dominantEmotion,
      emotionDistribution: emotionDist,
      dailyScores,
      summary,
      suggestion,
      averageScore: Math.round(avgScore * 100) / 100,
      totalRecords: records.length,
    });
  }

  return errorResponse("Not found", 404);
}

function generateInsights(
  dominantEmotion: string,
  avgScore: number,
  _distribution: Record<string, number>,
  days: number,
): { summary: string; suggestion: string } {
  if (avgScore >= 0.3) {
    return {
      summary: `这${days}天你的情绪整体偏积极，以${dominantEmotion}为主。能看到你的状态还不错呢~`,
      suggestion: "继续保持现在的生活节奏，把让你开心的事情记录下来，它们是你应对低谷的秘籍哦。",
    };
  } else if (avgScore >= -0.3) {
    return {
      summary: `这${days}天你的情绪有起有落，以${dominantEmotion}为主。人生本来就是这样呢，有晴有雨~`,
      suggestion: "可以试着每天睡前写下三件感恩的小事，慢慢你会发现生活中其实有很多美好的瞬间。",
    };
  } else {
    return {
      summary: `这${days}天你似乎经历了一些不太容易的日子，${dominantEmotion}的感受比较多。辛苦了呢。`,
      suggestion: "这段时间多给自己一些温柔和空间。如果觉得一个人扛着太累，可以考虑找信任的朋友聊聊，或者找专业的心理咨询师。你值得被好好照顾。",
    };
  }
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
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
  path: ["/api/emotion/trend", "/api/emotion/report"],
};

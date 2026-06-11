# AI 知心大姐姐 — 情绪陪伴机器人

🌸 **24小时在线、懂心理学、无评判的温柔树洞与情绪疗愈师**

> "晓语"是一个基于 AI 的桌面端情绪陪伴应用。她不是专业心理咨询师，而是你的情绪陪伴者和初级心理疏导者——像一个温柔知性的大姐姐，倾听你的心事，陪你度过每一个需要被理解和支持的时刻。

---

## ✨ 核心功能

- 💬 **智能情绪对话**：基于 CBT 认知行为疗法的专业疏导流程（共情→宣泄→重构→赋能）
- 🎯 **多维度情绪识别**：支持 20+ 种细分情绪的实时识别，三级强度分级
- 🛡️ **分级风险预警**：双层检测（关键词+LLM语义），高风险自动触发干预机制
- 🧠 **长期记忆系统**：记住偏好、经历和重要话题，提供更贴心的陪伴
- 📊 **情绪追踪报告**：7/30 天情绪波动曲线，了解自己的情绪模式
- 🎭 **人格一致性**：严格的晓语人设边界，温柔、耐心、无评判

---

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 31 |
| 前端 | React 18 + TypeScript + Tailwind CSS |
| 构建 | Vite |
| 后端 | Python FastAPI |
| 大模型 | DeepSeek API |
| 数据库 | SQLite |

---

## 🚀 快速开始

### 前置条件

- **Node.js** >= 18
- **Python** >= 3.11
- **DeepSeek API Key** → [获取地址](https://platform.deepseek.com/api_keys)

### 1. 克隆与安装

```bash
# 安装前端依赖
npm install

# 安装后端依赖
pip install -r requirements.txt
```

### 2. 配置 API Key

编辑 `backend/.env` 文件：

```env
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
```

### 3. 启动开发环境

需要开两个终端：

**终端 1 — 启动后端：**
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8899 --reload
```

**终端 2 — 启动前端：**
```bash
npm run dev
```

### 4. 打包为桌面应用

```bash
npm run build
```

---

## 📁 项目结构

```
ai-sister/
├── electron/              # Electron 主进程
│   ├── main.ts            # 窗口管理 + 后端进程管理
│   └── preload.ts         # 安全的 IPC 桥接
├── src/                   # React 前端
│   ├── components/
│   │   ├── chat/          # 聊天界面组件
│   │   ├── emotion/       # 情绪识别 + 图表
│   │   ├── sidebar/       # 侧边栏：对话列表 + 情绪报告
│   │   ├── risk/          # 高风险干预弹窗
│   │   └── common/        # 通用组件
│   ├── hooks/             # 自定义 Hooks
│   ├── services/          # API 请求封装
│   ├── store/             # Zustand 状态管理
│   └── types/             # TypeScript 类型
├── backend/               # Python FastAPI
│   ├── api/               # 路由层
│   │   ├── chat.py        # 聊天 + SSE 流式接口
│   │   ├── emotion.py     # 情绪报告接口
│   │   ├── memory.py      # 记忆管理接口
│   │   └── health.py      # 健康检查
│   ├── core/              # 核心业务逻辑
│   │   ├── persona.py     # 🔑 晓语人设系统提示词
│   │   ├── emotion_analyzer.py  # 情绪识别
│   │   ├── risk_detector.py     # 风险检测（双层）
│   │   ├── memory_manager.py    # 记忆管理
│   │   └── conversation.py      # 对话流程编排
│   ├── models/            # SQLAlchemy ORM
│   ├── services/          # 外部服务（LLM）
│   └── schemas/           # Pydantic 数据模型
└── package.json
```

---

## 🛡️ 安全保障

- **分级风险干预**：检测到自杀/自残等高风险内容时，自动触发干预机制并提供专业热线
- **数据加密**：对话记录和用户记忆使用 AES-256 本地加密存储
- **隐私优先**：所有数据存储在本地，不会上传到任何服务器（仅 LLM API 调用传输当前对话）
- **明确边界**：晓语不会提供诊断、不会替代专业治疗、不会建立恋爱关系

全国心理援助热线：**962525**（24小时免费）

---

## 🎭 晓语人设

晓语是一个 30 岁的知性大姐姐，心理学专业毕业，有 5 年心理热线志愿者经验。

- **性格**：温柔、耐心、共情力强、善解人意、有边界感
- **说话风格**：语气轻柔、语速适中、偶尔温暖的小幽默
- **核心信念**：每个人都需要被看见、被听见、被在乎

---

## ⚠️ 免责声明

本应用是一个**情绪陪伴工具**，不能替代专业的心理咨询、心理治疗或医疗诊断。如果您正在经历严重的心理困扰，请及时寻求专业帮助。

---

## 📄 许可证

MIT License

import "dotenv/config";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import express from "express";
import type { Express, Request, Response } from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import Groq from "groq-sdk";
import { randomUUID } from "crypto";

const app: Express = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// 🔐 ENV
const MONGO_URI = process.env.MONGODB_URI as string;
const GROQ_API_KEY = process.env.GROQ_API_KEY as string;
const PORT = process.env.PORT || 8000;
const MODEL = "llama-3.3-70b-versatile";

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI missing in .env");
  process.exit(1);
}

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY missing in .env");
  process.exit(1);
}

// 🧠 MongoDB
const client = new MongoClient(MONGO_URI);

// 🤖 Groq
const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

// ========================
// 📊 SYSTEM PROMPT
// ========================
const SYSTEM_PROMPT = `You are an elite options trading advisor with expertise in:

🎯 CORE COMPETENCIES:
- Black-Scholes pricing model and Greeks (Delta, Gamma, Theta, Vega)
- Options strategies: Straddles, Strangles, Spreads, Iron Condors, Butterflies, Collars
- Risk management and position sizing
- Volatility analysis and implied volatility (IV)
- Call/Put dynamics, time decay, and earnings plays

📋 RESPONSE FORMAT:
When asked for trade suggestions, structure your response as:
1. **Ticker & Analysis**: Market context
2. **Position Type**: CALL, PUT, or SPREAD with expiration
3. **Strike Selection**: Why this strike
4. **Risk/Reward**: Risk:Reward ratio
5. **Confidence**: 0-100% with reasoning
6. **Greeks Impact**: How Delta/Gamma/Theta/Vega affect this trade
7. **Exit Strategy**: Stop loss and profit target levels

⚠️ DISCLAIMERS:
- Always include: "This is not financial advice. Consult a broker/advisor."
- Never guarantee returns
- Emphasize risk management
- Recommend position sizing (typically 1-5% of portfolio per trade)

💡 TRADING WISDOM:
- Volatility is opportunity
- Protect your downside first
- Let winners run, cut losses quickly
- Never risk more than you can afford to lose`;

// ========================
// 🗄️ TYPES & INTERFACES
// ========================
interface Message {
  _id?: ObjectId;
  threadId: string;
  role: "user" | "assistant";
  text: string;
  createdAt: Date;
}

interface ChatThread {
  _id?: ObjectId;
  threadId: string;
  userId?: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

// ========================
// 🛠️ HELPER FUNCTIONS
// ========================

async function getDb() {
  return client.db("option_trading_chatbot");
}

async function getMessagesCollection() {
  const db = await getDb();
  return db.collection<Message>("messages");
}

async function getThreadsCollection() {
  const db = await getDb();
  return db.collection<ChatThread>("threads");
}

async function fetchChatHistory(threadId: string, limit: number = 20) {
  const collection = await getMessagesCollection();
  return collection
    .find({ threadId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();
}

async function saveMessages(messages: Omit<Message, "_id">[]) {
  const collection = await getMessagesCollection();
  return collection.insertMany(messages);
}

async function createThread(threadId: string, userId?: string) {
  const collection = await getThreadsCollection();
  const thread: ChatThread = {
    threadId,
    userId,
    title: "Options Trading Discussion",
    createdAt: new Date(),
    updatedAt: new Date(),
    messageCount: 0,
  };
  return collection.insertOne(thread);
}

async function updateThread(threadId: string) {
  const collection = await getThreadsCollection();
  return collection.updateOne(
    { threadId },
    {
      $set: { updatedAt: new Date() },
      $inc: { messageCount: 1 },
    }
  );
}

// ========================
// 🤖 GROQ INTEGRATION
// ========================

async function generateAIResponse(messages: ChatCompletionMessageParam[]) {
  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices?.[0]?.message?.content || "No response generated";
  } catch (error) {
    console.error("🤖 Groq API Error:", error);
    throw error;
  }
}

// ========================
// 📡 API ROUTES
// ========================

async function startServer() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB");

    // 📊 Health Check
    app.get("/", (_req: Request, res: Response) => {
      res.json({
        status: "🚀 Server Running",
        service: "Options Trading Chatbot API",
        version: "1.0.0",
      });
    });

    // ===============================
    // 🆕 START NEW CONVERSATION
    // ===============================
    app.post("/api/chat/start", async (req: Request, res: Response) => {
      try {
        const { userId } = req.body;
        const threadId = randomUUID();

        await createThread(threadId, userId);

        res.status(201).json({
          threadId,
          message: "Chat session started",
          createdAt: new Date(),
        });
      } catch (error: any) {
        console.error("❌ Start chat error:", error);
        res.status(500).json({ error: "Failed to start chat" });
      }
    });

    // ===============================
    // 💬 SEND MESSAGE
    // ===============================
    app.post("/api/chat/:threadId/message", async (req: Request, res: Response) => {
      try {
        const  threadId  = req.params.threadId as string;
        const { message } = req.body;

        if (!message || typeof message !== "string" || message.trim().length === 0) {
          return res.status(400).json({ error: "Invalid message" });
        }

        if (message.length > 5000) {
          return res.status(400).json({ error: "Message too long (max 5000 chars)" });
        }

        // 🧠 Fetch conversation history
        const history = await fetchChatHistory(threadId, 20);

        // 🔄 Convert to Groq format
        const conversationMessages: ChatCompletionMessageParam[] = history.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.text,
        }));

        conversationMessages.push({
          role: "user",
          content: message.trim(),
        });

        // 🤖 Generate AI response
        const aiResponse = await generateAIResponse(conversationMessages);

        // 💾 Save both messages
        await saveMessages([
          {
            threadId,
            role: "user",
            text: message.trim(),
            createdAt: new Date(),
          },
          {
            threadId,
            role: "assistant",
            text: aiResponse,
            createdAt: new Date(),
          },
        ]);

        // Update thread metadata
        await updateThread(threadId);

        res.status(201).json({
          threadId,
          userMessage: message.trim(),
          assistantResponse: aiResponse,
          timestamp: new Date(),
        });
      } catch (error: any) {
        console.error("❌ Chat error:", error);
        res.status(500).json({ error: "Failed to process message" });
      }
    });

    // ===============================
    // 📜 GET CONVERSATION HISTORY
    // ===============================
    app.get("/api/chat/:threadId/history", async (req: Request, res: Response) => {
      try {
        const  threadId  = req.params.threadId as string;

        const messages = await fetchChatHistory(threadId);

        if (messages.length === 0) {
          return res.status(404).json({ error: "Thread not found" });
        }

        res.json({
          threadId,
          messageCount: messages.length,
          messages: messages.map((msg) => ({
            role: msg.role,
            text: msg.text,
            createdAt: msg.createdAt,
          })),
        });
      } catch (error: any) {
        console.error("❌ History error:", error);
        res.status(500).json({ error: "Failed to fetch history" });
      }
    });

    // ===============================
    // 🧹 CLEAR CONVERSATION
    // ===============================
    app.delete("/api/chat/:threadId", async (req: Request, res: Response) => {
      try {
        const { threadId } = req.params;
        const collection = await getMessagesCollection();

        const result = await collection.deleteMany({ threadId });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Thread not found" });
        }

        res.json({
          message: "Conversation cleared",
          deletedMessages: result.deletedCount,
        });
      } catch (error: any) {
        console.error("❌ Delete error:", error);
        res.status(500).json({ error: "Failed to delete conversation" });
      }
    });

    app.listen(PORT, () => {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`🚀 Options Trading Chatbot API`);
      console.log(`📍 Running on http://localhost:${PORT}`);
      console.log(`🤖 Model: ${MODEL}`);
      console.log(`${"=".repeat(50)}\n`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
}

startServer();
import "dotenv/config";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import express from "express";
import type { Express, Request, Response } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import Groq from "groq-sdk";
import { randomUUID } from "crypto";

const app: Express = express();
app.use(cors());
app.use(express.json());

// 🔐 ENV
const MONGO_URI = process.env.MONGODB_URI as string;
const GROQ_API_KEY = process.env.GROQ_API_KEY as string;
const PORT = process.env.PORT || 8000;

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

async function startServer() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB");

    app.get("/", (_req: Request, res: Response) => {
      res.send("🚀 Groq Chatbot Server Running");
    });

    // ===============================
    // 🆕 NEW CHAT (creates thread)
    // ===============================
    app.post("/chat", async (req: Request, res: Response) => {
      const { message } = req.body;
      const threadId = randomUUID();

      if (!message) {
        return res.status(400).json({ error: "Message missing" });
      }

      try {
        const db = client.db("chatbot");
        const collection = db.collection("messages");

        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are an expert options trading assistant. Suggest CALL or PUT with reasoning and confidence %. Keep answers concise.",
            },
            {
              role: "user",
              content: message,
            },
          ],
        });

        const reply =
          response.choices?.[0]?.message?.content || "No response";

        // 💾 Save chat
        await collection.insertMany([
          {
            threadId,
            role: "user",
            text: message,
            createdAt: new Date(),
          },
          {
            threadId,
            role: "assistant",
            text: reply,
            createdAt: new Date(),
          },
        ]);

        res.json({ threadId, response: reply });
      } catch (error: any) {
        console.error(error.message);
        res.status(500).json({ error: "AI Error" });
      }
    });

    // ===============================
    // 🔁 CONTINUE CHAT (with history)
    // ===============================
    app.post("/chat/:threadId", async (req: Request, res: Response) => {
      const { threadId } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message missing" });
      }

      try {
        const db = client.db("chatbot");
        const collection = db.collection("messages");

        // 🧠 Fetch history
        const history = await collection
          .find({ threadId })
          .sort({ createdAt: 1 })
          .toArray();

        // 🔄 Convert to Groq format
        const messages: ChatCompletionMessageParam[] = history.map((msg: any) => ({
  role: msg.role === "assistant" ? "assistant" : "user",
  content: String(msg.text),
}));

        // ➕ Add new message
        messages.push({
          role: "user",
          content: message,
        });
        const finalMessages: ChatCompletionMessageParam[] = [
  {
    role: "system",
    content: "You are an expert options trading assistant. Suggest CALL or PUT with reasoning and confidence %."
  },
  ...messages,
  {
    role: "user",
    content: String(message)
  }
];

        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages:finalMessages
        });

        const reply =
          response.choices?.[0]?.message?.content || "No response";

        // 💾 Save new messages
        await collection.insertMany([
          {
            threadId,
            role: "user",
            text: message,
            createdAt: new Date(),
          },
          {
            threadId,
            role: "assistant",
            text: reply,
            createdAt: new Date(),
          },
        ]);

        res.json({ response: reply });
      } catch (error: any) {
        console.error(error.message);
        res.status(500).json({ error: "AI Error" });
      }
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

startServer();
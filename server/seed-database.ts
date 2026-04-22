/**
 * 🌱 Seed Database - Initialize Test Data
 * Run: npm run seed
 */

import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGODB_URI as string;

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI missing in .env");
  process.exit(1);
}

async function seedDatabase() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("option_trading_chatbot");

    // 🧹 Clear existing data (optional)
    console.log("🧹 Clearing existing collections...");
    // await db.collection("messages").deleteMany({});
    // await db.collection("threads").deleteMany({});

    // 📚 Create indexes
    console.log("📚 Creating indexes...");

    // Messages indexes
    await db.collection("messages").createIndex({ threadId: 1, createdAt: -1 });
    await db.collection("messages").createIndex({ role: 1 });

    // Threads indexes
    await db.collection("threads").createIndex({ threadId: 1 }, { unique: true });
    await db.collection("threads").createIndex({ userId: 1 });
    await db.collection("threads").createIndex({ createdAt: -1 });

    // 🌿 Sample thread
    const sampleThreadId = "sample-thread-001";

    const sampleMessages = [
      {
        threadId: sampleThreadId,
        role: "assistant",
        text: "👋 Welcome to the Options Trading Chatbot! I can help you with:\n\n📚 Options strategies (Straddles, Spreads, Iron Condors)\n📊 Greeks analysis (Delta, Gamma, Theta, Vega)\n🎯 Trade recommendations\n⚠️ Risk management tips\n\nWhat would you like to know about options trading?",
        createdAt: new Date("2026-04-22T10:00:00Z"),
      },
      {
        threadId: sampleThreadId,
        role: "user",
        text: "What's a Bull Call Spread and when should I use it?",
        createdAt: new Date("2026-04-22T10:01:00Z"),
      },
      {
        threadId: sampleThreadId,
        role: "assistant",
        text: `**Bull Call Spread** is a 2-leg options strategy:

**Structure:**
- BUY 1 ATM Call (Lower Strike)
- SELL 1 OTM Call (Higher Strike)

**When to Use:**
✅ Moderately bullish outlook
✅ Want to reduce cost (premium received)
✅ Limited profit potential OK
✅ High probability of small profit

**Example (AAPL at $175):**
1. BUY 1 $175 Call @ $5.00
2. SELL 1 $180 Call @ $2.50
Net Cost: $2.50 per contract
Max Profit: $2.50 (at $180+)
Max Loss: $2.50

**Greeks:**
- Delta: +0.50 (moderate bullish)
- Theta: Positive (time decay helps)
- Vega: Neutral (long/short IV cancel)

**Best For:** Earnings plays, earnings IV crush expected

Disclaimer: Not financial advice. Consult your broker.`,
        createdAt: new Date("2026-04-22T10:02:00Z"),
      },
    ];

    await db.collection("messages").insertMany(sampleMessages);
    console.log("✅ Inserted sample messages");

    // Thread metadata
    const sampleThread = {
      threadId: sampleThreadId,
      userId: "demo-user",
      title: "Bull Call Spread Discussion",
      createdAt: new Date("2026-04-22T10:00:00Z"),
      updatedAt: new Date("2026-04-22T10:02:00Z"),
      messageCount: 3,
    };

    await db.collection("threads").insertOne(sampleThread);
    console.log("✅ Inserted sample thread");

    // 📊 Collection Statistics
    const messageCount = await db.collection("messages").countDocuments();
    const threadCount = await db.collection("threads").countDocuments();

    console.log("\n📊 Database Statistics:");
    console.log(`   Messages: ${messageCount}`);
    console.log(`   Threads: ${threadCount}`);

    console.log("\n✅ Database seeded successfully!");
    console.log(`\n🧪 Test it out:`);
    console.log(
      `   curl http://localhost:8000/api/chat/${sampleThreadId}/history`
    );
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n👋 Connection closed");
  }
}

seedDatabase();

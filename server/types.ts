/**
 * 📊 Options Trading Chatbot Types
 */

// ========================
// CHAT & CONVERSATION
// ========================
export interface ChatMessage {
  _id?: string;
  threadId: string;
  role: "user" | "assistant";
  text: string;
  createdAt: Date;
}

export interface ChatThread {
  _id?: string;
  threadId: string;
  userId?: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

// ========================
// MARKET DATA
// ========================
export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

export interface OptionChainData {
  ticker: string;
  expiration: string;
  calls: OptionContract[];
  puts: OptionContract[];
}

export interface OptionContract {
  strike: number;
  bid: number;
  ask: number;
  lastPrice: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  expirationDate: string;
}

export interface GreekMetrics {
  delta: number; // Price sensitivity
  gamma: number; // Delta acceleration
  theta: number; // Time decay
  vega: number; // IV sensitivity
  rho: number; // Interest rate sensitivity
}

// ========================
// TRADING ANALYSIS
// ========================
export interface TradeRecommendation {
  ticker: string;
  type: "CALL" | "PUT" | "SPREAD";
  strategy: string;
  strike: number;
  expiration: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskRewardRatio: number;
  confidence: number; // 0-100
  greeks: GreekMetrics;
  reasoning: string;
  disclaimer: string;
}

export interface PortfolioPosition {
  _id?: string;
  userId: string;
  ticker: string;
  type: "CALL" | "PUT" | "STOCK";
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  strike?: number;
  expirationDate?: Date;
  pnl: number;
  pnlPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// API RESPONSES
// ========================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface ChatResponse {
  threadId: string;
  userMessage: string;
  assistantResponse: string;
  timestamp: Date;
}

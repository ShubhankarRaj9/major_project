/**
 * 📊 Market Data Integration Utilities
 * Phase 2: Real-time market data fetching
 */

import type { StockQuote, OptionChainData, OptionContract } from "./types.ts";

// ========================
// MARKET DATA API KEYS
// ========================
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "";
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "";
const POLYGON_API_KEY = process.env.POLYGON_API_KEY || "";

// ========================
// STOCK QUOTES (Finnhub)
// ========================
export async function getStockQuote(ticker: string): Promise<StockQuote | null> {
  if (!FINNHUB_API_KEY) {
    console.warn("⚠️ FINNHUB_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    const data = await response.json();

    return {
      ticker,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`❌ Failed to fetch quote for ${ticker}:`, error);
    return null;
  }
}

// ========================
// OPTIONS CHAIN (Polygon)
// ========================
export async function getOptionsChain(
  ticker: string,
  expiration: string
): Promise<OptionChainData | null> {
  if (!POLYGON_API_KEY) {
    console.warn("⚠️ POLYGON_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.polygon.io/v3/snapshot/options/${ticker}?order=asc&limit=100&apiKey=${POLYGON_API_KEY}`
    );
    const data = await response.json();

    return {
      ticker,
      expiration,
      calls: [],
      puts: [],
    };
  } catch (error) {
    console.error(`❌ Failed to fetch options chain for ${ticker}:`, error);
    return null;
  }
}

// ========================
// GREEKS CALCULATION
// ========================

/**
 * Black-Scholes Model for Greeks Calculation
 */
export function calculateGreeks(
  stockPrice: number,
  strikePrice: number,
  timeToExpiration: number, // in years
  riskFreeRate: number,
  volatility: number, // implied volatility
  isCall: boolean
) {
  const d1 =
    (Math.log(stockPrice / strikePrice) +
      (riskFreeRate + (volatility * volatility) / 2) * timeToExpiration) /
    (volatility * Math.sqrt(timeToExpiration));

  const d2 = d1 - volatility * Math.sqrt(timeToExpiration);

  const delta = isCall ? normCDF(d1) : normCDF(d1) - 1;
  const gamma = normPDF(d1) / (stockPrice * volatility * Math.sqrt(timeToExpiration));
  const theta =
    (-stockPrice * normPDF(d1) * volatility) / (2 * Math.sqrt(timeToExpiration)) -
    riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiration) * normCDF(d2);
  const vega = stockPrice * normPDF(d1) * Math.sqrt(timeToExpiration) / 100;

  return {
    delta: parseFloat(delta.toFixed(4)),
    gamma: parseFloat(gamma.toFixed(4)),
    theta: parseFloat(theta.toFixed(4)),
    vega: parseFloat(vega.toFixed(4)),
    rho: 0, // Simplified
  };
}

// ========================
// HELPER FUNCTIONS
// ========================

function normCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-0.5 * x * x);
  const prob =
    d *
    t *
    (0.319381530 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));

  return x >= 0 ? 1 - prob : prob;
}

function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// ========================
// VOLATILITY ANALYSIS
// ========================
export function analyzeVolatility(prices: number[]): {
  historical: number;
  standardDeviation: number;
} {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }

  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const historicalVol = stdDev * Math.sqrt(252); // Annualized

  return {
    historical: historicalVol,
    standardDeviation: stdDev,
  };
}

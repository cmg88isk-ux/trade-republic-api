import { NextResponse } from 'next/server';
import { getMarketSnapshot } from '@/lib/binance-service';
import { 
  TR_GOLD_INSTRUMENTS, 
  TR_SILVER_INSTRUMENTS,
  TROY_OUNCE_GRAMS,
  GOLD_SILVER_RATIO,
} from '@/lib/config/instruments';
import { calculateInstrumentSpread } from '@/lib/engine/arbitrage-engine';
import { processSpreadBatch, getActiveSignals } from '@/lib/engine/signal-engine';
import type { SpreadResult, NormalizedPrice } from '@/lib/types/arbitrage';

// Mock TR prices for demonstration
// In production, these would come from a Trade Republic API or WebSocket
const MOCK_TR_PRICES: Record<string, { price: number; bid?: number; ask?: number }> = {
  // Gold instruments
  'DE000A0S9GB0': { price: 71.50, bid: 71.45, ask: 71.55 },
  'DE000EWG0LD1': { price: 71.48, bid: 71.43, ask: 71.53 },
  'IE00B4ND3602': { price: 77.25, bid: 77.20, ask: 77.30 },
  'GB00B00FHZ82': { price: 225.80, bid: 225.70, ask: 225.90 },
  'JE00B1VS3770': { price: 242.15, bid: 242.05, ask: 242.25 },
  'CH0104136285': { price: 72.10, bid: 72.05, ask: 72.15 },
  // Silver instruments
  'DE000A0N62F2': { price: 29.80, bid: 29.75, ask: 29.85 },
  'IE00B4NCWG09': { price: 32.45, bid: 32.40, ask: 32.50 },
  'GB00B00FHT20': { price: 32.20, bid: 32.15, ask: 32.25 },
  'JE00B1VS3333': { price: 32.35, bid: 32.30, ask: 32.40 },
  'CH0183136024': { price: 2850.00, bid: 2845.00, ask: 2855.00 },
};

export async function GET() {
  try {
    // Fetch Binance prices
    const snapshot = await getMarketSnapshot();
    
    const paxgPrice = snapshot.xauUsd.price || 2650;
    const eurUsd = snapshot.eurUsd.price || 1.08;
    const silverPriceUsd = paxgPrice / GOLD_SILVER_RATIO.default;
    
    // Create normalized price objects
    const goldPrice: NormalizedPrice = {
      source: 'BINANCE',
      assetType: 'GOLD',
      symbol: 'PAXGUSDT',
      displayName: 'PAX Gold',
      price: paxgPrice,
      currency: 'USD',
      timestamp: new Date().toISOString(),
      exchange: 'Binance',
      instrumentType: 'TOKEN',
      referenceUnit: 'OZ',
      marketState: 'OPEN',
      isStale: false,
    };
    
    const silverPrice: NormalizedPrice = {
      source: 'BINANCE',
      assetType: 'SILVER',
      symbol: 'XAG_PROXY',
      displayName: 'Silver (Proxy)',
      price: silverPriceUsd,
      currency: 'USD',
      timestamp: new Date().toISOString(),
      exchange: 'Binance',
      instrumentType: 'SPOT',
      referenceUnit: 'OZ',
      marketState: 'OPEN',
      isStale: false,
    };
    
    // Calculate gold spreads
    const goldSpreads: SpreadResult[] = [];
    for (const instrument of TR_GOLD_INSTRUMENTS) {
      const trData = MOCK_TR_PRICES[instrument.isin];
      if (trData) {
        const spread = calculateInstrumentSpread(
          instrument,
          trData.price,
          trData.bid,
          trData.ask,
          paxgPrice,
          eurUsd
        );
        goldSpreads.push(spread);
      }
    }
    
    // Calculate silver spreads
    const silverSpreads: SpreadResult[] = [];
    for (const instrument of TR_SILVER_INSTRUMENTS) {
      const trData = MOCK_TR_PRICES[instrument.isin];
      if (trData) {
        const pricePerGram = silverPriceUsd / TROY_OUNCE_GRAMS;
        let normalizedPrice = pricePerGram * (instrument.gramPerUnit || 1);
        if (instrument.currency === 'EUR') {
          normalizedPrice = normalizedPrice / eurUsd;
        }
        
        const spread: SpreadResult = {
          id: `${instrument.isin}-${Date.now()}`,
          assetType: 'SILVER',
          trInstrument: instrument,
          binanceSymbol: 'SILVER_PROXY',
          trPrice: trData.price,
          trBid: trData.bid,
          trAsk: trData.ask,
          binancePrice: normalizedPrice,
          spreadAbs: trData.price - normalizedPrice,
          spreadPct: ((trData.price - normalizedPrice) / normalizedPrice) * 100,
          spreadBps: ((trData.price - normalizedPrice) / normalizedPrice) * 10000,
          zScore: 0,
          historicalMean: 0,
          historicalStdDev: 0.5,
          confidence: 'MEDIUM',
          currency: instrument.currency,
          fxRate: eurUsd,
          timestamp: new Date().toISOString(),
          marketHoursComparable: true,
          trMarketState: 'OPEN',
          binanceMarketState: 'OPEN',
          isStale: false,
        };
        silverSpreads.push(spread);
      }
    }
    
    // Process signals
    const allSpreads = [...goldSpreads, ...silverSpreads];
    processSpreadBatch(allSpreads);
    const signals = getActiveSignals();
    
    return NextResponse.json({
      success: true,
      goldPrice,
      silverPrice,
      eurUsdRate: eurUsd,
      goldSpreads,
      silverSpreads,
      signals,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching arbitrage data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch arbitrage data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

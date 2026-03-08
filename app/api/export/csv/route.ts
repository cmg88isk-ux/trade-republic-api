import { NextRequest, NextResponse } from 'next/server';
import { getMarketSnapshot } from '@/lib/binance-service';
import { 
  TR_GOLD_INSTRUMENTS, 
  TR_SILVER_INSTRUMENTS,
  TROY_OUNCE_GRAMS,
  GOLD_SILVER_RATIO,
} from '@/lib/config/instruments';
import { calculateInstrumentSpread } from '@/lib/engine/arbitrage-engine';
import { getActiveSignals } from '@/lib/engine/signal-engine';
import type { SpreadResult } from '@/lib/types/arbitrage';

// Mock TR prices
const MOCK_TR_PRICES: Record<string, { price: number; bid?: number; ask?: number }> = {
  'DE000A0S9GB0': { price: 71.50, bid: 71.45, ask: 71.55 },
  'DE000EWG0LD1': { price: 71.48, bid: 71.43, ask: 71.53 },
  'IE00B4ND3602': { price: 77.25, bid: 77.20, ask: 77.30 },
  'GB00B00FHZ82': { price: 225.80, bid: 225.70, ask: 225.90 },
  'JE00B1VS3770': { price: 242.15, bid: 242.05, ask: 242.25 },
  'CH0104136285': { price: 72.10, bid: 72.05, ask: 72.15 },
  'DE000A0N62F2': { price: 29.80, bid: 29.75, ask: 29.85 },
  'IE00B4NCWG09': { price: 32.45, bid: 32.40, ask: 32.50 },
  'GB00B00FHT20': { price: 32.20, bid: 32.15, ask: 32.25 },
  'JE00B1VS3333': { price: 32.35, bid: 32.30, ask: 32.40 },
  'CH0183136024': { price: 2850.00, bid: 2845.00, ask: 2855.00 },
};

function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function spreadsToCSV(spreads: SpreadResult[]): string {
  const headers = [
    'ISIN',
    'Name',
    'Asset Type',
    'TR Price',
    'TR Bid',
    'TR Ask',
    'Binance Price',
    'Spread %',
    'Spread BPS',
    'Z-Score',
    'Confidence',
    'Currency',
    'FX Rate',
    'Market Comparable',
    'Timestamp',
  ];
  
  const rows = spreads.map(s => [
    s.trInstrument.isin,
    s.trInstrument.name,
    s.assetType,
    s.trPrice.toFixed(4),
    s.trBid?.toFixed(4) || '',
    s.trAsk?.toFixed(4) || '',
    s.binancePrice.toFixed(4),
    s.spreadPct.toFixed(4),
    s.spreadBps.toFixed(2),
    s.zScore.toFixed(4),
    s.confidence,
    s.currency,
    s.fxRate?.toFixed(6) || '',
    s.marketHoursComparable ? 'Yes' : 'No',
    s.timestamp,
  ].map(escapeCSV).join(','));
  
  return [headers.join(','), ...rows].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataType = searchParams.get('type') || 'spreads'; // spreads, signals, all
    const assetType = searchParams.get('assetType'); // GOLD, SILVER, or null for both
    
    // Fetch current data
    const snapshot = await getMarketSnapshot();
    const paxgPrice = snapshot.xauUsd.price || 2650;
    const eurUsd = snapshot.eurUsd.price || 1.08;
    const silverPriceUsd = paxgPrice / GOLD_SILVER_RATIO.default;
    
    // Calculate spreads
    const goldSpreads: SpreadResult[] = [];
    const silverSpreads: SpreadResult[] = [];
    
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
    
    // Filter by asset type if specified
    let spreads: SpreadResult[];
    if (assetType === 'GOLD') {
      spreads = goldSpreads;
    } else if (assetType === 'SILVER') {
      spreads = silverSpreads;
    } else {
      spreads = [...goldSpreads, ...silverSpreads];
    }
    
    // Generate CSV
    let csv = '';
    const filename = `goldarb_${dataType}_${new Date().toISOString().split('T')[0]}.csv`;
    
    if (dataType === 'spreads' || dataType === 'all') {
      csv = spreadsToCSV(spreads);
    } else if (dataType === 'signals') {
      const signals = getActiveSignals();
      const headers = [
        'Signal ID',
        'Asset Type',
        'Instrument',
        'Signal Type',
        'Spread %',
        'Z-Score',
        'Confidence',
        'Priority',
        'Status',
        'Rationale',
        'Timestamp',
      ];
      const rows = signals.map(s => [
        s.id,
        s.assetType,
        s.instrumentName,
        s.signalType,
        s.spreadPct.toFixed(4),
        s.zScore.toFixed(4),
        s.confidence,
        s.priority,
        s.status,
        s.rationale,
        s.timestamp,
      ].map(escapeCSV).join(','));
      csv = [headers.join(','), ...rows].join('\n');
    }
    
    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}

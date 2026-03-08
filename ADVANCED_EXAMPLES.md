# Advanced Examples - Sessions, ETF Data, Python Integration

This document contains advanced usage patterns and integration examples.

## 1. Advanced Session Management

### Custom Session Loader with Automatic Renewal

```typescript
// lib/advanced-session.ts
import { sessionManager, TradeRepublicSession } from '@/lib/session-manager';

export class AdvancedSessionManager {
  /**
   * Get session with automatic renewal
   * Renews token before expiration
   */
  static async getSessionWithRenewal(
    phone: string,
    renewalThresholdMs: number = 24 * 60 * 60 * 1000 // 1 day
  ): Promise<TradeRepublicSession | null> {
    const session = sessionManager.loadSession(phone);
    
    if (!session) {
      return null;
    }

    // Check if token needs renewal (expires soon)
    const timeUntilExpiry = session.expiresAt - Date.now();
    
    if (timeUntilExpiry < renewalThresholdMs) {
      console.log('[SessionManager] Token expiring soon, requesting renewal...');
      // Trigger renewal API call
      try {
        await fetch('/api/auth/session/refresh', {
          method: 'POST',
          body: JSON.stringify({ phone, sessionId: session.sessionId })
        });
      } catch (error) {
        console.error('[SessionManager] Renewal failed:', error);
      }
    }

    return session;
  }

  /**
   * Multi-device session management
   * Track multiple sessions for same phone on different devices
   */
  static createDeviceSession(
    phone: string,
    deviceId: string,
    userAgent: string
  ): TradeRepublicSession {
    return sessionManager.createSession(phone, `session_${Date.now()}`, {
      metadata: {
        deviceId,
        userAgent,
      }
    });
  }

  /**
   * Revoke all sessions for phone (e.g., on logout)
   */
  static revokeAllSessions(phone: string): void {
    sessionManager.deleteSession(phone);
    // Also clear on backend via API
    fetch(`/api/auth/session?phone=${phone}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get session activity log
   */
  static getSessionActivity(phone: string): {
    createdAt: Date;
    lastUsed: Date;
    ageInDays: number;
    status: 'active' | 'expired' | 'expiring_soon';
  } | null {
    const session = sessionManager.loadSession(phone);
    if (!session) return null;

    const now = Date.now();
    const ageInDays = (now - session.createdAt) / (24 * 60 * 60 * 1000);
    const timeToExpiry = session.expiresAt - now;

    let status: 'active' | 'expired' | 'expiring_soon' = 'active';
    if (timeToExpiry < 0) {
      status = 'expired';
    } else if (timeToExpiry < 24 * 60 * 60 * 1000) {
      status = 'expiring_soon';
    }

    return {
      createdAt: new Date(session.createdAt),
      lastUsed: new Date(session.lastUsed),
      ageInDays,
      status,
    };
  }
}
```

### React Hook for Session Management

```typescript
// hooks/use-session.ts
import { useEffect, useState, useCallback } from 'react';
import { AdvancedSessionManager } from '@/lib/advanced-session';
import type { TradeRepublicSession } from '@/lib/session-manager';

export function useSession(phone: string) {
  const [session, setSession] = useState<TradeRepublicSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      const sess = await AdvancedSessionManager.getSessionWithRenewal(phone);
      setSession(sess);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const logout = useCallback(() => {
    AdvancedSessionManager.revokeAllSessions(phone);
    setSession(null);
  }, [phone]);

  useEffect(() => {
    loadSession();
    // Refresh every minute
    const interval = setInterval(loadSession, 60000);
    return () => clearInterval(interval);
  }, [loadSession]);

  return { session, loading, error, logout };
}
```

## 2. Advanced ETF Analysis

### ETF Portfolio Analysis with Bid/Ask Impact

```typescript
// lib/etf-analysis.ts
import type { ETFPrice } from '@/lib/etf-data';

export interface PortfolioPosition {
  isin: string;
  quantity: number;
  purchasePrice: number;
}

export interface PortfolioAnalysis {
  totalPositions: number;
  
  // Value at bid (selling value)
  bidValue: number;
  
  // Value at ask (buying value)
  askValue: number;
  
  // Mid value (theoretical)
  midValue: number;
  
  // Spread impact
  spreadValue: number; // (mid - bid) * positions
  spreadPercent: number;
  
  // Performance
  gainAtBid: number;
  gainAtAsk: number;
  gainAtMid: number;
  
  // Per-position analysis
  positions: Array<{
    isin: string;
    quantity: number;
    bidValue: number;
    askValue: number;
    spreadCost: number;
  }>;
}

export function analyzePortfolio(
  positions: PortfolioPosition[],
  etfData: Record<string, ETFPrice>
): PortfolioAnalysis {
  let totalBidValue = 0;
  let totalAskValue = 0;
  let totalMidValue = 0;
  let totalSpreadCost = 0;

  const positionAnalysis = positions.map((pos) => {
    const etf = etfData[pos.isin];
    if (!etf) {
      return {
        isin: pos.isin,
        quantity: pos.quantity,
        bidValue: 0,
        askValue: 0,
        spreadCost: 0,
      };
    }

    const bidValue = etf.bid * pos.quantity;
    const askValue = etf.ask * pos.quantity;
    const midValue = ((etf.bid + etf.ask) / 2) * pos.quantity;
    const spreadCost = (etf.ask - etf.bid) * pos.quantity;

    totalBidValue += bidValue;
    totalAskValue += askValue;
    totalMidValue += midValue;
    totalSpreadCost += spreadCost;

    return {
      isin: pos.isin,
      quantity: pos.quantity,
      bidValue,
      askValue,
      spreadCost,
    };
  });

  const purchaseTotal = positions.reduce(
    (sum, pos) => sum + pos.purchasePrice * pos.quantity,
    0
  );

  return {
    totalPositions: positions.length,
    bidValue: totalBidValue,
    askValue: totalAskValue,
    midValue: totalMidValue,
    spreadValue: totalSpreadCost,
    spreadPercent: (totalSpreadCost / totalMidValue) * 100,
    gainAtBid: totalBidValue - purchaseTotal,
    gainAtAsk: totalAskValue - purchaseTotal,
    gainAtMid: totalMidValue - purchaseTotal,
    positions: positionAnalysis,
  };
}

/**
 * Calculate optimal buy/sell strategy based on spreads
 */
export function getBidAskOptimization(etfs: ETFPrice[]) {
  return etfs.map((etf) => ({
    isin: etf.isin,
    name: etf.name,
    spread: etf.spread,
    spreadPercent: etf.spreadPercent,
    recommendation:
      etf.spreadPercent < 0.1
        ? 'Good liquidity - low spread'
        : etf.spreadPercent < 0.5
        ? 'Reasonable spread'
        : 'Wide spread - poor liquidity',
  }));
}
```

## 3. Advanced Python Integration

### Real-time Data Monitoring with Alerts

```python
# scripts/monitoring.py
import asyncio
import json
from datetime import datetime
from typing import Optional
from dataclasses import dataclass

from python_api_client import TradeRepublicAPIClient

@dataclass
class PriceAlert:
    isin: str
    field: str  # 'bid', 'ask', 'last'
    condition: str  # '>', '<', '=='
    threshold: float

class PriceMonitor:
    def __init__(self, api_url: str = "http://localhost:3000"):
        self.client = TradeRepublicAPIClient(api_url)
        self.alerts: list[PriceAlert] = []
        self.last_prices: dict = {}

    def add_alert(self, alert: PriceAlert):
        """Add a price alert"""
        self.alerts.append(alert)
        print(f"[Monitor] Added alert: {alert}")

    async def monitor(self, interval_seconds: int = 60):
        """Monitor prices and trigger alerts"""
        print(f"[Monitor] Starting monitoring (interval: {interval_seconds}s)...")

        while True:
            try:
                # Fetch current prices
                snapshot = self.client.get_etf_snapshot()
                if not snapshot:
                    await asyncio.sleep(interval_seconds)
                    continue

                etfs = snapshot.get("data", [])

                # Check alerts
                for etf in etfs:
                    isin = etf.get("isin")
                    
                    for alert in self.alerts:
                        if alert.isin != isin:
                            continue

                        price = etf.get(alert.field)
                        if price is None:
                            continue

                        # Check condition
                        triggered = False
                        if alert.condition == '>' and price > alert.threshold:
                            triggered = True
                        elif alert.condition == '<' and price < alert.threshold:
                            triggered = True
                        elif alert.condition == '==' and abs(price - alert.threshold) < 0.01:
                            triggered = True

                        if triggered:
                            self._trigger_alert(alert, etf, price)

                await asyncio.sleep(interval_seconds)

            except Exception as e:
                print(f"[Monitor] Error: {e}")
                await asyncio.sleep(interval_seconds)

    def _trigger_alert(self, alert: PriceAlert, etf: dict, price: float):
        """Trigger alert action"""
        timestamp = datetime.now().isoformat()
        message = (
            f"[{timestamp}] ALERT: {etf.get('name')} ({alert.isin}) "
            f"{alert.field.upper()} {price} {alert.condition} {alert.threshold}"
        )
        print(message)

        # Send notification (email, webhook, etc.)
        # notify_user(message)

# Example usage
if __name__ == "__main__":
    monitor = PriceMonitor()
    
    # Alert when gold price drops below 420
    monitor.add_alert(PriceAlert(
        isin="GB00BS840F36",
        field="ask",
        condition="<",
        threshold=420.0
    ))
    
    # Alert when silver spread exceeds 1%
    monitor.add_alert(PriceAlert(
        isin="IE00B4NCMG89",
        field="bid",
        condition=">",
        threshold=69.0
    ))
    
    # Start monitoring
    asyncio.run(monitor.monitor(interval_seconds=30))
```

### Database Integration with SQLite

```python
# scripts/db_integration.py
import sqlite3
import json
from datetime import datetime
from typing import Optional

class TradeRepublicDB:
    def __init__(self, db_path: str = "trade_republic.db"):
        self.db_path = db_path
        self.init_db()

    def init_db(self):
        """Initialize database schema"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS etf_prices (
                    id INTEGER PRIMARY KEY,
                    isin TEXT NOT NULL,
                    name TEXT,
                    bid REAL,
                    ask REAL,
                    last REAL,
                    currency TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(isin, timestamp)
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS portfolio_snapshots (
                    id INTEGER PRIMARY KEY,
                    total_value_bid REAL,
                    total_value_ask REAL,
                    total_value_mid REAL,
                    currency TEXT,
                    positions_count INTEGER,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.commit()

    def insert_etf_prices(self, etfs: list[dict]):
        """Insert ETF prices into database"""
        with sqlite3.connect(self.db_path) as conn:
            for etf in etfs:
                conn.execute("""
                    INSERT OR IGNORE INTO etf_prices 
                    (isin, name, bid, ask, last, currency, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    etf.get("isin"),
                    etf.get("name"),
                    etf.get("bid"),
                    etf.get("ask"),
                    etf.get("last"),
                    etf.get("currency"),
                    datetime.fromtimestamp(etf.get("timestamp", 0) / 1000),
                ))
            conn.commit()

    def get_price_history(self, isin: str, days: int = 7) -> list[dict]:
        """Get price history for ETF"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT * FROM etf_prices
                WHERE isin = ? AND timestamp > datetime('now', '-' || ? || ' days')
                ORDER BY timestamp ASC
            """, (isin, days))
            return [dict(row) for row in cursor.fetchall()]

    def get_spread_statistics(self, isin: str, days: int = 7) -> dict:
        """Calculate spread statistics"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT 
                    MIN((ask - bid) / last * 100) as min_spread,
                    MAX((ask - bid) / last * 100) as max_spread,
                    AVG((ask - bid) / last * 100) as avg_spread
                FROM etf_prices
                WHERE isin = ? AND timestamp > datetime('now', '-' || ? || ' days')
            """, (isin, days))
            
            result = cursor.fetchone()
            return {
                "min_spread": result[0],
                "max_spread": result[1],
                "avg_spread": result[2],
            }
```

## 4. Advanced Excel Reporting

### Generate Multi-Sheet Portfolio Report

```python
# scripts/portfolio_reporter.py
import xlwing as xw
from datetime import datetime
from typing import Optional

class PortfolioReporter:
    def __init__(self, filename: str = "portfolio_report.xlsx"):
        self.filename = filename

    def generate_full_report(self, portfolio: dict, etf_data: dict):
        """Generate comprehensive portfolio report"""
        app = xw.App(visible=False)
        wb = app.books.add()

        # Remove default sheet
        wb.sheets[0].delete()

        # Add sheets
        self._create_summary_sheet(wb, portfolio)
        self._create_positions_sheet(wb, portfolio)
        self._create_etf_analysis_sheet(wb, etf_data)
        self._create_performance_sheet(wb, portfolio)

        # Save
        wb.save(self.filename)
        wb.close()
        app.quit()

    def _create_summary_sheet(self, wb: xw.Book, portfolio: dict):
        """Create summary sheet"""
        ws = wb.sheets.add("Summary", before=0)

        # Title
        ws.range("A1").value = "Portfolio Summary"
        ws.range("A1").font.size = 16
        ws.range("A1").font.bold = True

        # Key metrics
        metrics = [
            ["Metric", "Value"],
            ["Total Value (Bid)", portfolio.get("total_value_bid")],
            ["Total Value (Ask)", portfolio.get("total_value_ask")],
            ["Total Value (Mid)", portfolio.get("total_value_mid")],
            ["Spread Impact", portfolio.get("total_value_ask") - portfolio.get("total_value_bid")],
            ["Currency", portfolio.get("currency")],
            ["Positions", portfolio.get("positions_count")],
            ["Last Updated", datetime.now().isoformat()],
        ]

        for i, row in enumerate(metrics, start=3):
            ws.range(f"A{i}").value = row[0]
            ws.range(f"B{i}").value = row[1]

        # Format
        ws.range("A3:B3").font.bold = True
        ws.autofit()

    def _create_positions_sheet(self, wb: xw.Book, portfolio: dict):
        """Create positions sheet"""
        ws = wb.sheets.add("Positions")

        headers = ["ISIN", "Name", "Quantity", "Bid", "Ask", "Last", "Bid Value", "Ask Value", "Spread"]
        ws.range("A1").value = headers
        ws.range("A1:I1").font.bold = True

        positions = portfolio.get("positions", [])
        for i, pos in enumerate(positions, start=2):
            row = [
                pos.get("isin"),
                pos.get("name"),
                pos.get("quantity"),
                pos.get("bid"),
                pos.get("ask"),
                pos.get("last"),
                pos.get("bid") * pos.get("quantity"),
                pos.get("ask") * pos.get("quantity"),
                (pos.get("ask") - pos.get("bid")) * pos.get("quantity"),
            ]
            ws.range(f"A{i}").value = row

        ws.autofit()

    def _create_etf_analysis_sheet(self, wb: xw.Book, etf_data: dict):
        """Create ETF analysis sheet"""
        ws = wb.sheets.add("ETF Analysis")

        headers = ["ISIN", "Name", "Bid", "Ask", "Spread", "Spread %", "Currency"]
        ws.range("A1").value = headers
        ws.range("A1:G1").font.bold = True

        etfs = etf_data.get("data", [])
        for i, etf in enumerate(etfs, start=2):
            row = [
                etf.get("isin"),
                etf.get("name"),
                etf.get("bid"),
                etf.get("ask"),
                etf.get("ask") - etf.get("bid"),
                ((etf.get("ask") - etf.get("bid")) / etf.get("last")) * 100,
                etf.get("currency"),
            ]
            ws.range(f"A{i}").value = row

        ws.autofit()

    def _create_performance_sheet(self, wb: xw.Book, portfolio: dict):
        """Create performance sheet"""
        ws = wb.sheets.add("Performance")

        ws.range("A1").value = "Portfolio Performance"
        ws.range("A1").font.size = 14
        ws.range("A1").font.bold = True

        # Performance metrics
        metrics = [
            ["Metric", "Value"],
            ["Best Case (Ask)", portfolio.get("total_value_ask")],
            ["Mid Case", portfolio.get("total_value_mid")],
            ["Worst Case (Bid)", portfolio.get("total_value_bid")],
            ["Risk (Bid-Ask Difference)", portfolio.get("total_value_ask") - portfolio.get("total_value_bid")],
        ]

        for i, row in enumerate(metrics, start=3):
            ws.range(f"A{i}").value = row[0]
            ws.range(f"B{i}").value = row[1]

        ws.autofit()
```

## 5. Dashboard Integration Examples

### Real-time Price Updates Component

```typescript
// components/advanced-etf-monitor.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceUpdate {
  isin: string;
  price: number;
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  timestamp: number;
}

export function AdvancedETFMonitor() {
  const [priceUpdates, setPriceUpdates] = useState<PriceUpdate[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/ws/prices');

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setPriceUpdates((prev) => [update, ...prev.slice(0, 9)]);
    };

    return () => ws.close();
  }, []);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold mb-4">Price Updates</h2>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {priceUpdates.map((update) => (
          <div
            key={`${update.isin}-${update.timestamp}`}
            className="flex items-center justify-between p-2 rounded bg-secondary/50"
          >
            <div className="flex items-center gap-2">
              {update.direction === 'up' && (
                <TrendingUp className="w-4 h-4 text-primary" />
              )}
              {update.direction === 'down' && (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              <span className="font-mono text-sm">{update.isin}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold">${update.price.toFixed(2)}</span>
              <Badge
                variant={update.direction === 'up' ? 'default' : 'destructive'}
              >
                {update.changePercent > 0 ? '+' : ''}{update.changePercent.toFixed(2)}%
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

## 6. Troubleshooting Advanced Scenarios

### Session Not Renewing
```python
# Check session expiry
from lib.session-manager import sessionManager

session = sessionManager.loadSession("+49...")
time_left = (session.expiresAt - time.time()) / 3600
print(f"Session expires in {time_left} hours")
```

### ETF Data Not Syncing
```python
# Verify API endpoint
import requests
response = requests.get("http://localhost:3000/api/etf/snapshot")
print(response.status_code)
print(response.json())
```

### Python WebSocket Connection
```python
# Test WebSocket connection
import websocket

ws = websocket.WebSocketApp("ws://localhost:3000/ws/prices")
ws.run_forever()
```

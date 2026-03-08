'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getETFSnapshot, ETFPrice } from '@/lib/etf-data';

/**
 * ETF Prices Component - Display bid/ask prices
 * Matches Trade Republic format shown in the reference image
 */
export function ETFPrices() {
  const [etfs, setEtfs] = useState<ETFPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadETFData();
    // Refresh every 5 seconds
    const interval = setInterval(loadETFData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadETFData = () => {
    try {
      const snapshot = getETFSnapshot();
      setEtfs(snapshot.etfs);
    } catch (error) {
      console.error('[ETFPrices] Failed to load ETF data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-mono text-muted-foreground">
            TRADE REPUBLIC ETF PRICES
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm font-mono">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border font-mono">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-mono tracking-wider text-foreground">
          TRADE REPUBLIC ETF PRICES
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {etfs.length === 0 ? (
          <div className="text-muted-foreground">No ETF data available</div>
        ) : (
          etfs.map((etf) => (
            <div
              key={etf.isin}
              className="border-b border-border pb-4 last:border-b-0 space-y-2"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">
                    {etf.name} {etf.symbol}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {etf.isin}
                  </div>
                </div>
                <Badge variant="outline" className="font-mono">
                  {etf.currency}
                </Badge>
              </div>

              {/* Price Data */}
              <div className="grid grid-cols-3 gap-4 text-right font-mono">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Bid
                  </div>
                  <div className="text-foreground font-semibold">
                    {etf.bid.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Ask
                  </div>
                  <div className="text-foreground font-semibold">
                    {etf.ask.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Last
                  </div>
                  <div className="text-foreground font-semibold">
                    {etf.last.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Spread Info */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Spread</span>
                <span className={etf.spread > 0 ? 'text-primary' : 'text-destructive'}>
                  {etf.spread > 0 ? '+' : ''}{etf.spread.toFixed(2)} ({etf.spreadPercent.toFixed(3)}%)
                </span>
              </div>
            </div>
          ))
        )}

        {/* Footer */}
        <div className="text-xs text-muted-foreground border-t border-border pt-3 mt-4">
          <div>TR source: Trade Republic</div>
          <div>
            Last TR: {new Date().toISOString().replace('T', ' ').slice(0, 19)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

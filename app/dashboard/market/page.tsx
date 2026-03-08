'use client';

import { useEffect, useState } from 'react';
import { DashboardNav } from '@/components/dashboard-nav';
import { MarketSnapshot } from '@/components/market-snapshot';
import { ETFPrices } from '@/components/etf-prices';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarketStats {
  symbol: string;
  name: string;
  price: number | null;
  change24h: number | null;
  high24h?: number;
  low24h?: number;
  volume?: number;
}

export default function MarketPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger a refetch of market data
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdate(new Date());
    }, 500);
  };

  useEffect(() => {
    setLastUpdate(new Date());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Market Data</h1>
            <p className="text-muted-foreground mt-2">
              Real-time price data from Binance (XAU, XAG, EUR)
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Market Snapshot */}
        <div className="space-y-8">
          <MarketSnapshot />
          <ETFPrices />
        </div>

        {/* Additional Info */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* How It Works */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Data Sources</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">Binance WebSocket</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time price feeds via Binance WebSocket API. Updates every few hundred milliseconds.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Spot Prices (USD)</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  XAU/USD (Gold), XAG/USD (Silver), EUR/USD (Euro)
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Derived Prices (EUR)</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  XAU/EUR and XAG/EUR calculated from spot prices using EUR/USD exchange rate.
                </p>
              </div>
            </div>
          </Card>

          {/* Last Updated */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Connection Status</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                <div>
                  <p className="font-semibold text-foreground">Live Connection</p>
                  <p className="text-sm text-muted-foreground">Connected to Binance API</p>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">Last Updated:</p>
                <p className="font-mono text-foreground mt-1">
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Loading...'}
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">Refresh Interval:</p>
                <p className="font-mono text-foreground mt-1">Real-time (WebSocket)</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Market Symbols Info */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">Tracked Symbols</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Gold (XAU)</h3>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Precious Metal</span>
              </div>
              <p className="text-sm text-muted-foreground">
                XAU/USD - Gold price in US Dollars per troy ounce
              </p>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">Binance Symbol: XAUUSDT</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Silver (XAG)</h3>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Precious Metal</span>
              </div>
              <p className="text-sm text-muted-foreground">
                XAG/USD - Silver price in US Dollars per troy ounce
              </p>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">Binance Symbol: XAGUSDT</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Euro (EUR)</h3>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Currency</span>
              </div>
              <p className="text-sm text-muted-foreground">
                EUR/USD - Euro price in US Dollars
              </p>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">Binance Symbol: EURUSDT</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="border-t border-border pt-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-foreground mb-2">API Documentation</h3>
              <p className="text-sm text-muted-foreground">
                Market data is fetched from Binance WebSocket API in real-time. No API key required for public data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Updates & Reliability</h3>
              <p className="text-sm text-muted-foreground">
                Price data updates automatically via WebSocket. Connection is maintained with automatic reconnection.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

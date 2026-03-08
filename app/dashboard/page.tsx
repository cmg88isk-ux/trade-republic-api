'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { ISINTrader } from '@/components/isin-trader';
import { BinanceMarket } from '@/components/binance-market';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    const sessionData = localStorage.getItem('tradeSession');
    if (!sessionData) {
      router.push('/auth');
      return;
    }
    
    try {
      const session = JSON.parse(sessionData);
      setIsGuestMode(session.guestMode === true);
    } catch {
      setIsGuestMode(false);
    }
    
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <Skeleton className="h-96 rounded-lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Trading Platform</h1>
          <p className="text-muted-foreground mt-2">
            Achetez et vendez des actifs en temps reel avec les meilleures prix Bid/Ask
          </p>
        </div>

        {isGuestMode ? (
          // Guest mode: Show only Binance data without tabs
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Mode invite - Connectez-vous a Trade Republic pour acceder au trading ISIN
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <BinanceMarket autoRefresh={true} refreshInterval={10000} />
              
              <div className="space-y-6">
                <div className="p-6 rounded-lg border border-border bg-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Market Info</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Source</span>
                      <span className="font-medium">Binance API</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">XAU/USD</span>
                      <span className="font-medium">PAX Gold (PAXG)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">XAG/USD</span>
                      <span className="font-medium">Proxy (Gold/80)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">EUR/USD</span>
                      <span className="font-medium">EURUSDC / EURUSDT</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-lg border border-border bg-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Notes</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>- XAU/EUR et XAG/EUR calcules a partir des prix USD</li>
                    <li>- XAG estime via le ratio or/argent (~80:1)</li>
                    <li>- Rafraichissement automatique toutes les 10s</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Full mode: Show tabs with Binance and ISIN Trading
          <Tabs defaultValue="binance" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="binance">Binance Market</TabsTrigger>
              <TabsTrigger value="isin">ISIN Trading</TabsTrigger>
            </TabsList>

            <TabsContent value="binance" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <BinanceMarket autoRefresh={true} refreshInterval={10000} />
                
                <div className="space-y-6">
                  <div className="p-6 rounded-lg border border-border bg-card">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Market Info</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data Source</span>
                        <span className="font-medium">Binance API</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">XAU/USD</span>
                        <span className="font-medium">PAX Gold (PAXG)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">XAG/USD</span>
                        <span className="font-medium">Proxy (Gold/80)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">EUR/USD</span>
                        <span className="font-medium">EURUSDC / EURUSDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Auto Refresh</span>
                        <span className="font-medium">Every 10 seconds</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg border border-border bg-card">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Notes</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>- XAU/EUR et XAG/EUR calcules a partir des prix USD</li>
                      <li>- XAG estime via le ratio or/argent (~80:1)</li>
                      <li>- Rafraichissement automatique toutes les 10s</li>
                      <li>- Source: Binance Public API</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="isin">
              <ISINTrader />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

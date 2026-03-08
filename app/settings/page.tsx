'use client';

import { useState } from 'react';
import { TerminalLayout } from '@/components/terminal/terminal-layout';
import { 
  Save,
  RotateCcw,
  Bell,
  Clock,
  Sliders,
  Database,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { DEFAULT_GOLD_THRESHOLDS, DEFAULT_SILVER_THRESHOLDS } from '@/lib/config/instruments';

interface AlertSettings {
  gold: {
    spreadPctBuy: number;
    spreadPctSell: number;
    zScoreThreshold: number;
    enabled: boolean;
    cooldownMinutes: number;
  };
  silver: {
    spreadPctBuy: number;
    spreadPctSell: number;
    zScoreThreshold: number;
    enabled: boolean;
    cooldownMinutes: number;
  };
}

interface DisplaySettings {
  refreshInterval: number;
  autoRefresh: boolean;
  showZScore: boolean;
  showNetEdge: boolean;
  theme: 'dark' | 'light';
}

export default function SettingsPage() {
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    gold: {
      spreadPctBuy: DEFAULT_GOLD_THRESHOLDS.spreadPctBuy,
      spreadPctSell: DEFAULT_GOLD_THRESHOLDS.spreadPctSell,
      zScoreThreshold: DEFAULT_GOLD_THRESHOLDS.zScoreThreshold,
      enabled: DEFAULT_GOLD_THRESHOLDS.enabled,
      cooldownMinutes: DEFAULT_GOLD_THRESHOLDS.cooldownMinutes,
    },
    silver: {
      spreadPctBuy: DEFAULT_SILVER_THRESHOLDS.spreadPctBuy,
      spreadPctSell: DEFAULT_SILVER_THRESHOLDS.spreadPctSell,
      zScoreThreshold: DEFAULT_SILVER_THRESHOLDS.zScoreThreshold,
      enabled: DEFAULT_SILVER_THRESHOLDS.enabled,
      cooldownMinutes: DEFAULT_SILVER_THRESHOLDS.cooldownMinutes,
    },
  });

  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    refreshInterval: 5000,
    autoRefresh: true,
    showZScore: true,
    showNetEdge: true,
    theme: 'dark',
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setAlertSettings({
      gold: {
        spreadPctBuy: DEFAULT_GOLD_THRESHOLDS.spreadPctBuy,
        spreadPctSell: DEFAULT_GOLD_THRESHOLDS.spreadPctSell,
        zScoreThreshold: DEFAULT_GOLD_THRESHOLDS.zScoreThreshold,
        enabled: DEFAULT_GOLD_THRESHOLDS.enabled,
        cooldownMinutes: DEFAULT_GOLD_THRESHOLDS.cooldownMinutes,
      },
      silver: {
        spreadPctBuy: DEFAULT_SILVER_THRESHOLDS.spreadPctBuy,
        spreadPctSell: DEFAULT_SILVER_THRESHOLDS.spreadPctSell,
        zScoreThreshold: DEFAULT_SILVER_THRESHOLDS.zScoreThreshold,
        enabled: DEFAULT_SILVER_THRESHOLDS.enabled,
        cooldownMinutes: DEFAULT_SILVER_THRESHOLDS.cooldownMinutes,
      },
    });
    setDisplaySettings({
      refreshInterval: 5000,
      autoRefresh: true,
      showZScore: true,
      showNetEdge: true,
      theme: 'dark',
    });
  };

  return (
    <TerminalLayout 
      title="SETTINGS"
      subtitle="Configure alerts, thresholds, and display options"
    >
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          {saved && (
            <div className="flex items-center gap-2 text-signal-buy text-sm">
              <CheckCircle className="w-4 h-4" />
              Settings saved
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border bg-muted/50 hover:bg-muted transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            RESET DEFAULTS
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded border border-accent bg-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            {saving ? 'SAVING...' : 'SAVE SETTINGS'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Alert Thresholds */}
        <div className="space-y-6">
          {/* Gold Settings */}
          <div className="terminal-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium uppercase tracking-wider">Gold Alert Thresholds</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Alerts Enabled</label>
                <button
                  onClick={() => setAlertSettings(s => ({
                    ...s,
                    gold: { ...s.gold, enabled: !s.gold.enabled }
                  }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    alertSettings.gold.enabled ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-background shadow transition-transform ${
                    alertSettings.gold.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Buy Signal Threshold (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={alertSettings.gold.spreadPctBuy}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    gold: { ...s.gold, spreadPctBuy: parseFloat(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">TR cheaper than Binance by this %</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Sell Signal Threshold (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={alertSettings.gold.spreadPctSell}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    gold: { ...s.gold, spreadPctSell: parseFloat(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">TR more expensive than Binance by this %</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Z-Score Threshold</label>
                <input
                  type="number"
                  step="0.1"
                  value={alertSettings.gold.zScoreThreshold}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    gold: { ...s.gold, zScoreThreshold: parseFloat(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Alert Cooldown (minutes)</label>
                <input
                  type="number"
                  value={alertSettings.gold.cooldownMinutes}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    gold: { ...s.gold, cooldownMinutes: parseInt(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Silver Settings */}
          <div className="terminal-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-silver" />
              <h3 className="text-sm font-medium uppercase tracking-wider">Silver Alert Thresholds</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Alerts Enabled</label>
                <button
                  onClick={() => setAlertSettings(s => ({
                    ...s,
                    silver: { ...s.silver, enabled: !s.silver.enabled }
                  }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    alertSettings.silver.enabled ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-background shadow transition-transform ${
                    alertSettings.silver.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Buy Signal Threshold (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={alertSettings.silver.spreadPctBuy}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    silver: { ...s.silver, spreadPctBuy: parseFloat(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Sell Signal Threshold (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={alertSettings.silver.spreadPctSell}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    silver: { ...s.silver, spreadPctSell: parseFloat(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Z-Score Threshold</label>
                <input
                  type="number"
                  step="0.1"
                  value={alertSettings.silver.zScoreThreshold}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    silver: { ...s.silver, zScoreThreshold: parseFloat(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Alert Cooldown (minutes)</label>
                <input
                  type="number"
                  value={alertSettings.silver.cooldownMinutes}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    silver: { ...s.silver, cooldownMinutes: parseInt(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="space-y-6">
          <div className="terminal-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium uppercase tracking-wider">Display Settings</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Auto Refresh</label>
                <button
                  onClick={() => setDisplaySettings(s => ({ ...s, autoRefresh: !s.autoRefresh }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    displaySettings.autoRefresh ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-background shadow transition-transform ${
                    displaySettings.autoRefresh ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Refresh Interval (ms)</label>
                <select
                  value={displaySettings.refreshInterval}
                  onChange={(e) => setDisplaySettings(s => ({ ...s, refreshInterval: parseInt(e.target.value) }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm"
                >
                  <option value={1000}>1 second</option>
                  <option value={2000}>2 seconds</option>
                  <option value={5000}>5 seconds</option>
                  <option value={10000}>10 seconds</option>
                  <option value={30000}>30 seconds</option>
                  <option value={60000}>1 minute</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Show Z-Score</label>
                <button
                  onClick={() => setDisplaySettings(s => ({ ...s, showZScore: !s.showZScore }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    displaySettings.showZScore ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-background shadow transition-transform ${
                    displaySettings.showZScore ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Show Net Edge</label>
                <button
                  onClick={() => setDisplaySettings(s => ({ ...s, showNetEdge: !s.showNetEdge }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    displaySettings.showNetEdge ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-background shadow transition-transform ${
                    displaySettings.showNetEdge ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div className="terminal-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium uppercase tracking-wider">Data Sources</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <div className="text-sm font-medium">Binance</div>
                  <div className="text-xs text-muted-foreground">PAXG/USDT Spot</div>
                </div>
                <span className="flex items-center gap-1 text-xs text-signal-buy">
                  <span className="w-2 h-2 rounded-full bg-signal-buy animate-pulse" />
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <div className="text-sm font-medium">Trade Republic</div>
                  <div className="text-xs text-muted-foreground">Lang & Schwarz</div>
                </div>
                <span className="flex items-center gap-1 text-xs text-signal-buy">
                  <span className="w-2 h-2 rounded-full bg-signal-buy animate-pulse" />
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <div className="text-sm font-medium">EUR/USD Rate</div>
                  <div className="text-xs text-muted-foreground">ECB Reference</div>
                </div>
                <span className="flex items-center gap-1 text-xs text-signal-buy">
                  <span className="w-2 h-2 rounded-full bg-signal-buy animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Market Hours Info */}
          <div className="terminal-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium uppercase tracking-wider">Market Hours</h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trade Republic (L&S)</span>
                <span className="font-mono">07:30 - 23:00 CET</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">XETRA</span>
                <span className="font-mono">09:00 - 17:30 CET</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Binance</span>
                <span className="font-mono">24/7</span>
              </div>
            </div>

            <div className="mt-4 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
              <strong>Note:</strong> Spread comparisons are most reliable during TR market hours. 
              Weekend and holiday data is flagged with reduced confidence.
            </div>
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}

'use client';

import { useState } from 'react';
import { TerminalLayout, PanelGrid } from '@/components/terminal/terminal-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Download, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Table2,
  BarChart3,
  Activity,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportConfig {
  includeMarkets: boolean;
  includeArbitrage: boolean;
  includeSignals: boolean;
  includeHistory: boolean;
  format: 'csv' | 'xlsx';
  dateRange: '24h' | '7d' | '30d' | 'custom';
  customStartDate: string;
  customEndDate: string;
}

interface ExportJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  size?: string;
  error?: string;
}

export default function ExportPage() {
  const [config, setConfig] = useState<ExportConfig>({
    includeMarkets: true,
    includeArbitrage: true,
    includeSignals: true,
    includeHistory: false,
    format: 'csv',
    dateRange: '7d',
    customStartDate: '',
    customEndDate: '',
  });

  const [exportJobs, setExportJobs] = useState<ExportJob[]>([
    {
      id: '1',
      name: 'Full Export - 2024-01-15',
      status: 'completed',
      progress: 100,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000).toISOString(),
      downloadUrl: '#',
      size: '2.4 MB',
    },
    {
      id: '2',
      name: 'Signals Export - 2024-01-14',
      status: 'completed',
      progress: 100,
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 26 * 60 * 60 * 1000 + 12000).toISOString(),
      downloadUrl: '#',
      size: '156 KB',
    },
  ]);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    const newJob: ExportJob = {
      id: Date.now().toString(),
      name: `Export - ${new Date().toLocaleDateString()}`,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    setExportJobs(prev => [newJob, ...prev]);

    // Simulate export progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setExportJobs(prev => 
        prev.map(job => 
          job.id === newJob.id ? { ...job, progress: i } : job
        )
      );
    }

    // Complete the export
    setExportJobs(prev =>
      prev.map(job =>
        job.id === newJob.id
          ? {
              ...job,
              status: 'completed',
              progress: 100,
              completedAt: new Date().toISOString(),
              downloadUrl: '#',
              size: '1.2 MB',
            }
          : job
      )
    );

    setIsExporting(false);
  };

  const dataCategories = [
    { key: 'includeMarkets', label: 'Market Data', icon: <Table2 className="h-5 w-5" />, description: 'Current prices, bid/ask spreads for all instruments' },
    { key: 'includeArbitrage', label: 'Arbitrage Data', icon: <BarChart3 className="h-5 w-5" />, description: 'Spread calculations, z-scores, and opportunities' },
    { key: 'includeSignals', label: 'Trading Signals', icon: <Activity className="h-5 w-5" />, description: 'Active and recent BUY/SELL/WATCH signals' },
    { key: 'includeHistory', label: 'Historical Data', icon: <History className="h-5 w-5" />, description: 'Past signals and price history' },
  ] as const;

  return (
    <TerminalLayout title="Export">
      <div className="p-4 space-y-6">
        {/* Export Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Selection */}
          <div className="terminal-panel p-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Data to Export
            </h3>
            <div className="space-y-3">
              {dataCategories.map((category) => (
                <label
                  key={category.key}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    config[category.key]
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                >
                  <Checkbox
                    checked={config[category.key]}
                    onCheckedChange={(checked) =>
                      setConfig(prev => ({ ...prev, [category.key]: !!checked }))
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{category.icon}</span>
                      <span className="font-medium text-sm">{category.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="terminal-panel p-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Export Options
            </h3>
            
            <div className="space-y-4">
              {/* Format Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Export Format</Label>
                <div className="flex gap-2">
                  <Button
                    variant={config.format === 'csv' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConfig(prev => ({ ...prev, format: 'csv' }))}
                    className="flex-1"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    variant={config.format === 'xlsx' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConfig(prev => ({ ...prev, format: 'xlsx' }))}
                    className="flex-1"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel (XLSX)
                  </Button>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm">Date Range</Label>
                <Select
                  value={config.dateRange}
                  onValueChange={(v) => setConfig(prev => ({ ...prev, dateRange: v as ExportConfig['dateRange'] }))}
                >
                  <SelectTrigger className="bg-surface-2">
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              {config.dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={config.customStartDate}
                      onChange={(e) => setConfig(prev => ({ ...prev, customStartDate: e.target.value }))}
                      className="bg-surface-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      value={config.customEndDate}
                      onChange={(e) => setConfig(prev => ({ ...prev, customEndDate: e.target.value }))}
                      className="bg-surface-2"
                    />
                  </div>
                </div>
              )}

              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={isExporting || (!config.includeMarkets && !config.includeArbitrage && !config.includeSignals && !config.includeHistory)}
                className="w-full mt-4"
              >
                {isExporting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Start Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Export History */}
        <div className="terminal-panel">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Export History
            </h3>
          </div>
          
          <div className="divide-y divide-border/50">
            {exportJobs.map((job) => (
              <div 
                key={job.id}
                className="p-4 flex items-center justify-between hover:bg-surface-2/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'p-2 rounded-lg',
                    job.status === 'completed' && 'bg-[var(--positive)]/10 text-[var(--positive)]',
                    job.status === 'processing' && 'bg-[var(--warning)]/10 text-[var(--warning)]',
                    job.status === 'failed' && 'bg-[var(--negative)]/10 text-[var(--negative)]',
                    job.status === 'pending' && 'bg-muted/10 text-muted-foreground'
                  )}>
                    {job.status === 'completed' && <CheckCircle2 className="h-5 w-5" />}
                    {job.status === 'processing' && <Clock className="h-5 w-5 animate-spin" />}
                    {job.status === 'failed' && <AlertCircle className="h-5 w-5" />}
                    {job.status === 'pending' && <Clock className="h-5 w-5" />}
                  </div>
                  
                  <div>
                    <div className="font-medium text-sm">{job.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>Created {new Date(job.createdAt).toLocaleString()}</span>
                      {job.size && (
                        <>
                          <span>•</span>
                          <span>{job.size}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {job.status === 'processing' && (
                    <div className="w-32">
                      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-1">
                        {job.progress}%
                      </div>
                    </div>
                  )}
                  
                  <Badge variant="outline" className={cn(
                    'text-xs',
                    job.status === 'completed' && 'border-[var(--positive)]/50 text-[var(--positive)]',
                    job.status === 'processing' && 'border-[var(--warning)]/50 text-[var(--warning)]',
                    job.status === 'failed' && 'border-[var(--negative)]/50 text-[var(--negative)]'
                  )}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                  
                  {job.status === 'completed' && job.downloadUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={job.downloadUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {exportJobs.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No exports yet. Configure your export options above and click "Start Export".
              </div>
            )}
          </div>
        </div>

        {/* Quick Export Templates */}
        <div className="terminal-panel p-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Quick Export Templates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-2"
              onClick={() => {
                setConfig({
                  includeMarkets: true,
                  includeArbitrage: false,
                  includeSignals: false,
                  includeHistory: false,
                  format: 'csv',
                  dateRange: '24h',
                  customStartDate: '',
                  customEndDate: '',
                });
              }}
            >
              <Table2 className="h-5 w-5" />
              <span className="text-sm font-medium">Market Snapshot</span>
              <span className="text-xs text-muted-foreground">Current prices only</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-2"
              onClick={() => {
                setConfig({
                  includeMarkets: false,
                  includeArbitrage: true,
                  includeSignals: true,
                  includeHistory: false,
                  format: 'xlsx',
                  dateRange: '7d',
                  customStartDate: '',
                  customEndDate: '',
                });
              }}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm font-medium">Weekly Analysis</span>
              <span className="text-xs text-muted-foreground">7-day arbitrage + signals</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-2"
              onClick={() => {
                setConfig({
                  includeMarkets: true,
                  includeArbitrage: true,
                  includeSignals: true,
                  includeHistory: true,
                  format: 'xlsx',
                  dateRange: '30d',
                  customStartDate: '',
                  customEndDate: '',
                });
              }}
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span className="text-sm font-medium">Full Report</span>
              <span className="text-xs text-muted-foreground">All data, 30 days</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-2"
              onClick={() => {
                setConfig({
                  includeMarkets: false,
                  includeArbitrage: false,
                  includeSignals: true,
                  includeHistory: false,
                  format: 'csv',
                  dateRange: '24h',
                  customStartDate: '',
                  customEndDate: '',
                });
              }}
            >
              <Activity className="h-5 w-5" />
              <span className="text-sm font-medium">Today's Signals</span>
              <span className="text-xs text-muted-foreground">Last 24h signals</span>
            </Button>
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}

# Python + Excel Integration Guide

This guide explains how to use the Trade Republic Dashboard data collection system with Python and Excel export.

## Overview

The system provides:
- **Python API Client** - Fetch data from the Dashboard API locally
- **Excel Export** - Export ETF and portfolio data to Excel using xlwing
- **Automated Collection** - Scheduled data collection pipeline

## Architecture

```
Next.js Dashboard (API Server)
    ↓
Python API Client (HTTP Requests)
    ↓
Local JSON Files (data/)
    ↓
Excel Export (xlwing)
```

## Installation

### 1. Install Python Dependencies

```bash
pip install requests xlwing

# Or using uv:
uv add requests xlwing
```

### 2. Verify Dashboard is Running

The dashboard must be running on `http://localhost:3000` for the Python client to connect.

```bash
npm run dev
# Dashboard should be accessible at http://localhost:3000
```

## Usage

### Basic Data Collection

```bash
# Collect all data and export to Excel
python scripts/python_api_client.py --export-excel

# With custom output directory
python scripts/python_api_client.py --output-dir ./my_data --export-excel
```

### Programmatic Usage

```python
from scripts.python_api_client import DataCollector, TradeRepublicAPIClient, ExcelExporter

# Initialize client
client = TradeRepublicAPIClient(api_url="http://localhost:3000")

# Fetch ETF snapshot
etf_data = client.get_etf_snapshot()
print(etf_data)

# Fetch portfolio snapshot
portfolio = client.get_portfolio_snapshot()
print(portfolio)

# Export to Excel
exporter = ExcelExporter(filename="my_export.xlsx")
exporter.export_etf_data(etf_data.get("data", []))
```

## API Endpoints

### ETF Snapshot
```http
GET /api/etf/snapshot
```

Returns all ETF prices with Bid/Ask/Last data.

**Response:**
```json
{
  "data": [
    {
      "isin": "IE00B4NCMG89",
      "name": "Phys Silver",
      "symbol": "XSLV.L",
      "bid": 69.02,
      "ask": 69.59,
      "last": 69.02,
      "currency": "USD",
      "timestamp": 1234567890,
      "source": "Trade Republic"
    }
  ],
  "meta": {
    "timestamp": 1234567890,
    "source": "Trade Republic",
    "count": 5,
    "lastUpdate": "2026-03-08T12:34:56Z"
  }
}
```

### Portfolio Snapshot
```http
GET /api/portfolio/snapshot
```

Returns current portfolio with positions and valuations.

### Market Snapshot
```http
GET /api/market/snapshot
```

Returns Binance market data (XAU, XAG, EUR).

## Excel Export Features

### 1. ETF Data Export

Exports all ETF prices with:
- ISIN, Name, Symbol
- Bid/Ask/Last prices
- Currency, Timestamp, Source

**Features:**
- Auto-fit columns
- Bold headers with blue background
- Numeric formatting for prices

### 2. Portfolio Export

Creates two sheets:
- **Portfolio** - Summary with total values (Bid/Ask/Mid)
- **Positions** - Individual positions with Bid/Ask/Last

**Example:**

```python
exporter = ExcelExporter("portfolio_report.xlsx")
portfolio_data = {
    "total_value_bid": 10500.50,
    "total_value_ask": 10525.75,
    "total_value_mid": 10513.13,
    "currency": "USD",
    "timestamp": "2026-03-08T12:34:56Z",
    "positions": [
        {
            "isin": "IE00B4NCMG89",
            "name": "Phys Silver",
            "symbol": "XSLV.L",
            "quantity": 100,
            "bid": 69.02,
            "ask": 69.59,
            "last": 69.02
        }
    ]
}

exporter.export_portfolio_data(portfolio_data)
```

## Automated Collection

### Cron Job Example

To collect data every hour:

```bash
# Add to crontab (crontab -e)
0 * * * * cd /path/to/project && python scripts/python_api_client.py --export-excel
```

### With Debian Systemd Timer

Create `/etc/systemd/system/trade-republic-collect.timer`:

```ini
[Unit]
Description=Trade Republic Data Collection
Requires=trade-republic-collect.service

[Timer]
OnBootSec=5min
OnUnitActiveSec=1h
Persistent=true

[Install]
WantedBy=timers.target
```

Create `/etc/systemd/system/trade-republic-collect.service`:

```ini
[Unit]
Description=Trade Republic Data Collection Service
After=network.target

[Service]
Type=oneshot
User=ubuntu
WorkingDirectory=/home/ubuntu/trade-republic-dashboard
ExecStart=/usr/bin/python3 scripts/python_api_client.py --export-excel --output-dir /var/data/trade-republic
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable trade-republic-collect.timer
sudo systemctl start trade-republic-collect.timer

# Check status
sudo systemctl status trade-republic-collect.timer
sudo systemctl list-timers
```

## Session Management

### Persistent Sessions

The system automatically:
1. Saves sessions after authentication
2. Encrypts session data locally
3. Avoids repeated SMS/PIN requests
4. Auto-resumes sessions when available

**Session Storage:**
- Frontend: `localStorage` (tradeSession)
- Backend: `.tr-sessions/` directory (encrypted)

### Resume Existing Session

The auth form will show "Session Found" if a valid session exists:

```bash
# Restore from encrypted session files in .tr-sessions/
# No SMS required for re-authentication
```

## Avoiding Rate Limits

### 1. Session Reuse

Always reuse sessions when possible:

```python
# Check if session exists
session = sessionManager.loadSession(phone)
if session and session.expiresAt > now:
    # Reuse existing session
    pass
else:
    # Create new session (triggers SMS)
    session = sessionManager.createSession(phone, sessionId)
```

### 2. Batch Requests

Collect all data in one operation:

```python
# Good: Single collection run
collector = DataCollector()
collector.collect_all()

# Bad: Multiple API calls
client.get_etf_snapshot()
client.get_portfolio_snapshot()
client.get_market_data()
```

### 3. Caching

The API includes caching headers:

```
Cache-Control: public, s-maxage=5, stale-while-revalidate=10
```

This means:
- Fresh data for 5 seconds
- Stale data for 10 more seconds before re-fetching
- Reduces unnecessary API requests

### 4. Exponential Backoff

When connecting to Trade Republic API, use exponential backoff:

```python
import time

max_retries = 3
for attempt in range(max_retries):
    try:
        response = client.get_etf_snapshot()
        break
    except RateLimitError:
        wait_time = 2 ** attempt
        time.sleep(wait_time)
```

## Troubleshooting

### xlwing Not Found

```bash
# Install xlwing
pip install xlwing

# On macOS, may need Excel installation
# Check: xlwing runpython
```

### Dashboard Not Reachable

```bash
# Verify dashboard is running
curl http://localhost:3000/api/etf/snapshot

# Or check logs
npm run dev
```

### Session Expired

Clear stored sessions and re-authenticate:

```bash
# Clear localStorage (browser console)
localStorage.removeItem('tradeSession')

# Or delete encrypted sessions (server)
rm -rf .tr-sessions/
```

### Export File Locked

Close any open Excel windows before export:

```python
# Kill Excel process (Windows)
taskkill /IM EXCEL.EXE /F

# Or use force flag in xlwing
xlwing.App().quit()
```

## Best Practices

1. **Always reuse sessions** - Prevents SMS spam
2. **Collect data once per hour** - Respects API rate limits
3. **Use caching headers** - Let browser cache responses
4. **Encrypt sensitive data** - Sessions are encrypted locally
5. **Monitor session expiry** - Sessions expire after 30 days
6. **Batch operations** - Collect all data in one run
7. **Log everything** - Use Python logging for debugging

## Examples

### Daily Report Generation

```python
#!/usr/bin/env python3
import sys
from datetime import datetime
from scripts.python_api_client import DataCollector

def main():
    collector = DataCollector(output_dir="./reports")
    if collector.collect_all():
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        print(f"Successfully generated report at {timestamp}")
        sys.exit(0)
    else:
        print("Failed to generate report")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Real-time Data Sync

```python
import time
from scripts.python_api_client import TradeRepublicAPIClient
import json

client = TradeRepublicAPIClient()

while True:
    # Fetch latest data
    snapshot = client.get_etf_snapshot()
    
    # Process data
    if snapshot:
        print(f"[{datetime.now()}] Updated {len(snapshot.get('data', []))} ETFs")
        
        # Save to file
        with open('latest_data.json', 'w') as f:
            json.dump(snapshot, f)
    
    # Wait before next fetch
    time.sleep(60)  # 1 minute
```

## API Rate Limits

- Trade Republic API: ~100 requests/minute per session
- Binance API: ~1200 requests/minute (no auth required)
- Dashboard: Caching prevents most repeat requests

Using sessions effectively avoids almost all rate limit issues.

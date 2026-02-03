# Technical Architecture Document

## Stock Analyzer Pro - Technical Specification

**Version:** 1.0.0  
**Last Updated:** February 2026  
**Document Type:** Technical Architecture & API Reference

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Data Flow](#4-data-flow)
5. [API Integrations](#5-api-integrations)
6. [Core Modules](#6-core-modules)
7. [Technical Indicators](#7-technical-indicators)
8. [State Management](#8-state-management)
9. [Caching Strategy](#9-caching-strategy)
10. [Security Considerations](#10-security-considerations)
11. [Performance Optimizations](#11-performance-optimizations)
12. [Error Handling](#12-error-handling)

---

## 1. System Overview

Stock Analyzer Pro is a single-page application (SPA) built with React that provides real-time stock analysis, technical indicators, pattern detection, and AI-powered trade recommendations. The application operates entirely in the browser with no backend server, communicating directly with various financial data APIs.

### Key Capabilities

- Real-time and historical stock data visualization
- Technical indicator calculations (RSI, MACD, Bollinger Bands, ATR)
- Automated pattern/setup detection (8 distinct patterns)
- AI-powered analysis using Claude API
- Multi-source data fetching with intelligent fallbacks
- Confidence scoring and trade recommendations

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   React     │  │   State     │  │     Local Storage       │ │
│  │   Components│  │   (useState)│  │   (Persistence Layer)   │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                      │               │
│         └────────────────┼──────────────────────┘               │
│                          │                                      │
│  ┌───────────────────────┴───────────────────────────────────┐ │
│  │                    Data Service Layer                      │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │ │
│  │  │ Cache   │ │ Fetch   │ │ CORS    │ │ Rate Limiting   │  │ │
│  │  │ Manager │ │ Handler │ │ Proxy   │ │ Controller      │  │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL APIs                              │
├─────────────┬─────────────┬─────────────┬─────────────┬────────┤
│  Twelve     │  Finnhub    │  Alpha      │  Yahoo      │ Claude │
│  Data       │             │  Vantage    │  Finance    │ AI     │
└─────────────┴─────────────┴─────────────┴─────────────┴────────┘
```

### 2.2 Component Architecture

```
App (StockAnalyzer)
├── Navigation
├── Views
│   ├── AnalyzeView
│   │   ├── CandlestickChart
│   │   │   ├── Price Panel (Main)
│   │   │   ├── RSI Panel (Optional)
│   │   │   ├── MACD Panel (Optional)
│   │   │   └── Volume Overlay
│   │   ├── QuoteCard
│   │   ├── NewsPanel
│   │   └── AIAnalysisPanel
│   ├── DiscoverView (Scanner)
│   │   ├── FilterPanel
│   │   ├── ScanResultsTable
│   │   ├── DetailPanel (Inline Expandable)
│   │   └── ResearchChat
│   └── SettingsView
│       └── APIKeyManager
└── Modals
    └── SettingsModal
```

---

## 3. Technology Stack

### 3.1 Frontend Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI Framework |
| Vite | 5.x | Build Tool & Dev Server |
| Recharts | 2.x | Charting Library |
| Lucide React | 0.x | Icon Library |

### 3.2 Runtime Environment

- **Target:** Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **JavaScript:** ES2020+ features
- **No Backend Required:** All processing client-side

### 3.3 Build Configuration

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
})
```

---

## 4. Data Flow

### 4.1 Stock Data Fetching Flow

```
User Request
     │
     ▼
┌─────────────────┐
│ Check Cache     │──── Cache Hit ────▶ Return Cached Data
└────────┬────────┘
         │ Cache Miss
         ▼
┌─────────────────┐
│ Determine       │
│ Timeframe Type  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
Intraday    Daily+
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│Twelve   │ │Polygon  │
│Data     │ │         │
└────┬────┘ └────┬────┘
     │ Fail      │ Fail
     ▼           ▼
┌─────────┐ ┌─────────┐
│Alpha    │ │Finnhub  │
│Vantage  │ │         │
└────┬────┘ └────┬────┘
     │           │
     └─────┬─────┘
           │ All Fail
           ▼
    ┌─────────────┐
    │Yahoo Finance│
    │(CORS Proxy) │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │ Cache Result│
    └──────┬──────┘
           │
           ▼
      Return Data
```

### 4.2 Scanner Analysis Flow

```
Scan Initiated
     │
     ▼
┌──────────────────┐
│ Get Stock List   │
│ (DOW30/NASDAQ/   │
│  SP500/Watchlist)│
└────────┬─────────┘
         │
         ▼
    ┌────────────┐
    │ For Each   │◀──────────────────┐
    │ Symbol     │                   │
    └────┬───────┘                   │
         │                           │
         ▼                           │
┌──────────────────┐                 │
│ Fetch Real Data  │                 │
│ (or Sample Data) │                 │
└────────┬─────────┘                 │
         │                           │
         ▼                           │
┌──────────────────┐                 │
│ Calculate All    │                 │
│ Indicators       │                 │
│ - RSI            │                 │
│ - MACD           │                 │
│ - Bollinger      │                 │
│ - ATR            │                 │
│ - SMAs           │                 │
└────────┬─────────┘                 │
         │                           │
         ▼                           │
┌──────────────────┐                 │
│ Detect Setups    │                 │
│ (8 Pattern Types)│                 │
└────────┬─────────┘                 │
         │                           │
         ▼                           │
┌──────────────────┐                 │
│ Calculate        │                 │
│ Confidence Score │                 │
└────────┬─────────┘                 │
         │                           │
         ▼                           │
┌──────────────────┐                 │
│ Generate Trade   │                 │
│ Recommendation   │                 │
└────────┬─────────┘                 │
         │                           │
         ▼                           │
┌──────────────────┐                 │
│ Apply Filters    │                 │
└────────┬─────────┘                 │
         │                           │
         ▼                           │
    More Symbols? ──── Yes ──────────┘
         │
         No
         │
         ▼
┌──────────────────┐
│ Sort by          │
│ Confidence       │
└────────┬─────────┘
         │
         ▼
   Display Results
```

---

## 5. API Integrations

### 5.1 Financial Data APIs

#### Twelve Data API

| Attribute | Value |
|-----------|-------|
| Base URL | `https://api.twelvedata.com` |
| Authentication | API Key (query param) |
| Rate Limit | 800 requests/day (free tier) |
| Best For | Intraday data, real-time quotes |

**Endpoints Used:**
```
GET /time_series?symbol={symbol}&interval={interval}&outputsize={size}&apikey={key}
```

**Interval Mapping:**
- 1D → 5min
- 1W → 15min
- 1M → 1h
- 3M → 1day
- 1Y → 1day

#### Finnhub API

| Attribute | Value |
|-----------|-------|
| Base URL | `https://finnhub.io/api/v1` |
| Authentication | API Key (query param) |
| Rate Limit | 60 requests/minute (free tier) |
| Best For | Daily candles, company profiles, news |

**Endpoints Used:**
```
GET /stock/candle?symbol={symbol}&resolution={res}&from={from}&to={to}&token={key}
GET /quote?symbol={symbol}&token={key}
GET /stock/profile2?symbol={symbol}&token={key}
GET /company-news?symbol={symbol}&from={from}&to={to}&token={key}
```

**Resolution Mapping:**
- 3M → D (daily)
- 1Y → D (daily)
- ALL → M (monthly)

#### Alpha Vantage API

| Attribute | Value |
|-----------|-------|
| Base URL | `https://www.alphavantage.co/query` |
| Authentication | API Key (query param) |
| Rate Limit | 25 requests/day (free tier) |
| Best For | Historical data, backup source |

**Endpoints Used:**
```
GET ?function=TIME_SERIES_INTRADAY&symbol={symbol}&interval={interval}&outputsize=full&apikey={key}
GET ?function=TIME_SERIES_DAILY&symbol={symbol}&outputsize=full&apikey={key}
```

#### Polygon.io API

| Attribute | Value |
|-----------|-------|
| Base URL | `https://api.polygon.io/v2` |
| Authentication | API Key (query param) |
| Rate Limit | Varies by plan |
| Best For | Daily historical data |

**Endpoints Used:**
```
GET /aggs/ticker/{symbol}/range/{multiplier}/{timespan}/{from}/{to}?apiKey={key}
```

#### Yahoo Finance (Fallback)

| Attribute | Value |
|-----------|-------|
| Base URL | `https://query1.finance.yahoo.com` |
| Authentication | None |
| Access Method | Via CORS Proxy |
| Best For | Free fallback, broad coverage |

**Endpoints Used:**
```
GET /v8/finance/chart/{symbol}?interval={interval}&range={range}
GET /v10/finance/quoteSummary/{symbol}?modules=price,summaryDetail
```

### 5.2 AI Integration

#### Claude API (Anthropic)

| Attribute | Value |
|-----------|-------|
| Base URL | `https://api.anthropic.com/v1` |
| Authentication | API Key (x-api-key header) |
| Model | claude-sonnet-4-20250514 |
| Purpose | Deep analysis, trade rationale |

**Request Format:**
```javascript
{
  model: "claude-sonnet-4-20250514",
  max_tokens: 1500,
  messages: [{ role: "user", content: prompt }]
}
```

### 5.3 CORS Proxy Strategy

Since Yahoo Finance doesn't support CORS, requests are routed through public proxies:

```javascript
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest='
];
```

**Failover Logic:**
1. Try first proxy with 10-second timeout
2. On failure, try next proxy
3. Continue until success or all proxies exhausted

---

## 6. Core Modules

### 6.1 Chart Module (CandlestickChart)

**Responsibilities:**
- Render OHLC candlestick data
- Display optional indicator panels (RSI, MACD)
- Handle indicator overlays (Bollinger Bands, SMAs)
- Manage multi-panel synchronized layouts

**Panel Configuration:**
```javascript
const panelConfig = {
  main: { height: 400, domain: [minPrice, maxPrice] },
  rsi: { height: 100, domain: [0, 100] },
  macd: { height: 100, domain: 'auto' }
};
```

**Indicator Toggles:**
- BB (Bollinger Bands) - purple overlay on main chart
- RSI - separate panel below (14-period)
- MACD - separate panel with histogram (12/26/9)
- VOL - volume bars on main chart
- S/R - support/resistance levels
- SMA - moving averages (20/50/200)

### 6.2 Scanner Module (DiscoverView)

**Responsibilities:**
- Manage stock universe selection
- Execute batch technical analysis
- Apply multi-criteria filters
- Generate trade recommendations

**Filter Categories:**
- Sectors (Technology, Healthcare, Finance, etc.)
- Timeframes (Short-term, Swing, Long-term)
- Risk Levels (Conservative, Moderate, Aggressive)
- Signal Types (Bullish, Bearish, Neutral)
- Setup Types (Breakout, Pullback, Squeeze, etc.)
- Minimum Confidence (0-100 slider)

### 6.3 Analysis Module

**Responsibilities:**
- Calculate technical indicators
- Detect trading setups/patterns
- Compute confidence scores
- Generate trade parameters

---

## 7. Technical Indicators

### 7.1 RSI (Relative Strength Index)

**Implementation:** Wilder's Smoothing Method

```javascript
function calculateRSIArray(data, period = 14) {
  // Calculate price changes
  // Separate gains and losses
  // Apply Wilder's smoothed moving average
  // RSI = 100 - (100 / (1 + RS))
  // where RS = Avg Gain / Avg Loss
}
```

**Interpretation:**
- RSI > 70: Overbought
- RSI < 30: Oversold
- RSI 30-70: Neutral

### 7.2 MACD (Moving Average Convergence Divergence)

**Parameters:** 12-period EMA, 26-period EMA, 9-period Signal

```javascript
function calculateMACDFull(data) {
  const ema12 = calculateEMAArray(data, 12);
  const ema26 = calculateEMAArray(data, 26);
  const macdLine = ema12 - ema26;
  const signalLine = EMA(macdLine, 9);
  const histogram = macdLine - signalLine;
  return { macd: macdLine, signal: signalLine, histogram };
}
```

**Interpretation:**
- MACD > Signal: Bullish momentum
- MACD < Signal: Bearish momentum
- Histogram expansion: Strengthening trend

### 7.3 Bollinger Bands

**Parameters:** 20-period SMA, 2 standard deviations

```javascript
function calculateBollingerBands(data, period = 20, stdDev = 2) {
  const middle = SMA(close, period);
  const std = standardDeviation(close, period);
  const upper = middle + (stdDev * std);
  const lower = middle - (stdDev * std);
  return { upper, middle, lower };
}
```

**Interpretation:**
- Price near upper band: Potential overbought
- Price near lower band: Potential oversold
- Band squeeze: Low volatility, potential breakout

### 7.4 ATR (Average True Range)

**Parameters:** 14-period

```javascript
function calculateATR(data, period = 14) {
  // True Range = max(high-low, |high-prevClose|, |low-prevClose|)
  // ATR = Wilder's smoothed average of TR
}
```

**Usage:**
- Stop loss calculation
- Position sizing
- Volatility assessment

### 7.5 Moving Averages

**Types Implemented:**
- SMA (Simple Moving Average)
- EMA (Exponential Moving Average)

**Periods:** 20, 50, 200

---

## 8. State Management

### 8.1 React State (useState)

All application state is managed using React's `useState` hook. No external state management library is used.

**Key State Variables:**

```javascript
// Main App State
const [ticker, setTicker] = useState('AAPL');
const [timeRange, setTimeRange] = useState('1M');
const [chartData, setChartData] = useState([]);
const [apiKeys, setApiKeys] = useState({});

// Scanner State (DiscoverView)
const [scanResults, setScanResults] = useState([]);
const [filters, setFilters] = useState({
  sectors: [],
  timeframes: [],
  riskLevels: [],
  signalTypes: [],
  setupTypes: [],
  minConfidence: 60
});

// UI State
const [isLoading, setIsLoading] = useState(false);
const [selectedResult, setSelectedResult] = useState(null);
```

### 8.2 Local Storage Persistence

**Persisted Data:**
- API Keys (encrypted with base64)
- Watchlist/Favorites
- Scanner results (with timestamp)
- User preferences

**Storage Keys:**
```javascript
const STORAGE_KEYS = {
  API_KEYS: 'stockAnalyzer_apiKeys',
  FAVORITES: 'stockAnalyzer_favorites',
  DISCOVER_RESULTS: 'stockAnalyzer_discoverResults',
  POSITIONS: 'stockAnalyzer_positions'
};
```

---

## 9. Caching Strategy

### 9.1 In-Memory Cache

**Implementation:** JavaScript Map object

```javascript
const stockDataCache = new Map();

// Cache structure
{
  key: `${symbol}_${timeRange}`,
  value: {
    data: fetchResult,
    timestamp: Date.now()
  }
}
```

### 9.2 Cache Duration

| Data Type | TTL |
|-----------|-----|
| Intraday (1D, 1W, 1M) | 2 minutes |
| Daily+ (3M, 1Y, ALL) | 5 minutes |

### 9.3 Cache Size Management

- Maximum entries: 50
- Eviction policy: FIFO (oldest entry removed when limit reached)

---

## 10. Security Considerations

### 10.1 API Key Storage

- Keys stored in localStorage with basic encoding
- Never transmitted to third-party services (except intended APIs)
- Keys can be cleared via Settings

### 10.2 CORS Handling

- Public CORS proxies used only for Yahoo Finance
- API keys never sent through CORS proxies
- Direct API calls used when possible

### 10.3 Content Security

- No external scripts loaded dynamically
- All data sanitized before display
- No user-generated content stored server-side

---

## 11. Performance Optimizations

### 11.1 Rendering Optimizations

- React.Fragment used for table row groupings
- Conditional rendering for indicator panels
- Memoization of expensive calculations (implicit via state)

### 11.2 Data Fetching Optimizations

- Request deduplication via caching
- Staggered API calls in scanner (800ms delay)
- Abort signals for timed-out requests (10s timeout)

### 11.3 Chart Optimizations

- Data point limiting for large datasets
- Responsive SVG rendering via Recharts
- Dynamic height adjustment based on active panels

---

## 12. Error Handling

### 12.1 API Error Handling

```javascript
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  // Process data
} catch (error) {
  console.error('API Error:', error.message);
  // Try next fallback source
}
```

### 12.2 Fallback Chain

1. Primary API (based on timeframe)
2. Secondary APIs
3. Yahoo Finance (CORS proxy)
4. Sample data generation (last resort)

### 12.3 User Feedback

- Loading states with progress indicators
- Error messages in console (developer)
- "Simulated data" warnings for users
- API configuration prompts

---

## Appendix A: File Structure

```
stock-analyzer-project/
├── docs/
│   ├── TECHNICAL.md
│   ├── REQUIREMENTS.md
│   └── USER_MANUAL.md
├── public/
├── src/
│   ├── App.jsx          # Main application (9000+ lines)
│   └── main.jsx         # Entry point
├── .env.example         # Environment variable template
├── index.html           # HTML entry point
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── README.md            # Quick start guide
```

## Appendix B: Environment Variables

```bash
# Financial Data APIs
VITE_TWELVE_DATA_API_KEY=your_key_here
VITE_FINNHUB_API_KEY=your_key_here
VITE_ALPHA_VANTAGE_API_KEY=your_key_here
VITE_POLYGON_API_KEY=your_key_here

# AI Analysis
VITE_CLAUDE_API_KEY=your_key_here

# News
VITE_NEWSAPI_KEY=your_key_here
```

---

*Document End*

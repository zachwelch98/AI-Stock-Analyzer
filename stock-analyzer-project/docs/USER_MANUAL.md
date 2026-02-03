# 📈 Stock Analyzer Pro
## User Guide & Quick Start Manual

---

<div align="center">

**Your Personal Stock Analysis Assistant**

*Technical Analysis • Pattern Detection • AI Insights • Trade Recommendations*

</div>

---

## 📑 Table of Contents

1. [Welcome](#-welcome)
2. [Getting Started](#-getting-started)
3. [Setting Up API Keys](#-setting-up-api-keys)
4. [Using the Analyze View](#-using-the-analyze-view)
5. [Using the Stock Scanner](#-using-the-stock-scanner)
6. [Understanding Trade Recommendations](#-understanding-trade-recommendations)
7. [AI Deep Dive Analysis](#-ai-deep-dive-analysis)
8. [Managing Your Watchlist](#-managing-your-watchlist)
9. [Tips & Best Practices](#-tips--best-practices)
10. [Troubleshooting](#-troubleshooting)
11. [Glossary](#-glossary)

---

## 👋 Welcome

Stock Analyzer Pro is a powerful web application that helps you analyze stocks using technical indicators, detect trading patterns, and receive AI-powered insights. Whether you're a beginner learning technical analysis or an experienced trader looking for trade ideas, this tool is designed to make stock analysis accessible and actionable.

### What Can You Do?

| Feature | Description |
|---------|-------------|
| 📊 **Chart Analysis** | View interactive candlestick charts with multiple timeframes |
| 📉 **Technical Indicators** | Apply RSI, MACD, Bollinger Bands, and more |
| 🔍 **Stock Scanner** | Scan hundreds of stocks for trading setups |
| 🤖 **AI Analysis** | Get detailed analysis powered by Claude AI |
| 💡 **Trade Ideas** | Receive entry, stop loss, and target recommendations |
| ⭐ **Watchlist** | Track your favorite stocks |

---

## 🚀 Getting Started

### Step 1: Install Dependencies

Open your terminal and navigate to the project folder:

```bash
cd stock-analyzer-project
npm install
```

### Step 2: Start the Application

```bash
npm run dev
```

### Step 3: Open in Browser

The application will automatically open, or you can visit:

```
http://localhost:5173
```

### What You'll See

When the application loads, you'll see the **Analyze** view with a stock chart. The interface has three main sections:

```
┌──────────────────────────────────────────────────────┐
│  📊 Stock Analyzer Pro    [Analyze] [Discover] [⚙️]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Search: [___________] [🔍]    [1D][1W][1M][3M][1Y] │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │                                                │ │
│  │              CANDLESTICK CHART                 │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  [BB] [RSI] [MACD] [VOL] [S/R] [SMA] [AI]          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🔑 Setting Up API Keys

API keys enable the application to fetch real market data. Without them, you'll see simulated data (marked with a yellow "DEMO" badge).

### Why Do I Need API Keys?

- **Real-time prices** instead of simulated data
- **More reliable data** from professional sources
- **AI analysis** features (requires Claude API key)

### Getting Free API Keys

All these providers offer **free tiers** that are sufficient for personal use:

#### 1. Twelve Data (Recommended for Price Data)

| Detail | Value |
|--------|-------|
| 🌐 Website | [twelvedata.com](https://twelvedata.com) |
| 💰 Free Tier | 800 API calls/day |
| ⏱️ Best For | Intraday data |

**Steps:**
1. Go to [twelvedata.com](https://twelvedata.com)
2. Click "Get Started Free"
3. Create an account
4. Copy your API key from the dashboard

#### 2. Finnhub (Good for Daily Data)

| Detail | Value |
|--------|-------|
| 🌐 Website | [finnhub.io](https://finnhub.io) |
| 💰 Free Tier | 60 calls/minute |
| ⏱️ Best For | Daily candles, company info |

**Steps:**
1. Go to [finnhub.io](https://finnhub.io)
2. Click "Get free API key"
3. Register with your email
4. Copy your API key

#### 3. Claude AI (For AI Analysis)

| Detail | Value |
|--------|-------|
| 🌐 Website | [console.anthropic.com](https://console.anthropic.com) |
| 💰 Free Tier | Pay-as-you-go (very affordable) |
| ⏱️ Best For | Deep dive analysis |

**Steps:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an Anthropic account
3. Go to API Keys section
4. Generate a new key

### Adding Keys to the Application

1. Click the **⚙️ Settings** icon in the top navigation
2. Find the API Keys section
3. Paste each key into the corresponding field
4. Click **Save**

```
┌─────────────────────────────────────────┐
│          ⚙️ API Settings                │
├─────────────────────────────────────────┤
│                                         │
│  Twelve Data API Key                    │
│  [____________________________] ✓       │
│                                         │
│  Finnhub API Key                        │
│  [____________________________] ✓       │
│                                         │
│  Claude API Key                         │
│  [____________________________] ✓       │
│                                         │
│            [💾 Save Settings]           │
│                                         │
└─────────────────────────────────────────┘
```

> 💡 **Tip:** You only need ONE data API key (Twelve Data OR Finnhub) to get started. The Claude key is only needed for AI features.

---

## 📊 Using the Analyze View

The Analyze view is your main workspace for studying individual stocks.

### Searching for a Stock

1. Type a ticker symbol in the search box (e.g., `AAPL`, `TSLA`, `MSFT`)
2. Press Enter or click the search icon
3. The chart will load with the stock's data

### Changing Timeframes

Click any timeframe button to change the chart period:

| Button | Period | Candle Size | Best For |
|--------|--------|-------------|----------|
| **1D** | 1 Day | 5 minutes | Day trading |
| **1W** | 1 Week | 15 minutes | Short-term |
| **1M** | 1 Month | 1 hour | Swing trading |
| **3M** | 3 Months | 1 day | Position trading |
| **1Y** | 1 Year | 1 day | Long-term trends |
| **ALL** | All History | 1 month | Big picture |

### Using Technical Indicators

Toggle indicators on/off by clicking the buttons below the chart:

#### 📈 BB (Bollinger Bands)
- Shows volatility range around price
- **Purple shaded area** = normal price range
- Price near upper band = potentially overbought
- Price near lower band = potentially oversold

#### 📊 RSI (Relative Strength Index)
- Momentum indicator (0-100 scale)
- **Above 70** = Overbought (may pull back)
- **Below 30** = Oversold (may bounce)
- Shows in a separate panel below the chart

#### 📉 MACD
- Trend and momentum indicator
- **Blue line** = MACD line
- **Orange line** = Signal line
- **Histogram** = Difference between lines
- Crossovers signal potential trend changes

#### 📊 VOL (Volume)
- Shows trading activity
- **Green bars** = Buying pressure
- **Red bars** = Selling pressure
- High volume confirms price moves

#### 📍 S/R (Support/Resistance)
- Shows key price levels
- **Green line** = Support (floor)
- **Red line** = Resistance (ceiling)

#### 〰️ SMA (Moving Averages)
- Trend direction indicators
- **20 SMA** = Short-term trend
- **50 SMA** = Medium-term trend
- **200 SMA** = Long-term trend

---

## 🔍 Using the Stock Scanner

The Scanner (Discover view) analyzes multiple stocks at once to find trading opportunities.

### Accessing the Scanner

Click **"Discover"** in the top navigation bar.

### Step 1: Select Stocks to Scan

Choose which stocks to analyze:

| Option | Stocks Included |
|--------|-----------------|
| **Popular** | ~30 most traded stocks |
| **DOW 30** | 30 Dow Jones components |
| **NASDAQ 100** | 100 largest NASDAQ stocks |
| **S&P 500** | 500 largest US stocks |
| **Watchlist** | Your saved stocks |
| **Manual** | Enter any ticker |

### Step 2: Set Filters (Optional)

Narrow your results by setting filters:

```
┌─────────────────────────────────────────────────────┐
│  FILTERS                                            │
├─────────────────────────────────────────────────────┤
│  Sectors:    [Tech] [Health] [Finance] [Energy]     │
│  Timeframe:  [Short] [Swing] [Long]                 │
│  Risk:       [Conservative] [Moderate] [Aggressive] │
│  Signal:     [Bullish] [Bearish] [Neutral]          │
│  Setup:      [Breakout] [Pullback] [Squeeze] ...    │
│  Min Confidence: [====60%====]                      │
└─────────────────────────────────────────────────────┘
```

### Step 3: Run the Scan

Click the **"Scan"** button and wait for results.

> ⏱️ Scanning takes about 1 second per stock to fetch data and analyze.

### Step 4: Review Results

Results appear in a table sorted by confidence:

```
┌──────────┬────────┬────────┬───────┬─────────────┐
│ Symbol   │ Signal │ Score  │ Setup │ Summary     │
├──────────┼────────┼────────┼───────┼─────────────┤
│ AAPL 🟢  │ ▲ BULL │  85    │ Breakout │ RSI 55... │
│ TSLA 🟢  │ ▲ BULL │  78    │ Pullback │ MACD+...  │
│ NVDA 🟡  │ — NEU  │  72    │ Squeeze  │ BB tight  │
└──────────┴────────┴────────┴───────┴─────────────┘
```

### Step 5: Expand for Details

Click any row to see the full trade recommendation:

```
┌─────────────────────────────────────────────────────┐
│  STOCK TRADE                                        │
│  ↑ BUY                                              │
│  85% confidence · Swing · Moderate risk             │
│                                                     │
│  Entry        Target (+5.2%)    Stop (-2.1%)        │
│  $185.50      $195.20           $181.60             │
│                                                     │
│  ANALYSIS                                           │
│  RSI at 55.3 shows healthy momentum. MACD is        │
│  positive, confirming bullish trend. Volume 1.4x    │
│  average indicates institutional interest.          │
│                                                     │
│  [🔮 AI Deep Dive]  [📊 Chart]  [⭐ Watch]          │
└─────────────────────────────────────────────────────┘
```

---

## 💡 Understanding Trade Recommendations

### Trade Direction

| Symbol | Meaning | Action |
|--------|---------|--------|
| **↑ BUY** | Bullish stock trade | Buy shares |
| **↓ SHORT** | Bearish stock trade | Short sell |
| **↑ CALL** | Bullish options trade | Buy call option |
| **↓ PUT** | Bearish options trade | Buy put option |
| **— WAIT** | No clear setup | Don't trade |

### Price Levels

| Level | Description |
|-------|-------------|
| **Entry** | Suggested buy/sell price |
| **Target** | Take profit level |
| **Stop** | Stop loss level |
| **R:R** | Risk-to-Reward ratio |

### What Makes a Good Trade?

✅ **Confidence > 70%** - Strong technical alignment  
✅ **R:R > 2:1** - Reward is at least 2x the risk  
✅ **Multiple setups** - More than one pattern detected  
✅ **LIVE data** - Real market prices, not simulated

### Options vs Stocks

The system recommends **options** when:
- Volatility is high (more potential for movement)
- Timeframe is short-term
- Risk can be clearly defined

Options include:
- **Strike Price** - The contract price level
- **Expiration** - When the option expires

---

## 🤖 AI Deep Dive Analysis

Get detailed analysis powered by Claude AI.

### How to Use

1. Run a scan or select a stock
2. Click **"AI Deep Dive"** button
3. Wait for analysis (10-20 seconds)
4. Read the detailed report in the chat panel

### What You'll Get

The AI analyzes:
- 📊 Technical indicator interpretation
- 📰 Recent news and events
- 💪 Company strengths and weaknesses
- ⚠️ Risk factors to consider
- 🎯 Specific trade recommendations

### Example Output

```
┌─────────────────────────────────────────────────────┐
│  🤖 AI Analysis: AAPL                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  TECHNICAL OVERVIEW                                 │
│  Apple is showing bullish momentum with RSI at 58,  │
│  indicating room for upside without being           │
│  overbought. The stock recently bounced off the     │
│  50-day moving average, a common support level.     │
│                                                     │
│  FUNDAMENTAL CONTEXT                                │
│  Strong iPhone sales and growing Services revenue   │
│  provide fundamental support. Recent AI             │
│  announcements have renewed investor interest.      │
│                                                     │
│  RISK FACTORS                                       │
│  - China exposure remains a concern                 │
│  - High valuation relative to growth                │
│  - Broader market volatility                        │
│                                                     │
│  RECOMMENDATION                                     │
│  Consider a swing trade with entry near $185,       │
│  targeting $195 with a stop at $180.                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

> ⚠️ **Note:** AI analysis requires a Claude API key configured in Settings.

---

## ⭐ Managing Your Watchlist

Keep track of stocks you're interested in.

### Adding Stocks

**Method 1: From Chart View**
- Click the ⭐ star icon next to the stock symbol

**Method 2: From Scanner Results**
- Click "Watch" button in the expanded detail panel

**Method 3: Manual Entry**
- Go to Discover → Select "Watchlist" source
- Enter ticker symbols manually

### Viewing Your Watchlist

1. Go to **Discover** view
2. In Stock Source, select **"Watchlist"**
3. Click **Scan** to analyze all watched stocks

### Removing Stocks

Click the filled ⭐ star icon again to remove from watchlist.

---

## 💪 Tips & Best Practices

### For Better Results

1. **Use Real Data**
   - Configure at least one API key
   - Look for "LIVE" badge on results

2. **Don't Over-Filter**
   - Start with minimal filters
   - Narrow down only if too many results

3. **Verify with Charts**
   - Always click "View Chart" before trading
   - Confirm the setup visually

4. **Consider Multiple Timeframes**
   - A setup on 1D might conflict with 1M
   - Align your trades with the bigger trend

### Risk Management

| Rule | Application |
|------|-------------|
| **2% Rule** | Never risk more than 2% of account per trade |
| **Use Stops** | Always set stop loss orders |
| **Position Size** | Use the calculated position sizes |
| **Diversify** | Don't put all capital in one trade |

### When NOT to Trade

🚫 Signal is NEUTRAL or WAIT  
🚫 Confidence below 60%  
🚫 R:R ratio below 1.5  
🚫 Using DEMO data for real trades  
🚫 Against the major trend  

---

## 🔧 Troubleshooting

### Common Issues

#### "No data available" or Blank Chart

**Causes:**
- Invalid ticker symbol
- API rate limit reached
- Network connection issue

**Solutions:**
1. Check the ticker symbol spelling
2. Wait a few minutes and try again
3. Check your internet connection
4. Add more API keys for fallback

#### All Results Show "DEMO" Badge

**Cause:** No API keys configured or all APIs failing

**Solutions:**
1. Go to Settings and add API keys
2. Verify keys are entered correctly
3. Check if API providers are operational

#### AI Deep Dive Not Working

**Cause:** Missing or invalid Claude API key

**Solutions:**
1. Get a Claude API key from Anthropic
2. Add it in Settings
3. Ensure you have API credits

#### Scanner Taking Too Long

**Cause:** Scanning many stocks with API rate limits

**Solutions:**
1. Scan fewer stocks (use Popular instead of S&P 500)
2. Add more API keys for faster fallbacks
3. Use Watchlist for focused scanning

#### Chart Not Updating

**Solutions:**
1. Change timeframe and change back
2. Refresh the browser
3. Clear cache: Settings → Clear Data

---

## 📚 Glossary

| Term | Definition |
|------|------------|
| **ATR** | Average True Range - measures volatility |
| **Bollinger Bands** | Volatility indicator showing price range |
| **Bullish** | Expecting price to go up |
| **Bearish** | Expecting price to go down |
| **Breakout** | Price moving above resistance |
| **Candlestick** | Chart type showing OHLC data |
| **Confidence** | Score (0-100) of setup strength |
| **MACD** | Trend/momentum indicator |
| **Overbought** | RSI > 70, may be due for pullback |
| **Oversold** | RSI < 30, may be due for bounce |
| **Pullback** | Temporary price decline in uptrend |
| **Resistance** | Price level where selling increases |
| **RSI** | Relative Strength Index (0-100) |
| **Setup** | Pattern indicating trade opportunity |
| **SMA** | Simple Moving Average |
| **Squeeze** | Low volatility, potential breakout |
| **Stop Loss** | Price to exit losing trade |
| **Support** | Price level where buying increases |
| **Swing Trade** | Trade held for days to weeks |
| **Take Profit** | Price to exit winning trade |
| **Ticker** | Stock symbol (e.g., AAPL) |
| **Volume** | Number of shares traded |

---

## 📞 Support

### Getting Help

- 📖 Review this documentation
- 🐛 Check the Troubleshooting section
- 💻 Inspect browser console for errors (F12 → Console)

### Disclaimer

> ⚠️ **Important:** Stock Analyzer Pro is for educational and informational purposes only. It does not constitute financial advice. Always do your own research and consult with a qualified financial advisor before making investment decisions. Past performance does not guarantee future results.

---

<div align="center">

**Happy Trading! 📈**

*Built with ❤️ using React, Recharts, and Claude AI*

</div>

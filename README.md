# 📈 Stock Analyzer Pro

A powerful web-based stock analysis application featuring interactive charts, technical indicators, pattern detection, and AI-powered trade recommendations.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- **Interactive Charts** - Candlestick charts with multiple timeframes (1D to ALL)
- **Technical Indicators** - RSI, MACD, Bollinger Bands, Volume, Moving Averages
- **Stock Scanner** - Scan 500+ stocks for trading setups
- **Pattern Detection** - 8 setup types (Breakout, Pullback, Squeeze, etc.)
- **AI Analysis** - Deep dive analysis powered by Claude AI
- **Trade Recommendations** - Entry, stop loss, take profit levels
- **Options Support** - Strike price and expiration suggestions
- **Watchlist** - Track your favorite stocks

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Clone or extract the project
cd stock-analyzer-project

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will open at `http://localhost:5173`

### API Keys (Optional but Recommended)

For real market data, add free API keys in Settings:

| Provider | Free Tier | Sign Up |
|----------|-----------|---------|
| Twelve Data | 800 calls/day | [twelvedata.com](https://twelvedata.com) |
| Finnhub | 60 calls/min | [finnhub.io](https://finnhub.io) |
| Claude AI | Pay-as-you-go | [console.anthropic.com](https://console.anthropic.com) |

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [User Manual](docs/USER_MANUAL.md) | Step-by-step usage guide |
| [Technical Spec](docs/TECHNICAL.md) | Architecture & API reference |
| [Requirements](docs/REQUIREMENTS.md) | Software requirements specification |

---

## 🎯 Usage Overview

### Analyze View
Analyze individual stocks with interactive charts and indicators.

### Discover View (Scanner)
Scan multiple stocks to find trading opportunities:
1. Select stock universe (Popular, DOW 30, NASDAQ 100, S&P 500)
2. Set filters (optional)
3. Click **Scan**
4. Click any result to see trade recommendations

### Trade Recommendations
Each scan result includes:
- Trade direction (BUY/SHORT/CALL/PUT)
- Entry, Target, and Stop Loss prices
- Risk:Reward ratio
- Confidence score (0-100)
- AI-generated analysis rationale

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite
- **Charts:** Recharts
- **Icons:** Lucide React
- **Data:** Yahoo Finance, Twelve Data, Finnhub, Alpha Vantage, Polygon
- **AI:** Claude API (Anthropic)

---

## 📁 Project Structure

```
stock-analyzer-project/
├── docs/
│   ├── TECHNICAL.md      # Technical architecture
│   ├── REQUIREMENTS.md   # Software requirements
│   └── USER_MANUAL.md    # User guide
├── src/
│   ├── App.jsx           # Main application
│   └── main.jsx          # Entry point
├── .env.example          # Environment template
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and add your keys:

```bash
VITE_TWELVE_DATA_API_KEY=your_key
VITE_FINNHUB_API_KEY=your_key
VITE_CLAUDE_API_KEY=your_key
```

Or configure keys directly in the application's Settings panel.

---

## ⚠️ Disclaimer

This application is for **educational and informational purposes only**. It does not constitute financial advice. Always do your own research and consult with a qualified financial advisor before making investment decisions.

---

## 📄 License

MIT License - see LICENSE file for details.

---

<div align="center">
Made with ❤️ using React and Claude AI
</div>

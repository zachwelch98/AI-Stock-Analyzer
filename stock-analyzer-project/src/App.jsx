import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ComposedChart, Bar, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Search, BarChart2, FileText, Cpu, AlertCircle, RefreshCw, Wifi, WifiOff, ExternalLink, Settings, X, Key, Check, Eye, EyeOff, Upload, Download, FileUp, Star, GripVertical, Trash2, LayoutDashboard, List, Plus, Copy, Share2, Clock, FileDown, HelpCircle, Zap, MessageSquare } from 'lucide-react';

// ============================================================================
// DATE FORMATTING - Must be defined before data fetching functions
// ============================================================================

const formatDate = (date, timeRange) => {
  if (timeRange === '1D') {
    // 5-minute candles: Show time only (e.g., "10:30")
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
  } else if (timeRange === '1W' || timeRange === '1M') {
    // Days: Show Month/Day (e.g., "1/15")
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } else if (timeRange === '3M') {
    // 3 months: Show Month Day (e.g., "Jan 15") for better granularity
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (timeRange === '1Y') {
    // 1 year: Show abbreviated month + day (e.g., "Jan 15")
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (timeRange === 'ALL') {
    // Years: Show year only (e.g., "2024")
    return date.getFullYear().toString();
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

const getStoredApiKeys = () => {
  try {
    const stored = localStorage.getItem('stockscope_api_keys');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading API keys:', e);
  }
  return {
    claude: '',
    alphaVantage: '',
    finnhub: '',
    twelveData: '',
    newsApi: '',
    polygon: ''
  };
};

const saveApiKeys = (keys) => {
  try {
    localStorage.setItem('stockscope_api_keys', JSON.stringify(keys));
    return true;
  } catch (e) {
    console.error('Error saving API keys:', e);
    return false;
  }
};

// ============================================================================
// FAVORITES / MY POSITIONS MANAGEMENT
// ============================================================================

const MAX_FAVORITES = 25;

const getStoredFavorites = () => {
  try {
    const stored = localStorage.getItem('stockscope_favorites');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading favorites:', e);
  }
  return [];
};

const saveFavorites = (favorites) => {
  try {
    localStorage.setItem('stockscope_favorites', JSON.stringify(favorites.slice(0, MAX_FAVORITES)));
    return true;
  } catch (e) {
    console.error('Error saving favorites:', e);
    return false;
  }
};

// ============================================================================
// AI DISCOVER - STOCK LISTS & MANAGEMENT
// ============================================================================

// Dow 30 stocks
const DOW_30 = [
  'AAPL', 'AMGN', 'AXP', 'BA', 'CAT', 'CRM', 'CSCO', 'CVX', 'DIS', 'DOW',
  'GS', 'HD', 'HON', 'IBM', 'INTC', 'JNJ', 'JPM', 'KO', 'MCD', 'MMM',
  'MRK', 'MSFT', 'NKE', 'PG', 'TRV', 'UNH', 'V', 'VZ', 'WBA', 'WMT'
];

// NASDAQ 100 stocks (top components)
const NASDAQ_100 = [
  'AAPL', 'ABNB', 'ADBE', 'ADI', 'ADP', 'ADSK', 'AEP', 'AMAT', 'AMD', 'AMGN',
  'AMZN', 'ANSS', 'ARM', 'ASML', 'AVGO', 'AZN', 'BIIB', 'BKNG', 'BKR', 'CDNS',
  'CDW', 'CEG', 'CHTR', 'CMCSA', 'COST', 'CPRT', 'CRWD', 'CSCO', 'CSGP', 'CSX',
  'CTAS', 'CTSH', 'DDOG', 'DLTR', 'DXCM', 'EA', 'EXC', 'FANG', 'FAST', 'FTNT',
  'GEHC', 'GFS', 'GILD', 'GOOG', 'GOOGL', 'HON', 'IDXX', 'ILMN', 'INTC', 'INTU',
  'ISRG', 'KDP', 'KHC', 'KLAC', 'LRCX', 'LULU', 'MAR', 'MCHP', 'MDB', 'MDLZ',
  'MELI', 'META', 'MNST', 'MRNA', 'MRVL', 'MSFT', 'MU', 'NFLX', 'NVDA', 'NXPI',
  'ODFL', 'ON', 'ORLY', 'PANW', 'PAYX', 'PCAR', 'PDD', 'PEP', 'PYPL', 'QCOM',
  'REGN', 'ROP', 'ROST', 'SBUX', 'SMCI', 'SNPS', 'SPLK', 'TEAM', 'TMUS', 'TSLA',
  'TTD', 'TTWO', 'TXN', 'VRSK', 'VRTX', 'WBD', 'WDAY', 'XEL', 'ZM', 'ZS'
];

// S&P 500 stocks (representative sample - top 200 by market cap)
const SP_500 = [
  'AAPL', 'ABBV', 'ABT', 'ACN', 'ADBE', 'ADP', 'ADSK', 'AEP', 'AIG', 'AMAT',
  'AMD', 'AMGN', 'AMZN', 'ANET', 'AVGO', 'AXP', 'BA', 'BAC', 'BDX', 'BIIB',
  'BK', 'BKNG', 'BLK', 'BMY', 'BRK.B', 'BSX', 'C', 'CAT', 'CB', 'CCI',
  'CDNS', 'CI', 'CL', 'CMCSA', 'CME', 'CMG', 'COP', 'COST', 'CRM', 'CSCO',
  'CSX', 'CTAS', 'CVS', 'CVX', 'DE', 'DHR', 'DIS', 'DUK', 'ECL', 'EL',
  'ELV', 'EMR', 'ENPH', 'EOG', 'EQIX', 'ETN', 'EW', 'EXC', 'F', 'FCX',
  'FDX', 'FI', 'FTNT', 'GD', 'GE', 'GILD', 'GM', 'GOOG', 'GOOGL', 'GPN',
  'GS', 'HCA', 'HD', 'HON', 'IBM', 'ICE', 'IDXX', 'INTC', 'INTU', 'ISRG',
  'ITW', 'JNJ', 'JPM', 'KHC', 'KLAC', 'KO', 'LEN', 'LHX', 'LIN', 'LLY',
  'LMT', 'LOW', 'LRCX', 'LULU', 'MA', 'MAR', 'MCD', 'MCHP', 'MCK', 'MCO',
  'MDLZ', 'MDT', 'MET', 'META', 'MMC', 'MMM', 'MO', 'MPC', 'MRK', 'MS',
  'MSCI', 'MSFT', 'MSI', 'MU', 'NEE', 'NFLX', 'NKE', 'NOC', 'NOW', 'NSC',
  'NVDA', 'NXPI', 'ODFL', 'ORCL', 'ORLY', 'OXY', 'PANW', 'PAYX', 'PCAR', 'PEP',
  'PFE', 'PG', 'PGR', 'PH', 'PLD', 'PM', 'PNC', 'PSA', 'PSX', 'PYPL',
  'QCOM', 'REGN', 'ROP', 'ROST', 'RTX', 'SBUX', 'SCHW', 'SHW', 'SLB', 'SMCI',
  'SNPS', 'SO', 'SPG', 'SPGI', 'SRE', 'SYK', 'SYY', 'T', 'TDG', 'TFC',
  'TGT', 'TJX', 'TMO', 'TMUS', 'TRV', 'TSLA', 'TT', 'TXN', 'UNH', 'UNP',
  'UPS', 'URI', 'USB', 'V', 'VICI', 'VLO', 'VMC', 'VRTX', 'VZ', 'WBA',
  'WFC', 'WELL', 'WM', 'WMT', 'XEL', 'XOM', 'ZTS'
];

// Popular/Trending stocks
const POPULAR_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'V', 'JNJ',
  'WMT', 'JPM', 'MA', 'PG', 'UNH', 'HD', 'CVX', 'MRK', 'ABBV', 'KO',
  'PEP', 'COST', 'AVGO', 'TMO', 'MCD', 'CSCO', 'ACN', 'ABT', 'DHR', 'NEE',
  'NKE', 'ORCL', 'AMD', 'INTC', 'CRM', 'QCOM', 'NFLX', 'ADBE', 'PYPL', 'DIS',
  'BA', 'GS', 'CAT', 'IBM', 'SBUX', 'GE', 'PLTR', 'COIN', 'RIVN', 'SOFI'
];

// Industry/Sector mapping for stocks
const STOCK_SECTORS = {
  // Technology
  'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 'GOOG': 'Technology',
  'META': 'Technology', 'NVDA': 'Technology', 'AMD': 'Technology', 'INTC': 'Technology',
  'AVGO': 'Technology', 'CSCO': 'Technology', 'ORCL': 'Technology', 'CRM': 'Technology',
  'ADBE': 'Technology', 'IBM': 'Technology', 'NOW': 'Technology', 'INTU': 'Technology',
  'QCOM': 'Technology', 'TXN': 'Technology', 'MU': 'Technology', 'AMAT': 'Technology',
  'LRCX': 'Technology', 'KLAC': 'Technology', 'SNPS': 'Technology', 'CDNS': 'Technology',
  'PANW': 'Technology', 'FTNT': 'Technology', 'CRWD': 'Technology', 'ZS': 'Technology',
  'PLTR': 'Technology', 'SMCI': 'Technology', 'ARM': 'Technology', 'MRVL': 'Technology',
  
  // Consumer/Retail
  'AMZN': 'Consumer', 'TSLA': 'Consumer', 'HD': 'Consumer', 'NKE': 'Consumer',
  'MCD': 'Consumer', 'SBUX': 'Consumer', 'TGT': 'Consumer', 'COST': 'Consumer',
  'WMT': 'Consumer', 'LOW': 'Consumer', 'TJX': 'Consumer', 'ROST': 'Consumer',
  'DIS': 'Consumer', 'NFLX': 'Consumer', 'CMG': 'Consumer', 'YUM': 'Consumer',
  'LULU': 'Consumer', 'ORLY': 'Consumer', 'AZO': 'Consumer', 'BKNG': 'Consumer',
  
  // Healthcare
  'JNJ': 'Healthcare', 'UNH': 'Healthcare', 'PFE': 'Healthcare', 'MRK': 'Healthcare',
  'ABBV': 'Healthcare', 'LLY': 'Healthcare', 'TMO': 'Healthcare', 'ABT': 'Healthcare',
  'DHR': 'Healthcare', 'BMY': 'Healthcare', 'AMGN': 'Healthcare', 'GILD': 'Healthcare',
  'ISRG': 'Healthcare', 'VRTX': 'Healthcare', 'REGN': 'Healthcare', 'BIIB': 'Healthcare',
  'MDT': 'Healthcare', 'SYK': 'Healthcare', 'BSX': 'Healthcare', 'EW': 'Healthcare',
  'MRNA': 'Healthcare', 'DXCM': 'Healthcare', 'IDXX': 'Healthcare', 'HCA': 'Healthcare',
  
  // Finance
  'BRK.B': 'Finance', 'JPM': 'Finance', 'V': 'Finance', 'MA': 'Finance',
  'BAC': 'Finance', 'WFC': 'Finance', 'GS': 'Finance', 'MS': 'Finance',
  'C': 'Finance', 'AXP': 'Finance', 'BLK': 'Finance', 'SCHW': 'Finance',
  'SPGI': 'Finance', 'ICE': 'Finance', 'CME': 'Finance', 'MCO': 'Finance',
  'PNC': 'Finance', 'USB': 'Finance', 'TFC': 'Finance', 'COF': 'Finance',
  'PYPL': 'Finance', 'SQ': 'Finance', 'COIN': 'Finance', 'SOFI': 'Finance',
  
  // Energy
  'XOM': 'Energy', 'CVX': 'Energy', 'COP': 'Energy', 'SLB': 'Energy',
  'EOG': 'Energy', 'MPC': 'Energy', 'PSX': 'Energy', 'VLO': 'Energy',
  'OXY': 'Energy', 'HAL': 'Energy', 'BKR': 'Energy', 'FANG': 'Energy',
  
  // Industrials
  'CAT': 'Industrials', 'BA': 'Industrials', 'HON': 'Industrials', 'UNP': 'Industrials',
  'GE': 'Industrials', 'RTX': 'Industrials', 'LMT': 'Industrials', 'DE': 'Industrials',
  'UPS': 'Industrials', 'FDX': 'Industrials', 'MMM': 'Industrials', 'EMR': 'Industrials',
  'ETN': 'Industrials', 'ITW': 'Industrials', 'NSC': 'Industrials', 'CSX': 'Industrials',
  
  // Telecom/Communication
  'VZ': 'Telecom', 'T': 'Telecom', 'TMUS': 'Telecom', 'CMCSA': 'Telecom',
  'CHTR': 'Telecom',
  
  // Utilities
  'NEE': 'Utilities', 'DUK': 'Utilities', 'SO': 'Utilities', 'AEP': 'Utilities',
  'EXC': 'Utilities', 'SRE': 'Utilities', 'XEL': 'Utilities', 'CEG': 'Utilities',
  
  // Real Estate
  'PLD': 'Real Estate', 'AMT': 'Real Estate', 'CCI': 'Real Estate', 'EQIX': 'Real Estate',
  'PSA': 'Real Estate', 'SPG': 'Real Estate', 'WELL': 'Real Estate', 'VICI': 'Real Estate',
  
  // Materials
  'LIN': 'Materials', 'APD': 'Materials', 'SHW': 'Materials', 'ECL': 'Materials',
  'FCX': 'Materials', 'NEM': 'Materials', 'VMC': 'Materials', 'DOW': 'Materials',
};

// Get sector for a stock (default to 'Other')
const getStockSector = (symbol) => STOCK_SECTORS[symbol] || 'Other';

// All unique sectors
const ALL_SECTORS = ['All', 'Technology', 'Healthcare', 'Finance', 'Consumer', 'Energy', 'Industrials', 'Telecom', 'Utilities', 'Real Estate', 'Materials', 'Other'];

// Discover scan results storage
const getStoredDiscoverResults = () => {
  try {
    const stored = localStorage.getItem('stockscope_discover_results');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading discover results:', e);
  }
  return null;
};

const saveDiscoverResults = (results) => {
  try {
    localStorage.setItem('stockscope_discover_results', JSON.stringify({
      ...results,
      timestamp: Date.now()
    }));
    return true;
  } catch (e) {
    console.error('Error saving discover results:', e);
    return false;
  }
};

// Discover watchlist storage
const getStoredWatchlist = () => {
  try {
    const stored = localStorage.getItem('stockscope_discover_watchlist');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading watchlist:', e);
  }
  return [];
};

const saveWatchlist = (watchlist) => {
  try {
    localStorage.setItem('stockscope_discover_watchlist', JSON.stringify(watchlist));
    return true;
  } catch (e) {
    console.error('Error saving watchlist:', e);
    return false;
  }
};

// Discover chat history storage
const getStoredChatHistory = () => {
  try {
    const stored = localStorage.getItem('stockscope_discover_chat');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading chat history:', e);
  }
  return [];
};

const saveChatHistory = (history) => {
  try {
    // Keep only last 20 messages to manage storage
    const trimmed = history.slice(-20);
    localStorage.setItem('stockscope_discover_chat', JSON.stringify(trimmed));
    return true;
  } catch (e) {
    console.error('Error saving chat history:', e);
    return false;
  }
};

// Parse uploaded positions file (supports JSON and simple text list)
const parsePositionsFile = (content, filename) => {
  const ext = filename.toLowerCase().split('.').pop();
  
  try {
    // Try JSON first
    if (ext === 'json') {
      const data = JSON.parse(content);
      // Support array of strings or array of objects with 'symbol' or 'ticker' property
      if (Array.isArray(data)) {
        return data.map(item => {
          if (typeof item === 'string') return item.toUpperCase().trim();
          if (item.symbol) return item.symbol.toUpperCase().trim();
          if (item.ticker) return item.ticker.toUpperCase().trim();
          return null;
        }).filter(Boolean).slice(0, MAX_FAVORITES);
      }
    }
    
    // Try CSV/TXT - one symbol per line or comma-separated
    const lines = content.split(/[\n,]/).map(s => s.trim().toUpperCase()).filter(s => /^[A-Z]{1,5}$/.test(s));
    return [...new Set(lines)].slice(0, MAX_FAVORITES);
  } catch (e) {
    console.error('Error parsing positions file:', e);
    return [];
  }
};

// Parse .env file content and extract API keys
const parseEnvFile = (content) => {
  const keys = {
    claude: '',
    alphaVantage: '',
    finnhub: '',
    twelveData: '',
    newsApi: '',
    polygon: ''
  };
  
  // Map of env variable names to our key names
  const envKeyMap = {
    // Claude / Anthropic
    'CLAUDE_API_KEY': 'claude',
    'ANTHROPIC_API_KEY': 'claude',
    'VITE_CLAUDE_API_KEY': 'claude',
    'VITE_ANTHROPIC_API_KEY': 'claude',
    'REACT_APP_CLAUDE_API_KEY': 'claude',
    'REACT_APP_ANTHROPIC_API_KEY': 'claude',
    
    // Finnhub
    'FINNHUB_API_KEY': 'finnhub',
    'VITE_FINNHUB_API_KEY': 'finnhub',
    'REACT_APP_FINNHUB_API_KEY': 'finnhub',
    
    // Twelve Data
    'TWELVE_DATA_API_KEY': 'twelveData',
    'TWELVEDATA_API_KEY': 'twelveData',
    'VITE_TWELVE_DATA_API_KEY': 'twelveData',
    'VITE_TWELVEDATA_API_KEY': 'twelveData',
    'REACT_APP_TWELVE_DATA_API_KEY': 'twelveData',
    'REACT_APP_TWELVEDATA_API_KEY': 'twelveData',
    
    // Polygon
    'POLYGON_API_KEY': 'polygon',
    'VITE_POLYGON_API_KEY': 'polygon',
    'REACT_APP_POLYGON_API_KEY': 'polygon',
    
    // Alpha Vantage
    'ALPHA_VANTAGE_API_KEY': 'alphaVantage',
    'ALPHAVANTAGE_API_KEY': 'alphaVantage',
    'VITE_ALPHA_VANTAGE_API_KEY': 'alphaVantage',
    'VITE_ALPHAVANTAGE_API_KEY': 'alphaVantage',
    'REACT_APP_ALPHA_VANTAGE_API_KEY': 'alphaVantage',
    'REACT_APP_ALPHAVANTAGE_API_KEY': 'alphaVantage',
    
    // NewsAPI
    'NEWS_API_KEY': 'newsApi',
    'NEWSAPI_KEY': 'newsApi',
    'VITE_NEWS_API_KEY': 'newsApi',
    'VITE_NEWSAPI_KEY': 'newsApi',
    'REACT_APP_NEWS_API_KEY': 'newsApi',
    'REACT_APP_NEWSAPI_KEY': 'newsApi',
  };
  
  // Parse each line
  const lines = content.split('\n');
  for (const line of lines) {
    // Skip comments and empty lines
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    
    // Parse KEY=VALUE format
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex === -1) continue;
    
    const envKey = trimmedLine.substring(0, equalIndex).trim();
    let value = trimmedLine.substring(equalIndex + 1).trim();
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Map to our key name
    const ourKey = envKeyMap[envKey];
    if (ourKey && value) {
      keys[ourKey] = value;
    }
  }
  
  return keys;
};

// Generate .env file content from keys
const generateEnvFile = (keys) => {
  const lines = [
    '# StockScope API Keys',
    '# Generated from StockScope settings',
    '',
    '# Claude AI (Anthropic) - Required for AI analysis',
    `CLAUDE_API_KEY=${keys.claude || ''}`,
    '',
    '# Finnhub - Stock data and news (daily only on free tier)',
    `FINNHUB_API_KEY=${keys.finnhub || ''}`,
    '',
    '# Twelve Data - Best for intraday data (800 calls/day free)',
    `TWELVE_DATA_API_KEY=${keys.twelveData || ''}`,
    '',
    '# Polygon.io - Professional stock data',
    `POLYGON_API_KEY=${keys.polygon || ''}`,
    '',
    '# Alpha Vantage - Stock data',
    `ALPHA_VANTAGE_API_KEY=${keys.alphaVantage || ''}`,
    '',
    '# NewsAPI - News articles',
    `NEWS_API_KEY=${keys.newsApi || ''}`,
    ''
  ];
  
  return lines.join('\n');
};

// ============================================================================
// DATA FETCHING - Multiple Provider Support
// ============================================================================

// Helper to get market hours for filtering intraday data
const isMarketHours = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const day = date.getDay();
  
  // Skip weekends
  if (day === 0 || day === 6) return false;
  
  // Market hours: 9:30 AM - 4:00 PM ET
  const timeInMinutes = hours * 60 + minutes;
  return timeInMinutes >= 9 * 60 + 30 && timeInMinutes <= 16 * 60;
};

// Get the most recent trading day's start timestamp
const getLastTradingDayStart = () => {
  const now = new Date();
  const day = now.getDay();
  
  // If weekend, go back to Friday
  if (day === 0) now.setDate(now.getDate() - 2); // Sunday -> Friday
  else if (day === 6) now.setDate(now.getDate() - 1); // Saturday -> Friday
  
  // Set to market open (9:30 AM ET)
  now.setHours(9, 30, 0, 0);
  return Math.floor(now.getTime() / 1000);
};

// Finnhub API for stock data - Best for intraday (5m, 15m, 60m)
const fetchFinnhubStockData = async (symbol, timeRange, apiKey) => {
  if (!apiKey) return { success: false, error: 'No Finnhub API key' };
  
  const now = Math.floor(Date.now() / 1000);
  const today = new Date();
  
  console.log(`[Finnhub] Current time: ${today.toLocaleString()}, Unix: ${now}`);
  
  // Finnhub resolution: 1, 5, 15, 30, 60, D, W, M
  // Calculate proper date ranges for each timeframe
  const resolutionMap = {
    '1D': { 
      resolution: '5',   // 5-minute candles
      from: now - 86400 * 7,  // Go back 7 days to handle weekends + holidays
      expectedCandles: 78,    // ~78 5-min candles in a trading day (6.5 hrs * 12)
      filterType: 'lastTradingDay'
    },
    '1W': { 
      resolution: '15',  // 15-minute candles
      from: now - 86400 * 14, // Go back 14 days to ensure 5 trading days
      expectedCandles: 130,   // ~26 candles per day * 5 days
      filterType: 'tradingDays',
      tradingDays: 5
    },
    '1M': { 
      resolution: '60',  // 1-hour candles
      from: now - 86400 * 45, // Go back 45 days to ensure 30 calendar days
      expectedCandles: 195,   // ~6.5 candles per day * 30 days
      filterType: 'calendarDays',
      calendarDays: 30
    },
    '3M': { 
      resolution: 'D',   // Daily candles
      from: now - 86400 * 100, // Go back 100 days
      expectedCandles: 66,
      filterType: 'dailyCandles',
      candleCount: 66
    },
    '1Y': { 
      resolution: 'D',   // Daily candles
      from: now - 86400 * 400, // Go back 400 days to ensure 252 trading days
      expectedCandles: 252,
      filterType: 'dailyCandles',
      candleCount: 252
    },
    'ALL': { 
      resolution: 'M',   // Monthly candles
      from: 0,           // All available data
      expectedCandles: 120,
      filterType: 'none'
    }
  };
  
  const config = resolutionMap[timeRange] || resolutionMap['1M'];
  const fromDate = new Date(config.from * 1000);
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${config.resolution}&from=${config.from}&to=${now}&token=${apiKey}`;
  
  console.log(`[Finnhub] Request: ${symbol}, ${timeRange}`);
  console.log(`[Finnhub] Resolution: ${config.resolution}, FilterType: ${config.filterType}`);
  console.log(`[Finnhub] From: ${fromDate.toLocaleString()}, To: ${today.toLocaleString()}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.s === 'no_data' || !data.c || data.c.length === 0) {
      console.log('[Finnhub] No data available');
      return { success: false, error: 'No data available' };
    }
    
    console.log(`[Finnhub] Raw data received: ${data.c.length} candles`);
    
    // Log first and last candle timestamps
    const firstTs = new Date(data.t[0] * 1000);
    const lastTs = new Date(data.t[data.t.length - 1] * 1000);
    console.log(`[Finnhub] Raw data range: ${firstTs.toLocaleString()} to ${lastTs.toLocaleString()}`);
    
    let chartData = data.t.map((ts, i) => {
      const date = new Date(ts * 1000);
      return {
        date: formatDate(date, timeRange),
        fullDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        timestamp: ts,
        open: parseFloat(data.o[i].toFixed(2)),
        high: parseFloat(data.h[i].toFixed(2)),
        low: parseFloat(data.l[i].toFixed(2)),
        close: parseFloat(data.c[i].toFixed(2)),
        volume: data.v[i] || 0,
        isUp: data.c[i] >= data.o[i],
      };
    });
    
    // Apply the appropriate filter based on timeframe
    switch (config.filterType) {
      case 'lastTradingDay': {
        // 1D: Only keep data from the most recent trading day in the dataset
        const lastCandleDate = new Date(chartData[chartData.length - 1].timestamp * 1000);
        const lastDayStr = lastCandleDate.toDateString();
        
        chartData = chartData.filter(d => {
          const candleDate = new Date(d.timestamp * 1000);
          return candleDate.toDateString() === lastDayStr;
        });
        
        console.log(`[Finnhub] 1D Filter: Keeping only ${lastDayStr}`);
        console.log(`[Finnhub] 1D Result: ${chartData.length} candles`);
        break;
      }
      
      case 'tradingDays': {
        // 1W: Keep only the last N trading days of intraday data
        const byDate = {};
        chartData.forEach(d => {
          const dateKey = new Date(d.timestamp * 1000).toDateString();
          if (!byDate[dateKey]) byDate[dateKey] = [];
          byDate[dateKey].push(d);
        });
        
        // Sort dates descending (most recent first)
        const availableDates = Object.keys(byDate).sort((a, b) => new Date(b) - new Date(a));
        console.log(`[Finnhub] Available trading days: ${availableDates.length}`);
        console.log(`[Finnhub] Most recent days: ${availableDates.slice(0, 7).join(', ')}`);
        
        // Take the last N trading days
        const targetDates = new Set(availableDates.slice(0, config.tradingDays));
        
        chartData = chartData.filter(d => {
          const dateKey = new Date(d.timestamp * 1000).toDateString();
          return targetDates.has(dateKey);
        });
        
        console.log(`[Finnhub] 1W Filter: Keeping ${config.tradingDays} trading days`);
        console.log(`[Finnhub] 1W Result: ${chartData.length} candles`);
        break;
      }
      
      case 'calendarDays': {
        // 1M: Keep last N calendar days of hourly data
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - config.calendarDays);
        cutoffDate.setHours(0, 0, 0, 0);
        const cutoffTs = Math.floor(cutoffDate.getTime() / 1000);
        
        chartData = chartData.filter(d => d.timestamp >= cutoffTs);
        
        console.log(`[Finnhub] 1M Filter: Keeping data since ${cutoffDate.toLocaleDateString()}`);
        console.log(`[Finnhub] 1M Result: ${chartData.length} candles`);
        break;
      }
      
      case 'dailyCandles': {
        // 3M, 1Y: Just take the last N daily candles
        if (chartData.length > config.candleCount) {
          chartData = chartData.slice(-config.candleCount);
        }
        console.log(`[Finnhub] ${timeRange} Filter: Taking last ${config.candleCount} candles`);
        console.log(`[Finnhub] ${timeRange} Result: ${chartData.length} candles`);
        break;
      }
      
      case 'none':
      default:
        // ALL: Use all data as-is
        console.log(`[Finnhub] ${timeRange} Result: ${chartData.length} candles (no filter)`);
        break;
    }
    
    // Ensure chronological order
    chartData.sort((a, b) => a.timestamp - b.timestamp);
    
    // Log final data range
    if (chartData.length > 0) {
      const finalFirst = chartData[0];
      const finalLast = chartData[chartData.length - 1];
      console.log(`[Finnhub] Final range: ${finalFirst.fullDate} to ${finalLast.fullDate}`);
    }
    
    console.log(`[Finnhub] ✓ Success: ${chartData.length} candles for ${symbol} (${timeRange})`);
    
    const lastClose = chartData[chartData.length - 1]?.close;
    
    return {
      success: true,
      chartData,
      meta: {
        symbol,
        exchange: 'US',
        currency: 'USD',
        previousClose: chartData.length > 1 ? chartData[chartData.length - 2]?.close : chartData[0]?.open,
        currentPrice: lastClose
      }
    };
  } catch (error) {
    console.error('[Finnhub] Error:', error);
    return { success: false, error: error.message };
  }
};

// Alpha Vantage API for stock data
const fetchAlphaVantageStockData = async (symbol, timeRange, apiKey) => {
  if (!apiKey) return { success: false, error: 'No Alpha Vantage API key' };
  
  const functionMap = {
    '1D': 'TIME_SERIES_INTRADAY&interval=5min',
    '1W': 'TIME_SERIES_INTRADAY&interval=15min',
    '1M': 'TIME_SERIES_INTRADAY&interval=60min',
    '3M': 'TIME_SERIES_DAILY',
    '1Y': 'TIME_SERIES_DAILY',
    'ALL': 'TIME_SERIES_MONTHLY'
  };
  
  const func = functionMap[timeRange] || functionMap['1M'];
  const url = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&apikey=${apiKey}&outputsize=full`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message'] || data['Note']) {
      return { success: false, error: data['Error Message'] || 'API limit reached' };
    }
    
    // Find the time series key
    const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
    if (!timeSeriesKey) {
      return { success: false, error: 'Invalid response format' };
    }
    
    const timeSeries = data[timeSeriesKey];
    const entries = Object.entries(timeSeries).slice(0, 200).reverse();
    
    const chartData = entries.map(([dateStr, values]) => {
      const date = new Date(dateStr);
      return {
        date: formatDate(date, timeRange),
        fullDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        timestamp: Math.floor(date.getTime() / 1000),
        open: parseFloat(parseFloat(values['1. open']).toFixed(2)),
        high: parseFloat(parseFloat(values['2. high']).toFixed(2)),
        low: parseFloat(parseFloat(values['3. low']).toFixed(2)),
        close: parseFloat(parseFloat(values['4. close']).toFixed(2)),
        volume: parseInt(values['5. volume']) || 0,
        isUp: parseFloat(values['4. close']) >= parseFloat(values['1. open']),
      };
    });
    
    return {
      success: true,
      chartData,
      meta: {
        symbol,
        exchange: 'US',
        currency: 'USD',
        previousClose: chartData[0]?.open
      }
    };
  } catch (error) {
    console.error('Alpha Vantage error:', error);
    return { success: false, error: error.message };
  }
};

// Polygon.io API for stock data - Best for daily, weekly, monthly data
// Note: Polygon free tier does NOT support intraday (minute) data
const fetchPolygonStockData = async (symbol, timeRange, apiKey) => {
  if (!apiKey) return { success: false, error: 'No Polygon API key' };
  
  // Polygon free tier only supports daily and above
  // Skip for intraday timeframes
  if (['1D', '1W', '1M'].includes(timeRange)) {
    console.log('Polygon: Skipping intraday timeframe (free tier limitation)');
    return { success: false, error: 'Polygon free tier does not support intraday data' };
  }
  
  const now = new Date();
  
  // Configuration for each timeframe
  const configMap = {
    '3M': { 
      multiplier: 1, 
      timespan: 'day', 
      days: 100,           // Go back 100 days to get 66 trading days
      targetCandles: 66 
    },
    '1Y': { 
      multiplier: 1, 
      timespan: 'day', 
      days: 380,           // Go back 380 days to get 252 trading days
      targetCandles: 252 
    },
    'ALL': { 
      multiplier: 1, 
      timespan: 'month', 
      days: 7300,          // ~20 years of data
      targetCandles: null  // All available
    }
  };
  
  const config = configMap[timeRange] || configMap['3M'];
  
  // Calculate dates
  const fromDate = new Date(now.getTime() - config.days * 24 * 60 * 60 * 1000);
  const from = fromDate.toISOString().split('T')[0];
  const to = now.toISOString().split('T')[0];
  
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${config.multiplier}/${config.timespan}/${from}/${to}?adjusted=true&sort=asc&limit=5000&apiKey=${apiKey}`;
  
  console.log(`Polygon request: ${symbol}, ${timeRange}, ${config.timespan}, from ${from} to ${to}, target ${config.targetCandles || 'all'} candles`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'ERROR') {
      console.error('Polygon API error:', data.error);
      return { success: false, error: data.error || 'API error' };
    }
    
    if (!data.results || data.results.length === 0) {
      console.log('Polygon: No results returned');
      return { success: false, error: 'No data available' };
    }
    
    let chartData = data.results.map(bar => {
      const date = new Date(bar.t);
      return {
        date: formatDate(date, timeRange),
        fullDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: Math.floor(bar.t / 1000),
        open: parseFloat(bar.o.toFixed(2)),
        high: parseFloat(bar.h.toFixed(2)),
        low: parseFloat(bar.l.toFixed(2)),
        close: parseFloat(bar.c.toFixed(2)),
        volume: bar.v || 0,
        isUp: bar.c >= bar.o,
      };
    });
    
    // Filter to exact number of trading days if specified
    if (config.targetCandles && chartData.length > config.targetCandles) {
      chartData = chartData.slice(-config.targetCandles);
    }
    
    console.log(`Polygon returned ${chartData.length} candles for ${symbol} (${timeRange})`);
    
    
    // Get the last close price as the current price
    const lastClose = chartData[chartData.length - 1]?.close;
    const prevClose = chartData.length > 1 ? chartData[chartData.length - 2]?.close : null;
    
    return {
      success: true,
      chartData,
      meta: {
        symbol,
        exchange: 'US',
        currency: 'USD',
        previousClose: prevClose,
        currentPrice: lastClose
      }
    };
  } catch (error) {
    console.error('Polygon error:', error);
    return { success: false, error: error.message };
  }
};

// Twelve Data API - Good free tier for intraday (800 calls/day)
const fetchTwelveDataStockData = async (symbol, timeRange, apiKey) => {
  if (!apiKey) return { success: false, error: 'No Twelve Data API key' };
  
  // Twelve Data intervals: 1min, 5min, 15min, 30min, 45min, 1h, 2h, 4h, 1day, 1week, 1month
  const configMap = {
    '1D': { 
      interval: '5min',
      outputsize: 78,  // Full trading day of 5-min candles
    },
    '1W': { 
      interval: '15min',
      outputsize: 130, // ~5 trading days of 15-min candles
    },
    '1M': { 
      interval: '1h',
      outputsize: 195, // ~30 days of hourly candles
    },
    '3M': { 
      interval: '1day',
      outputsize: 66,
    },
    '1Y': { 
      interval: '1day',
      outputsize: 252,
    },
    'ALL': { 
      interval: '1month',
      outputsize: 240, // 20 years of monthly data
    }
  };
  
  const config = configMap[timeRange] || configMap['1M'];
  const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${config.interval}&outputsize=${config.outputsize}&apikey=${apiKey}`;
  
  console.log(`[TwelveData] Request: ${symbol}, ${timeRange}, interval=${config.interval}, outputsize=${config.outputsize}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'error') {
      console.log(`[TwelveData] Error: ${data.message}`);
      return { success: false, error: data.message };
    }
    
    if (!data.values || data.values.length === 0) {
      console.log('[TwelveData] No data available');
      return { success: false, error: 'No data available' };
    }
    
    console.log(`[TwelveData] Raw data received: ${data.values.length} candles`);
    
    // Twelve Data returns data in reverse chronological order (newest first)
    // We need to reverse it for our chart
    let chartData = data.values.reverse().map(bar => {
      const date = new Date(bar.datetime);
      return {
        date: formatDate(date, timeRange),
        fullDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        timestamp: Math.floor(date.getTime() / 1000),
        open: parseFloat(parseFloat(bar.open).toFixed(2)),
        high: parseFloat(parseFloat(bar.high).toFixed(2)),
        low: parseFloat(parseFloat(bar.low).toFixed(2)),
        close: parseFloat(parseFloat(bar.close).toFixed(2)),
        volume: parseInt(bar.volume) || 0,
        isUp: parseFloat(bar.close) >= parseFloat(bar.open),
      };
    });
    
    // For 1D, filter to only the most recent trading day
    if (timeRange === '1D' && chartData.length > 0) {
      const lastCandleDate = new Date(chartData[chartData.length - 1].timestamp * 1000);
      const lastDayStr = lastCandleDate.toDateString();
      
      chartData = chartData.filter(d => {
        const candleDate = new Date(d.timestamp * 1000);
        return candleDate.toDateString() === lastDayStr;
      });
      
      console.log(`[TwelveData] 1D Filter: Keeping only ${lastDayStr}, ${chartData.length} candles`);
    }
    
    // For 1W, filter to last 5 trading days
    if (timeRange === '1W' && chartData.length > 0) {
      const byDate = {};
      chartData.forEach(d => {
        const dateKey = new Date(d.timestamp * 1000).toDateString();
        if (!byDate[dateKey]) byDate[dateKey] = [];
        byDate[dateKey].push(d);
      });
      
      const availableDates = Object.keys(byDate).sort((a, b) => new Date(b) - new Date(a));
      const targetDates = new Set(availableDates.slice(0, 5));
      
      chartData = chartData.filter(d => {
        const dateKey = new Date(d.timestamp * 1000).toDateString();
        return targetDates.has(dateKey);
      });
      
      console.log(`[TwelveData] 1W Filter: Keeping 5 trading days, ${chartData.length} candles`);
    }
    
    // For 1M, filter to last 30 calendar days
    if (timeRange === '1M' && chartData.length > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      cutoffDate.setHours(0, 0, 0, 0);
      const cutoffTs = Math.floor(cutoffDate.getTime() / 1000);
      
      chartData = chartData.filter(d => d.timestamp >= cutoffTs);
      
      console.log(`[TwelveData] 1M Filter: Keeping last 30 days, ${chartData.length} candles`);
    }
    
    // Log final data range
    if (chartData.length > 0) {
      const finalFirst = chartData[0];
      const finalLast = chartData[chartData.length - 1];
      console.log(`[TwelveData] Final range: ${finalFirst.fullDate} to ${finalLast.fullDate}`);
    }
    
    console.log(`[TwelveData] ✓ Success: ${chartData.length} candles for ${symbol} (${timeRange})`);
    
    const lastClose = chartData[chartData.length - 1]?.close;
    
    return {
      success: true,
      chartData,
      meta: {
        symbol,
        exchange: data.meta?.exchange || 'US',
        currency: data.meta?.currency || 'USD',
        previousClose: chartData.length > 1 ? chartData[chartData.length - 2]?.close : chartData[0]?.open,
        currentPrice: lastClose
      }
    };
  } catch (error) {
    console.error('[TwelveData] Error:', error);
    return { success: false, error: error.message };
  }
};

// Finnhub News API
const fetchFinnhubNews = async (symbol, apiKey) => {
  if (!apiKey) return { success: false, news: [] };
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const from = weekAgo.toISOString().split('T')[0];
  const to = now.toISOString().split('T')[0];
  
  const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, news: [] };
    }
    
    const news = data.slice(0, 10).map((item, index) => ({
      id: index,
      title: item.headline,
      source: item.source,
      time: getTimeAgo(new Date(item.datetime * 1000)),
      url: item.url,
      isBreaking: index === 0 && (Date.now() / 1000 - item.datetime) < 3600
    }));
    
    return { success: true, news };
  } catch (error) {
    console.error('Finnhub news error:', error);
    return { success: false, news: [] };
  }
};

// Fetch current quote/price - this should be consistent regardless of timeframe
const fetchCurrentPrice = async (symbol, apiKeys) => {
  console.log(`Fetching current price for ${symbol}`);
  
  // Try Finnhub quote endpoint first (most reliable for real-time)
  if (apiKeys.finnhub) {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKeys.finnhub}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.c && data.c > 0) {
        console.log(`Finnhub quote for ${symbol}: $${data.c}`);
        return {
          success: true,
          currentPrice: parseFloat(data.c.toFixed(2)),
          previousClose: data.pc ? parseFloat(data.pc.toFixed(2)) : null,
          change: data.d,
          changePercent: data.dp
        };
      }
    } catch (error) {
      console.error('Finnhub quote error:', error);
    }
  }
  
  // Try Polygon previous close endpoint
  if (apiKeys.polygon) {
    try {
      const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${apiKeys.polygon}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        console.log(`Polygon prev close for ${symbol}: $${result.c}`);
        return {
          success: true,
          currentPrice: parseFloat(result.c.toFixed(2)),
          previousClose: parseFloat(result.o.toFixed(2))
        };
      }
    } catch (error) {
      console.error('Polygon prev close error:', error);
    }
  }
  
  return { success: false };
};

// Fetch company profile from Finnhub
const fetchCompanyProfile = async (symbol, apiKey) => {
  if (!apiKey) return { success: false };
  
  try {
    const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.name) {
      console.log(`Company profile for ${symbol}: ${data.name}`);
      return {
        success: true,
        name: data.name,
        logo: data.logo,
        industry: data.finnhubIndustry,
        exchange: data.exchange,
        country: data.country,
        marketCap: data.marketCapitalization,
        ipo: data.ipo,
        weburl: data.weburl
      };
    }
    return { success: false };
  } catch (error) {
    console.error('Company profile error:', error);
    return { success: false };
  }
};

// NewsAPI for news
const fetchNewsApiNews = async (symbol, companyName, apiKey) => {
  if (!apiKey) return { success: false, news: [] };
  
  const query = encodeURIComponent(`${symbol} OR "${companyName}" stock`);
  const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'ok' || !data.articles) {
      return { success: false, news: [] };
    }
    
    const news = data.articles.slice(0, 10).map((item, index) => ({
      id: index,
      title: item.title,
      source: item.source?.name || 'News',
      time: getTimeAgo(new Date(item.publishedAt)),
      url: item.url,
      isBreaking: index === 0 && (Date.now() - new Date(item.publishedAt).getTime()) < 3600000
    }));
    
    return { success: true, news };
  } catch (error) {
    console.error('NewsAPI error:', error);
    return { success: false, news: [] };
  }
};

// Helper function for time ago
const getTimeAgo = (date) => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// ============================================================================
// DATA FETCHING - Yahoo Finance Integration (Fallback)
// ============================================================================

// Multiple CORS Proxies to bypass Yahoo Finance CORS restrictions
// We try multiple proxies in case one is down or rate limiting
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

// Helper to fetch with CORS proxy fallbacks
const fetchWithCorsProxy = async (targetUrl, options = {}) => {
  let lastError = null;
  
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
      console.log(`[CORS] Trying proxy: ${proxy.split('?')[0]}...`);
      
      const response = await fetch(proxyUrl, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (response.ok) {
        console.log(`[CORS] Success with proxy: ${proxy.split('?')[0]}`);
        return response;
      }
      
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.log(`[CORS] Proxy failed: ${error.message}`);
      lastError = error;
    }
  }
  
  throw lastError || new Error('All CORS proxies failed');
};

const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

const INTERVAL_MAP = {
  '1D': { interval: '5m', range: '1d' },      // 5 minute candles
  '1W': { interval: '15m', range: '5d' },     // 15 minute candles
  '1M': { interval: '1h', range: '1mo' },     // 1 hour candles
  '3M': { interval: '1d', range: '3mo' },     // 1 day candles
  '1Y': { interval: '1d', range: '1y' },      // 1 day candles
  'ALL': { interval: '1mo', range: 'max' },   // 1 month candles
};

// Global cache for stock data to reduce API calls
// Cache duration: 2 minutes for intraday, 5 minutes for daily+
const stockDataCache = new Map();
const CACHE_DURATION_INTRADAY = 2 * 60 * 1000; // 2 minutes
const CACHE_DURATION_DAILY = 5 * 60 * 1000;    // 5 minutes

const getCachedStockData = (symbol, timeRange) => {
  const cacheKey = `${symbol}_${timeRange}`;
  const cached = stockDataCache.get(cacheKey);
  
  if (cached) {
    const isIntraday = ['1D', '1W', '1M'].includes(timeRange);
    const maxAge = isIntraday ? CACHE_DURATION_INTRADAY : CACHE_DURATION_DAILY;
    const age = Date.now() - cached.timestamp;
    
    if (age < maxAge) {
      console.log(`[Cache] HIT for ${symbol} (${timeRange}) - Age: ${Math.round(age/1000)}s, Max: ${maxAge/1000}s`);
      return cached.data;
    } else {
      console.log(`[Cache] EXPIRED for ${symbol} (${timeRange}) - Age: ${Math.round(age/1000)}s, Max: ${maxAge/1000}s`);
    }
  } else {
    console.log(`[Cache] MISS for ${symbol} (${timeRange})`);
  }
  return null;
};

const setCachedStockData = (symbol, timeRange, data) => {
  const cacheKey = `${symbol}_${timeRange}`;
  console.log(`[Cache] SET ${symbol} (${timeRange}) - ${data.chartData?.length || 0} candles`);
  stockDataCache.set(cacheKey, { data, timestamp: Date.now() });
  
  // Clean up old cache entries (keep max 50)
  if (stockDataCache.size > 50) {
    const firstKey = stockDataCache.keys().next().value;
    stockDataCache.delete(firstKey);
  }
};

const fetchStockData = async (symbol, timeRange, apiKeys = {}) => {
  // Check cache first
  const cached = getCachedStockData(symbol, timeRange);
  if (cached) {
    return cached;
  }
  
  console.log(`\n--- Fetching stock data for ${symbol} (${timeRange}) ---`);
  
  // Determine which API to use based on timeframe
  // Intraday (1D, 1W, 1M): Twelve Data or Alpha Vantage (Finnhub free tier doesn't support intraday)
  // Daily+ (3M, 1Y, ALL): Polygon, Finnhub, or Alpha Vantage
  
  const isIntraday = ['1D', '1W', '1M'].includes(timeRange);
  
  if (isIntraday) {
    // For intraday: Twelve Data first (best free option), then Alpha Vantage
    // Note: Finnhub free tier does NOT support intraday candles - skip it for intraday
    console.log(`Intraday timeframe - using Twelve Data / Alpha Vantage for ${timeRange}`);
    
    // 1. Try Twelve Data (best free option for intraday - 800 calls/day)
    if (apiKeys.twelveData) {
      console.log('Trying Twelve Data API...');
      const twelveResult = await fetchTwelveDataStockData(symbol, timeRange, apiKeys.twelveData);
      if (twelveResult.success && twelveResult.chartData.length > 0) {
        console.log(`✓ Twelve Data success: ${twelveResult.chartData.length} candles for ${symbol}`);
        twelveResult.source = 'Twelve Data';
        setCachedStockData(symbol, timeRange, twelveResult);
        return twelveResult;
      }
      console.log('Twelve Data failed:', twelveResult.error);
    }
    
    // 2. Try Alpha Vantage (also supports intraday, but limited to 25 calls/day)
    if (apiKeys.alphaVantage) {
      console.log('Trying Alpha Vantage API...');
      const avResult = await fetchAlphaVantageStockData(symbol, timeRange, apiKeys.alphaVantage);
      if (avResult.success && avResult.chartData.length > 0) {
        console.log(`✓ Alpha Vantage success: ${avResult.chartData.length} candles for ${symbol}`);
        avResult.source = 'Alpha Vantage';
        setCachedStockData(symbol, timeRange, avResult);
        return avResult;
      }
      console.log('Alpha Vantage failed:', avResult.error);
    }
    
    // Note: Finnhub skipped for intraday - free tier doesn't support it
    // Will fall through to Yahoo Finance below
  } else {
    // For daily/weekly/monthly: Polygon first (better historical data), then Finnhub, then others
    console.log(`Daily+ timeframe - prioritizing Polygon/Finnhub for ${timeRange}`);
    
    // 1. Try Polygon (best for daily historical data)
    if (apiKeys.polygon) {
      console.log('Trying Polygon API...');
      const polygonResult = await fetchPolygonStockData(symbol, timeRange, apiKeys.polygon);
      if (polygonResult.success && polygonResult.chartData.length > 0) {
        console.log(`✓ Polygon success: ${polygonResult.chartData.length} candles for ${symbol}`);
        polygonResult.source = 'Polygon';
        setCachedStockData(symbol, timeRange, polygonResult);
        return polygonResult;
      }
      console.log('Polygon failed:', polygonResult.error);
    }
    
    // 2. Try Finnhub (supports daily on free tier)
    if (apiKeys.finnhub) {
      console.log('Trying Finnhub API...');
      const finnhubResult = await fetchFinnhubStockData(symbol, timeRange, apiKeys.finnhub);
      if (finnhubResult.success && finnhubResult.chartData.length > 0) {
        console.log(`✓ Finnhub success: ${finnhubResult.chartData.length} candles for ${symbol}`);
        finnhubResult.source = 'Finnhub';
        setCachedStockData(symbol, timeRange, finnhubResult);
        return finnhubResult;
      }
      console.log('Finnhub failed:', finnhubResult.error);
    }
    
    // 3. Try Twelve Data
    if (apiKeys.twelveData) {
      console.log('Trying Twelve Data API...');
      const twelveResult = await fetchTwelveDataStockData(symbol, timeRange, apiKeys.twelveData);
      if (twelveResult.success && twelveResult.chartData.length > 0) {
        console.log(`✓ Twelve Data success: ${twelveResult.chartData.length} candles for ${symbol}`);
        twelveResult.source = 'Twelve Data';
        setCachedStockData(symbol, timeRange, twelveResult);
        return twelveResult;
      }
      console.log('Twelve Data failed:', twelveResult.error);
    }
    
    // 4. Try Alpha Vantage
    if (apiKeys.alphaVantage) {
      console.log('Trying Alpha Vantage API...');
      const avResult = await fetchAlphaVantageStockData(symbol, timeRange, apiKeys.alphaVantage);
      if (avResult.success && avResult.chartData.length > 0) {
        console.log(`✓ Alpha Vantage success: ${avResult.chartData.length} candles for ${symbol}`);
        avResult.source = 'Alpha Vantage';
        setCachedStockData(symbol, timeRange, avResult);
        return avResult;
      }
      console.log('Alpha Vantage failed:', avResult.error);
    }
  }
  
  // Last resort: Yahoo Finance (via CORS proxy)
  console.log('Trying Yahoo Finance fallback (via CORS proxy)...');
  const { interval, range } = INTERVAL_MAP[timeRange] || INTERVAL_MAP['1M'];
  const yahooUrl = `${YAHOO_BASE_URL}/${symbol}?interval=${interval}&range=${range}`;
  
  try {
    const response = await fetchWithCorsProxy(yahooUrl);
    const data = await response.json();
    const result = data.chart.result[0];
    
    if (!result || !result.timestamp) throw new Error('Invalid data structure');
    
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];
    const meta = result.meta;
    
    const chartData = timestamps.map((ts, i) => {
      const date = new Date(ts * 1000);
      return {
        date: formatDate(date, timeRange),
        fullDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        timestamp: ts,
        open: quote.open[i] ? parseFloat(quote.open[i].toFixed(2)) : null,
        high: quote.high[i] ? parseFloat(quote.high[i].toFixed(2)) : null,
        low: quote.low[i] ? parseFloat(quote.low[i].toFixed(2)) : null,
        close: quote.close[i] ? parseFloat(quote.close[i].toFixed(2)) : null,
        volume: quote.volume[i] || 0,
        isUp: quote.close[i] >= quote.open[i],
      };
    }).filter(d => d.close !== null);
    
    console.log(`✓ Yahoo Finance success: ${chartData.length} candles`);
    
    const fetchResult = {
      success: true,
      chartData,
      source: 'Yahoo Finance',
      meta: {
        symbol: meta.symbol,
        currency: meta.currency,
        exchange: meta.exchangeName,
        regularMarketPrice: meta.regularMarketPrice,
        previousClose: meta.previousClose || meta.chartPreviousClose,
        regularMarketTime: meta.regularMarketTime,
      }
    };
    
    setCachedStockData(symbol, timeRange, fetchResult);
    return fetchResult;
  } catch (yahooError) {
    console.log('Yahoo Finance failed:', yahooError.message);
    
    // Absolute last resort: Try Finnhub (may work for daily data even on free tier)
    if (apiKeys.finnhub) {
      console.log('Trying Finnhub as last resort...');
      const finnhubResult = await fetchFinnhubStockData(symbol, timeRange, apiKeys.finnhub);
      if (finnhubResult.success && finnhubResult.chartData.length > 0) {
        console.log(`✓ Finnhub last resort success: ${finnhubResult.chartData.length} candles for ${symbol}`);
        finnhubResult.source = 'Finnhub';
        setCachedStockData(symbol, timeRange, finnhubResult);
        return finnhubResult;
      }
      console.log('Finnhub last resort failed:', finnhubResult.error);
    }
    
    console.error('All data sources failed');
    return { success: false, error: 'All data sources failed' };
  }
};

const fetchQuoteData = async (symbol) => {
  const yahooUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,summaryDetail,defaultKeyStatistics`;
  
  console.log(`[QuoteData] Fetching quote data for ${symbol}...`);
  
  try {
    const response = await fetchWithCorsProxy(yahooUrl);
    
    const text = await response.text();
    console.log(`[QuoteData] Response length: ${text.length} chars`);
    
    // Check if response is valid JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('[QuoteData] Failed to parse JSON:', text.slice(0, 200));
      throw new Error('Invalid JSON response');
    }
    
    // Check for Yahoo Finance error response
    if (data.quoteSummary?.error) {
      console.error('[QuoteData] Yahoo Finance error:', data.quoteSummary.error);
      throw new Error(data.quoteSummary.error.description || 'Yahoo Finance error');
    }
    
    const result = data.quoteSummary?.result?.[0];
    if (!result) {
      console.error('[QuoteData] No result in response');
      throw new Error('No data in response');
    }
    
    const price = result.price || {};
    const summary = result.summaryDetail || {};
    const keyStats = result.defaultKeyStatistics || {};
    
    console.log(`[QuoteData] Success - Market Cap: ${price.marketCap?.raw}, PE: ${summary.trailingPE?.fmt}`);
    
    return {
      success: true,
      data: {
        marketCap: formatLargeNumber(price.marketCap?.raw),
        peRatio: summary.trailingPE?.fmt || keyStats.trailingPE?.fmt || 'N/A',
        eps: keyStats.trailingEps?.fmt || 'N/A',
        dividendYield: summary.dividendYield?.fmt || 'N/A',
        fiftyTwoWeekLow: summary.fiftyTwoWeekLow?.fmt || `$${summary.fiftyTwoWeekLow?.raw?.toFixed(2)}` || 'N/A',
        fiftyTwoWeekHigh: summary.fiftyTwoWeekHigh?.fmt || `$${summary.fiftyTwoWeekHigh?.raw?.toFixed(2)}` || 'N/A',
        volume: formatLargeNumber(price.regularMarketVolume?.raw),
        avgVolume: formatLargeNumber(summary.averageVolume?.raw),
        beta: summary.beta?.fmt || 'N/A',
        open: price.regularMarketOpen?.fmt,
        previousClose: price.regularMarketPreviousClose?.fmt,
        dayRange: `${summary.dayLow?.fmt} - ${summary.dayHigh?.fmt}`,
        shortName: price.shortName || symbol,
        longName: price.longName || symbol,
      }
    };
  } catch (error) {
    console.error('[QuoteData] Failed to fetch quote data:', error.message);
    return { success: false, error: error.message };
  }
};

// Finnhub fallback for quote data
const fetchFinnhubQuoteData = async (symbol, apiKey) => {
  if (!apiKey) return { success: false, error: 'No API key' };
  
  console.log(`[QuoteData] Trying Finnhub fallback for ${symbol}...`);
  
  try {
    // Fetch basic quote and company metrics in parallel
    const [quoteRes, metricsRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`),
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`)
    ]);
    
    if (!quoteRes.ok || !metricsRes.ok) {
      throw new Error('Finnhub API request failed');
    }
    
    const quote = await quoteRes.json();
    const metrics = await metricsRes.json();
    const m = metrics.metric || {};
    
    console.log(`[QuoteData] Finnhub success - 52W High: ${m['52WeekHigh']}, PE: ${m.peBasicExclExtraTTM}`);
    
    // Safe number formatting helper
    const safeToFixed = (value, decimals = 2) => {
      return value != null && !isNaN(value) ? value.toFixed(decimals) : null;
    };
    
    return {
      success: true,
      data: {
        marketCap: m.marketCapitalization ? formatLargeNumber(m.marketCapitalization * 1000000) : 'N/A',
        peRatio: safeToFixed(m.peBasicExclExtraTTM) || safeToFixed(m.peTTM) || 'N/A',
        eps: safeToFixed(m.epsBasicExclExtraItemsTTM) || safeToFixed(m.epsTTM) || 'N/A',
        dividendYield: safeToFixed(m.dividendYieldIndicatedAnnual) ? `${safeToFixed(m.dividendYieldIndicatedAnnual)}%` : 'N/A',
        fiftyTwoWeekLow: safeToFixed(m['52WeekLow']) ? `$${safeToFixed(m['52WeekLow'])}` : 'N/A',
        fiftyTwoWeekHigh: safeToFixed(m['52WeekHigh']) ? `$${safeToFixed(m['52WeekHigh'])}` : 'N/A',
        volume: m['10DayAverageTradingVolume'] ? formatLargeNumber(m['10DayAverageTradingVolume'] * 1000000) : 'N/A',
        avgVolume: m['3MonthAverageTradingVolume'] ? formatLargeNumber(m['3MonthAverageTradingVolume'] * 1000000) : 'N/A',
        beta: safeToFixed(m.beta) || 'N/A',
        open: safeToFixed(quote.o) ? `$${safeToFixed(quote.o)}` : 'N/A',
        previousClose: safeToFixed(quote.pc) ? `$${safeToFixed(quote.pc)}` : 'N/A',
        dayRange: (safeToFixed(quote.l) && safeToFixed(quote.h)) ? `$${safeToFixed(quote.l)} - $${safeToFixed(quote.h)}` : 'N/A',
        shortName: symbol,
        longName: symbol,
      }
    };
  } catch (error) {
    console.error('[QuoteData] Finnhub fallback failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Combined quote data fetcher with fallbacks
const fetchQuoteDataWithFallback = async (symbol, apiKeys = {}) => {
  // Try Yahoo Finance first (via CORS proxy)
  const yahooResult = await fetchQuoteData(symbol);
  if (yahooResult.success) {
    return yahooResult;
  }
  
  // Fallback to Finnhub
  if (apiKeys.finnhub) {
    const finnhubResult = await fetchFinnhubQuoteData(symbol, apiKeys.finnhub);
    if (finnhubResult.success) {
      return finnhubResult;
    }
  }
  
  // All sources failed
  return { success: false, error: 'All quote data sources failed' };
};

// ============================================================================
// NEWS FETCHING
// ============================================================================

const fetchNews = async (symbol, companyName, apiKeys = {}) => {
  // Collect news from multiple sources for diversity
  let allNews = [];
  
  // 1. Try Finnhub News
  if (apiKeys.finnhub) {
    const finnhubResult = await fetchFinnhubNews(symbol, apiKeys.finnhub);
    if (finnhubResult.success && finnhubResult.news.length > 0) {
      allNews = [...allNews, ...finnhubResult.news];
    }
  }
  
  // 2. Try NewsAPI (adds diversity)
  if (apiKeys.newsApi) {
    const newsApiResult = await fetchNewsApiNews(symbol, companyName, apiKeys.newsApi);
    if (newsApiResult.success && newsApiResult.news.length > 0) {
      // Add news that aren't duplicates (by checking title similarity)
      const existingTitles = new Set(allNews.map(n => n.title.toLowerCase().slice(0, 50)));
      const uniqueNews = newsApiResult.news.filter(n => 
        !existingTitles.has(n.title.toLowerCase().slice(0, 50))
      );
      allNews = [...allNews, ...uniqueNews];
    }
  }
  
  // If we got news from APIs, return them (deduplicated and limited)
  if (allNews.length > 0) {
    // Sort by most recent and limit to 10
    const uniqueNews = allNews.slice(0, 10).map((n, i) => ({ ...n, id: i }));
    return { success: true, news: uniqueNews };
  }
  
  // 3. Fallback to Google News RSS if no API news
  try {
    const searchQuery = encodeURIComponent(`${symbol} stock OR ${companyName} stock market`);
    const url = `https://news.google.com/rss/search?q=${searchQuery}&hl=en-US&gl=US&ceid=US:en`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('News fetch failed');
    
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');
    
    const news = Array.from(items).slice(0, 8).map((item, index) => {
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '#';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const source = item.querySelector('source')?.textContent || 'News';
      
      // Parse relative time
      const date = new Date(pubDate);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      let timeAgo;
      if (diffHours < 1) timeAgo = 'Just now';
      else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
      else if (diffDays === 1) timeAgo = 'Yesterday';
      else timeAgo = `${diffDays}d ago`;
      
      return {
        id: index,
        title: title.replace(/ - .*$/, ''), // Remove source suffix
        source,
        time: timeAgo,
        url: link,
        isBreaking: diffHours < 2,
      };
    });
    
    return { success: true, news };
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// AI ANALYSIS - Claude Integration
// ============================================================================

const fetchAIAnalysis = async (symbol, chartData, quoteData, companyName, claudeApiKey) => {
  // Check if Claude API key is provided
  if (!claudeApiKey) {
    console.log('No Claude API key provided, using fallback analysis');
    return {
      success: false,
      analysis: generateFallbackAnalysis(chartData, symbol, quoteData)
    };
  }
  
  try {
    // Calculate technical indicators for context
    const rsi = calculateRSI(chartData);
    const macd = calculateMACD(chartData);
    const sma20 = calculateSMA(chartData, 20);
    const sma50 = calculateSMA(chartData, 50);
    const sma200 = calculateSMA(chartData, 200);
    
    const currentPrice = chartData[chartData.length - 1]?.close;
    const previousPrice = chartData[0]?.open;
    const priceChange = ((currentPrice - previousPrice) / previousPrice * 100).toFixed(2);
    
    // Prepare ALL price data with indices for pattern detection (professional traders analyze full timeframe)
    const pricePoints = chartData.map((d, i) => ({
      index: i,
      date: d.date,
      high: d.high,
      low: d.low,
      close: d.close
    }));
    
    // Get price range for structure analysis
    const highPrices = chartData.map(d => d.high).filter(Boolean);
    const lowPrices = chartData.map(d => d.low).filter(Boolean);
    const minLow = Math.min(...lowPrices);
    const maxHigh = Math.max(...highPrices);
    
    // Sample data points evenly across the ENTIRE timeframe for comprehensive analysis
    const sampleSize = Math.min(50, chartData.length);
    const step = Math.max(1, Math.floor(chartData.length / sampleSize));
    const sampledPoints = [];
    for (let i = 0; i < chartData.length; i += step) {
      sampledPoints.push(pricePoints[i]);
    }
    // Always include the last point
    if (sampledPoints[sampledPoints.length - 1]?.index !== chartData.length - 1) {
      sampledPoints.push(pricePoints[chartData.length - 1]);
    }
    
    // Format values with fallbacks
    const companyDisplay = companyName || symbol;
    const rsiDisplay = rsi !== null ? rsi.toFixed(1) : 'Insufficient data';
    const macdDisplay = macd !== null ? macd.toFixed(2) : 'Insufficient data';
    const sma20Display = sma20 !== null ? `$${sma20.toFixed(2)}` : 'Insufficient data';
    const sma50Display = sma50 !== null ? `$${sma50.toFixed(2)}` : 'Insufficient data';
    
    const prompt = `You are a professional technical analyst. Analyze the COMPLETE price data across the entire timeframe to identify chart patterns. Professional traders analyze the full chart history, not just recent data.

Stock: ${symbol} (${companyDisplay})
Current Price: $${currentPrice?.toFixed(2) || 'N/A'}
Period Change: ${priceChange}%
Total Data Points: ${chartData.length} candles (FULL TIMEFRAME)
Price Range: $${minLow.toFixed(2)} - $${maxHigh.toFixed(2)}

Technical Indicators:
- RSI (14): ${rsiDisplay}
- MACD: ${macdDisplay}
- SMA 20: ${sma20Display}
- SMA 50: ${sma50Display}

COMPLETE Price Data sampled across entire timeframe (index, high, low, close):
${sampledPoints.map(p => `[${p.index}, ${p.high?.toFixed(2)}, ${p.low?.toFixed(2)}, ${p.close?.toFixed(2)}]`).join('\n')}

Analyze the ENTIRE price history above to identify the PRIMARY chart pattern. Look for patterns that span the full timeframe, not just recent candles. Common patterns include:
- Double Bottom/Top
- Head and Shoulders / Inverse Head and Shoulders  
- Bull/Bear Flag
- Bull/Bear Pennant
- Rising/Falling Wedge
- Cup and Handle / Inverse Cup and Handle
- Triple Top/Bottom
- Ascending/Descending/Symmetrical Triangle
- Ascending/Descending Channel
- Expanding Wedge
- Bullish/Bearish Rectangle

Return the pattern as a series of connected points that trace the pattern structure across the ENTIRE chart.
Pattern points should span from early in the data to recent, showing the full pattern formation.

Respond ONLY with valid JSON (no markdown):
{
  "signal": "BULLISH" or "BEARISH" or "NEUTRAL",
  "confidence": <number 1-100>,
  "pattern": "<exact pattern name from list above>",
  "summary": "<2-3 sentence analysis explaining the pattern formation across the timeframe>",
  "priceStructure": {
    "patternPoints": [
      {"index": <candle index from 0 to ${chartData.length - 1}>, "price": <price at that point>},
      ... (6-12 points that trace the COMPLETE pattern shape across the full timeframe)
    ],
    "support": <key support price level>,
    "resistance": <key resistance price level>,
    "projectedTarget": <price target based on pattern breakout/breakdown>
  }
}

IMPORTANT: The patternPoints should trace KEY TURNING POINTS across the ENTIRE timeframe, starting from earlier data points. Include swing highs and lows that form the pattern structure.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API error:', errorData);
      throw new Error(errorData.error?.message || 'AI analysis request failed');
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';
    
    // Parse JSON response
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const analysis = JSON.parse(cleanContent);
    
    return {
      success: true,
      analysis: {
        signal: analysis.signal || 'NEUTRAL',
        confidence: Math.min(100, Math.max(0, analysis.confidence || 50)),
        pattern: analysis.pattern || 'Analyzing...',
        summary: analysis.summary || 'Unable to generate analysis.',
        priceStructure: analysis.priceStructure || null,
      }
    };
  } catch (error) {
    console.error('AI analysis failed:', error);
    // Fallback to rule-based analysis
    return {
      success: false,
      analysis: generateFallbackAnalysis(chartData, symbol)
    };
  }
};

const generateFallbackAnalysis = (chartData, symbol = 'Stock', quoteData = null) => {
  // Guard against empty or too short data
  if (!chartData || chartData.length < 5) {
    return {
      signal: 'NEUTRAL',
      confidence: 50,
      pattern: 'Insufficient Data',
      summary: `${symbol} has insufficient data for analysis.`,
      priceStructure: { patternPoints: [], support: 0, resistance: 0, projectedTarget: 0 }
    };
  }
  
  const rsi = calculateRSI(chartData);
  const macd = calculateMACD(chartData);
  const sma20 = calculateSMA(chartData, 20);
  const sma50 = calculateSMA(chartData, 50);
  
  const currentPrice = chartData[chartData.length - 1]?.close;
  const priceAboveSMA20 = sma20 && currentPrice > sma20;
  const priceAboveSMA50 = sma50 && currentPrice > sma50;
  
  // Use symbol fallback
  const tickerDisplay = symbol || 'This stock';
  
  // Calculate dynamic support/resistance levels
  const srLevels = calculateSupportResistance(chartData);
  const support = srLevels.nearestSupport;
  const resistance = srLevels.nearestResistance;
  
  // Calculate price structure using ALL historical data
  const highPrices = chartData.map(d => d.high).filter(Boolean);
  const lowPrices = chartData.map(d => d.low).filter(Boolean);
  
  // Detect swing highs and lows across the ENTIRE timeframe for pattern points
  // Use adaptive lookback based on total data length for proper pattern detection
  const patternPoints = [];
  const lookback = Math.max(2, Math.floor(chartData.length / 15)); // Adaptive lookback for full chart
  
  for (let i = lookback; i < chartData.length - lookback; i++) {
    const current = chartData[i];
    let isSwingHigh = true;
    let isSwingLow = true;
    
    for (let j = 1; j <= lookback; j++) {
      if (chartData[i - j].high >= current.high || chartData[i + j].high >= current.high) {
        isSwingHigh = false;
      }
      if (chartData[i - j].low <= current.low || chartData[i + j].low <= current.low) {
        isSwingLow = false;
      }
    }
    
    if (isSwingHigh) {
      patternPoints.push({ index: i, price: parseFloat(current.high.toFixed(2)), type: 'high' });
    }
    if (isSwingLow) {
      patternPoints.push({ index: i, price: parseFloat(current.low.toFixed(2)), type: 'low' });
    }
  }
  
  // Sort by index to ensure chronological order
  patternPoints.sort((a, b) => a.index - b.index);
  
  // Keep most significant points across the ENTIRE timeframe (not just recent)
  let finalPoints = patternPoints;
  if (patternPoints.length > 12) {
    // Keep alternating highs and lows for cleaner pattern, spanning full timeframe
    const filtered = [];
    let lastType = null;
    for (const point of patternPoints) {
      if (point.type !== lastType) {
        filtered.push(point);
        lastType = point.type;
      } else if (filtered.length > 0) {
        // Replace if this point is more extreme
        const last = filtered[filtered.length - 1];
        if ((point.type === 'high' && point.price > last.price) ||
            (point.type === 'low' && point.price < last.price)) {
          filtered[filtered.length - 1] = point;
        }
      }
    }
    // Keep points distributed across the entire timeframe (first, evenly spaced, and last)
    if (filtered.length > 12) {
      const step = Math.floor(filtered.length / 10);
      const distributed = [];
      for (let i = 0; i < filtered.length; i += step) {
        distributed.push(filtered[i]);
      }
      // Always include the last swing point
      if (distributed[distributed.length - 1] !== filtered[filtered.length - 1]) {
        distributed.push(filtered[filtered.length - 1]);
      }
      finalPoints = distributed;
    } else {
      finalPoints = filtered;
    }
  }
  
  // Add first candle if not already included (to show full pattern from start)
  if (finalPoints.length > 0 && finalPoints[0].index > 2) {
    const firstCandle = chartData[0];
    finalPoints.unshift({
      index: 0,
      price: parseFloat(firstCandle.close.toFixed(2)),
      type: firstCandle.close > firstCandle.open ? 'high' : 'low'
    });
  }
  
  // Add current price as final point if not too close to last point
  if (finalPoints.length > 0 && finalPoints[finalPoints.length - 1].index < chartData.length - 3) {
    finalPoints.push({ 
      index: chartData.length - 1, 
      price: parseFloat(currentPrice.toFixed(2)),
      type: currentPrice > finalPoints[finalPoints.length - 1].price ? 'high' : 'low'
    });
  }
  
  // Calculate trend from first to last for projection
  const startPrice = chartData[0]?.close || currentPrice;
  const trendSlope = (currentPrice - startPrice) / chartData.length;
  const projectedTarget = currentPrice + (trendSlope * Math.floor(chartData.length * 0.2));
  
  let signal = 'NEUTRAL';
  let confidence = 50;
  let pattern = 'Consolidation';
  
  // Detect pattern type based on swing points across FULL timeframe
  if (finalPoints.length >= 4) {
    const highs = finalPoints.filter(p => p.type === 'high');
    const lows = finalPoints.filter(p => p.type === 'low');
    
    if (highs.length >= 2 && lows.length >= 2) {
      const highsTrend = highs[highs.length - 1].price - highs[0].price;
      const lowsTrend = lows[lows.length - 1].price - lows[0].price;
      
      if (highsTrend > 0 && lowsTrend > 0) {
        pattern = 'Ascending Channel';
        signal = 'BULLISH';
      } else if (highsTrend < 0 && lowsTrend < 0) {
        pattern = 'Descending Channel';
        signal = 'BEARISH';
      } else if (highsTrend < 0 && lowsTrend > 0) {
        pattern = 'Symmetrical Triangle';
      } else if (highsTrend > 0 && lowsTrend < 0) {
        pattern = 'Expanding Wedge';
      }
    }
  }
  
  if (rsi && macd !== null) {
    const bullishSignals = [rsi > 50 && rsi < 70, macd > 0, priceAboveSMA20, priceAboveSMA50].filter(Boolean).length;
    const bearishSignals = [rsi < 50 && rsi > 30, macd < 0, !priceAboveSMA20, !priceAboveSMA50].filter(Boolean).length;
    
    if (bullishSignals >= 3) {
      signal = 'BULLISH';
      confidence = 60 + bullishSignals * 8;
      if (pattern === 'Consolidation') pattern = rsi > 60 ? 'Momentum Breakout' : 'Ascending Channel';
    } else if (bearishSignals >= 3) {
      signal = 'BEARISH';
      confidence = 60 + bearishSignals * 8;
      if (pattern === 'Consolidation') pattern = rsi < 40 ? 'Breakdown Pattern' : 'Descending Channel';
    } else {
      confidence = 45 + Math.abs(bullishSignals - bearishSignals) * 5;
    }
  }
  
  const rsiDisplay = rsi !== null ? rsi.toFixed(1) : 'calculating';
  const macdDisplay = macd !== null ? macd.toFixed(2) : 'calculating';
  
  const summary = `${tickerDisplay} is showing a ${pattern} pattern with ${signal.toLowerCase()} bias. RSI at ${rsiDisplay} and MACD at ${macdDisplay}. Price is ${priceAboveSMA20 ? 'above' : 'below'} the 20-day SMA. ${signal === 'BULLISH' ? 'Structure suggests continued upside.' : signal === 'BEARISH' ? 'Structure suggests downside risk.' : 'Waiting for breakout direction.'}`;
  
  // Build detailed reasoning for transparency
  const reasoning = {
    method: 'Rule-Based Technical Analysis',
    indicators: [
      {
        name: 'RSI (14)',
        value: rsi !== null ? rsi.toFixed(1) : 'N/A',
        interpretation: rsi === null ? 'Insufficient data' :
          rsi > 70 ? 'Overbought (bearish signal)' :
          rsi > 50 ? 'Above midline (bullish bias)' :
          rsi > 30 ? 'Below midline (bearish bias)' :
          'Oversold (bullish signal)',
        signal: rsi === null ? 'neutral' : rsi > 50 ? 'bullish' : 'bearish'
      },
      {
        name: 'MACD',
        value: macd !== null ? macd.toFixed(2) : 'N/A',
        interpretation: macd === null ? 'Insufficient data' :
          macd > 0 ? 'Positive (bullish momentum)' : 'Negative (bearish momentum)',
        signal: macd === null ? 'neutral' : macd > 0 ? 'bullish' : 'bearish'
      },
      {
        name: 'Price vs SMA 20',
        value: sma20 ? `$${sma20.toFixed(2)}` : 'N/A',
        interpretation: !sma20 ? 'Insufficient data' :
          priceAboveSMA20 ? 'Price above SMA (bullish)' : 'Price below SMA (bearish)',
        signal: !sma20 ? 'neutral' : priceAboveSMA20 ? 'bullish' : 'bearish'
      },
      {
        name: 'Price vs SMA 50',
        value: sma50 ? `$${sma50.toFixed(2)}` : 'N/A',
        interpretation: !sma50 ? 'Insufficient data' :
          priceAboveSMA50 ? 'Price above SMA (bullish)' : 'Price below SMA (bearish)',
        signal: !sma50 ? 'neutral' : priceAboveSMA50 ? 'bullish' : 'bearish'
      }
    ],
    patternLogic: `Pattern "${pattern}" detected by analyzing ${finalPoints.length} swing points across the chart. ${
      pattern.includes('Ascending') ? 'Higher highs and higher lows indicate upward trend.' :
      pattern.includes('Descending') ? 'Lower highs and lower lows indicate downward trend.' :
      pattern.includes('Triangle') ? 'Converging price action suggests pending breakout.' :
      pattern.includes('Breakout') || pattern.includes('Momentum') ? 'Strong directional move detected.' :
      'No clear directional pattern; price consolidating.'
    }`,
    signalLogic: `Signal determined by counting bullish vs bearish indicators. ${
      signal === 'BULLISH' ? 'Majority of indicators show bullish bias.' :
      signal === 'BEARISH' ? 'Majority of indicators show bearish bias.' :
      'Mixed signals - no clear directional bias.'
    }`,
    supportResistance: {
      support: support ? `$${support.toFixed(2)}` : 'N/A',
      resistance: resistance ? `$${resistance.toFixed(2)}` : 'N/A',
      logic: 'Calculated using pivot point clustering on swing highs/lows'
    }
  };
  
  const priceStructure = {
    patternPoints: finalPoints.map(p => ({ index: p.index, price: p.price })),
    support: parseFloat(support.toFixed(2)),
    resistance: parseFloat(resistance.toFixed(2)),
    projectedTarget: parseFloat(projectedTarget.toFixed(2))
  };
  
  return { signal, confidence, pattern, summary, priceStructure, reasoning };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Calculate dynamic support and resistance levels using pivot point clustering
const calculateSupportResistance = (chartData) => {
  if (!chartData || chartData.length < 10) {
    return { supports: [], resistances: [], nearestSupport: null, nearestResistance: null };
  }
  
  const currentPrice = chartData[chartData.length - 1]?.close;
  const priceRange = Math.max(...chartData.map(d => d.high)) - Math.min(...chartData.map(d => d.low));
  const tolerance = priceRange * 0.015; // 1.5% tolerance for clustering
  
  // Step 1: Find all pivot points (local highs and lows)
  const pivots = [];
  const lookback = Math.max(2, Math.floor(chartData.length / 20));
  
  for (let i = lookback; i < chartData.length - lookback; i++) {
    const current = chartData[i];
    let isSwingHigh = true;
    let isSwingLow = true;
    
    for (let j = 1; j <= lookback; j++) {
      if (chartData[i - j].high >= current.high || chartData[i + j].high >= current.high) {
        isSwingHigh = false;
      }
      if (chartData[i - j].low <= current.low || chartData[i + j].low <= current.low) {
        isSwingLow = false;
      }
    }
    
    if (isSwingHigh) {
      pivots.push({ 
        price: current.high, 
        type: 'high', 
        index: i, 
        volume: current.volume || 0,
        recency: i / chartData.length // 0-1, higher = more recent
      });
    }
    if (isSwingLow) {
      pivots.push({ 
        price: current.low, 
        type: 'low', 
        index: i, 
        volume: current.volume || 0,
        recency: i / chartData.length
      });
    }
  }
  
  // Step 2: Cluster nearby pivots into price levels
  const clusters = [];
  const used = new Set();
  
  for (let i = 0; i < pivots.length; i++) {
    if (used.has(i)) continue;
    
    const cluster = {
      pivots: [pivots[i]],
      avgPrice: pivots[i].price,
      touches: 1,
      totalVolume: pivots[i].volume,
      avgRecency: pivots[i].recency,
      type: pivots[i].type
    };
    used.add(i);
    
    // Find all pivots within tolerance
    for (let j = i + 1; j < pivots.length; j++) {
      if (used.has(j)) continue;
      if (Math.abs(pivots[j].price - cluster.avgPrice) <= tolerance) {
        cluster.pivots.push(pivots[j]);
        cluster.touches++;
        cluster.totalVolume += pivots[j].volume;
        cluster.avgRecency = (cluster.avgRecency * (cluster.touches - 1) + pivots[j].recency) / cluster.touches;
        cluster.avgPrice = cluster.pivots.reduce((sum, p) => sum + p.price, 0) / cluster.pivots.length;
        // Update type if mixed
        if (pivots[j].type !== cluster.type) cluster.type = 'both';
        used.add(j);
      }
    }
    
    clusters.push(cluster);
  }
  
  // Step 3: Score each cluster
  const maxVolume = Math.max(...clusters.map(c => c.totalVolume), 1);
  
  clusters.forEach(cluster => {
    // Score based on: touches (most important), volume, recency
    const touchScore = Math.min(cluster.touches * 25, 50); // Up to 50 points for touches
    const volumeScore = (cluster.totalVolume / maxVolume) * 25; // Up to 25 points for volume
    const recencyScore = cluster.avgRecency * 25; // Up to 25 points for recency
    cluster.strength = touchScore + volumeScore + recencyScore;
    cluster.level = parseFloat(cluster.avgPrice.toFixed(2));
  });
  
  // Step 4: Separate into support and resistance relative to current price
  const supports = clusters
    .filter(c => c.level < currentPrice)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)
    .map(c => ({
      price: c.level,
      strength: Math.round(c.strength),
      touches: c.touches,
      type: c.touches >= 3 ? 'strong' : c.touches >= 2 ? 'moderate' : 'weak'
    }))
    .sort((a, b) => b.price - a.price); // Sort by price descending (nearest first)
  
  const resistances = clusters
    .filter(c => c.level > currentPrice)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)
    .map(c => ({
      price: c.level,
      strength: Math.round(c.strength),
      touches: c.touches,
      type: c.touches >= 3 ? 'strong' : c.touches >= 2 ? 'moderate' : 'weak'
    }))
    .sort((a, b) => a.price - b.price); // Sort by price ascending (nearest first)
  
  // Fallback to simple min/max if no pivots found
  const nearestSupport = supports[0]?.price || Math.min(...chartData.map(d => d.low));
  const nearestResistance = resistances[0]?.price || Math.max(...chartData.map(d => d.high));
  
  return {
    supports,
    resistances,
    nearestSupport: parseFloat(nearestSupport.toFixed(2)),
    nearestResistance: parseFloat(nearestResistance.toFixed(2)),
    currentPrice: parseFloat(currentPrice.toFixed(2))
  };
};

const formatLargeNumber = (num) => {
  if (!num) return 'N/A';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  return num.toLocaleString();
};

// ============================================================================
// TECHNICAL INDICATOR CALCULATIONS
// ============================================================================

// Calculate RSI for a single point (legacy - for quick calculations)
const calculateRSI = (data, period = 14) => {
  if (data.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const currentClose = data[i]?.close;
    const previousClose = data[i - 1]?.close;
    if (currentClose == null || previousClose == null) continue;
    const change = currentClose - previousClose;
    if (change > 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - (100 / (1 + rs))).toFixed(1));
};

// Calculate RSI array for charting
const calculateRSIArray = (data, period = 14) => {
  const rsiArray = [];
  if (data.length < period + 1) return data.map(() => null);
  
  // Calculate initial average gain/loss
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;
  
  // First RSI value
  for (let i = 0; i < period; i++) rsiArray.push(null);
  const firstRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsiArray.push(parseFloat((100 - (100 / (1 + firstRS))).toFixed(1)));
  
  // Subsequent RSI values using smoothed averages
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiArray.push(parseFloat((100 - (100 / (1 + rs))).toFixed(1)));
  }
  
  return rsiArray;
};

const calculateSMA = (data, period) => {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  const sum = slice.reduce((acc, d) => acc + d.close, 0);
  return parseFloat((sum / period).toFixed(2));
};

// Calculate SMA array for charting
const calculateSMAArray = (data, period, key = 'close') => {
  const smaArray = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      smaArray.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j][key];
      }
      smaArray.push(parseFloat((sum / period).toFixed(2)));
    }
  }
  return smaArray;
};

// Calculate EMA array for charting
const calculateEMAArray = (data, period) => {
  const emaArray = [];
  if (data.length < period) return data.map(() => null);
  
  const k = 2 / (period + 1);
  let ema = 0;
  
  // Calculate initial SMA as first EMA
  for (let i = 0; i < period; i++) {
    ema += data[i].close;
    emaArray.push(null);
  }
  ema /= period;
  emaArray[period - 1] = parseFloat(ema.toFixed(2));
  
  // Calculate subsequent EMAs
  for (let i = period; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    emaArray.push(parseFloat(ema.toFixed(2)));
  }
  
  return emaArray;
};

const calculateMACD = (data) => {
  if (data.length < 26) return null;
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  if (!ema12 || !ema26) return null;
  return parseFloat((ema12 - ema26).toFixed(2));
};

// Calculate full MACD with signal line and histogram
const calculateMACDFull = (data) => {
  if (data.length < 35) return { macd: [], signal: [], histogram: [] };
  
  const ema12 = calculateEMAArray(data, 12);
  const ema26 = calculateEMAArray(data, 26);
  
  // Calculate MACD line
  const macdLine = [];
  for (let i = 0; i < data.length; i++) {
    if (ema12[i] === null || ema26[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(parseFloat((ema12[i] - ema26[i]).toFixed(3)));
    }
  }
  
  // Calculate Signal line (9-period EMA of MACD)
  const signalLine = [];
  const k = 2 / 10;
  let signalEma = null;
  let validCount = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
    } else {
      validCount++;
      if (validCount < 9) {
        signalLine.push(null);
      } else if (validCount === 9) {
        // First signal value is SMA of first 9 MACD values
        let sum = 0;
        let count = 0;
        for (let j = 0; j <= i; j++) {
          if (macdLine[j] !== null) {
            sum += macdLine[j];
            count++;
            if (count >= 9) break;
          }
        }
        signalEma = sum / 9;
        signalLine.push(parseFloat(signalEma.toFixed(3)));
      } else {
        signalEma = macdLine[i] * k + signalEma * (1 - k);
        signalLine.push(parseFloat(signalEma.toFixed(3)));
      }
    }
  }
  
  // Calculate Histogram
  const histogram = [];
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null || signalLine[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(parseFloat((macdLine[i] - signalLine[i]).toFixed(3)));
    }
  }
  
  return { macd: macdLine, signal: signalLine, histogram };
};

const calculateEMA = (data, period) => {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((acc, d) => acc + d.close, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
  }
  return ema;
};

// Calculate Bollinger Bands
const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
  const upper = [], middle = [], lower = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      middle.push(null);
      lower.push(null);
    } else {
      // Calculate SMA
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j].close;
      }
      const sma = sum / period;
      
      // Calculate Standard Deviation
      let sqSum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sqSum += Math.pow(data[j].close - sma, 2);
      }
      const std = Math.sqrt(sqSum / period);
      
      middle.push(parseFloat(sma.toFixed(2)));
      upper.push(parseFloat((sma + stdDev * std).toFixed(2)));
      lower.push(parseFloat((sma - stdDev * std).toFixed(2)));
    }
  }
  
  return { upper, middle, lower };
};

// Calculate ATR (Average True Range)
const calculateATR = (data, period = 14) => {
  const atrArray = [];
  const trArray = [];
  
  // Calculate True Range
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      trArray.push(data[i].high - data[i].low);
    } else {
      const tr = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      );
      trArray.push(tr);
    }
  }
  
  // Calculate ATR using Wilder's smoothing
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      atrArray.push(null);
    } else if (i === period - 1) {
      // First ATR is simple average
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += trArray[j];
      }
      atrArray.push(parseFloat((sum / period).toFixed(2)));
    } else {
      // Subsequent ATR uses smoothing
      const prevATR = atrArray[i - 1];
      const atr = (prevATR * (period - 1) + trArray[i]) / period;
      atrArray.push(parseFloat(atr.toFixed(2)));
    }
  }
  
  return atrArray;
};

// Calculate Volume SMA
const calculateVolumeSMA = (data, period = 20) => {
  const volSMA = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      volSMA.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j].volume;
      }
      volSMA.push(Math.round(sum / period));
    }
  }
  return volSMA;
};

// Calculate Relative Strength vs SPY (requires SPY data)
const calculateRelativeStrength = (stockData, spyData, period = 20) => {
  if (!spyData || spyData.length !== stockData.length) return stockData.map(() => null);
  
  const rs = [];
  for (let i = 0; i < stockData.length; i++) {
    if (i < period - 1) {
      rs.push(null);
    } else {
      const stockChange = (stockData[i].close - stockData[i - period + 1].close) / stockData[i - period + 1].close;
      const spyChange = (spyData[i].close - spyData[i - period + 1].close) / spyData[i - period + 1].close;
      const relStrength = ((1 + stockChange) / (1 + spyChange) - 1) * 100;
      rs.push(parseFloat(relStrength.toFixed(2)));
    }
  }
  return rs;
};

// Detect Bollinger Squeeze
const detectBollingerSqueeze = (data, period = 20) => {
  const bb = calculateBollingerBands(data, period);
  const squeezeThreshold = 0.04; // 4% bandwidth is considered tight
  
  const lastIndex = data.length - 1;
  if (bb.upper[lastIndex] === null || bb.lower[lastIndex] === null) return false;
  
  const bandwidth = (bb.upper[lastIndex] - bb.lower[lastIndex]) / bb.middle[lastIndex];
  
  // Check if current bandwidth is in lowest 20% of recent history
  const recentBandwidths = [];
  for (let i = Math.max(0, lastIndex - 50); i <= lastIndex; i++) {
    if (bb.upper[i] !== null && bb.lower[i] !== null) {
      recentBandwidths.push((bb.upper[i] - bb.lower[i]) / bb.middle[i]);
    }
  }
  recentBandwidths.sort((a, b) => a - b);
  const percentile = recentBandwidths.indexOf(bandwidth) / recentBandwidths.length;
  
  return bandwidth < squeezeThreshold || percentile < 0.2;
};

// Detect RSI Divergence
const detectRSIDivergence = (data, rsiArray) => {
  if (data.length < 20) return { bullish: false, bearish: false };
  
  const lookback = 14;
  const lastIndex = data.length - 1;
  
  // Find recent swing lows/highs in price
  let priceLow1 = Infinity, priceLow1Idx = -1;
  let priceLow2 = Infinity, priceLow2Idx = -1;
  let priceHigh1 = -Infinity, priceHigh1Idx = -1;
  let priceHigh2 = -Infinity, priceHigh2Idx = -1;
  
  // Find two most recent swing lows
  for (let i = lastIndex; i > lastIndex - lookback && i >= 2; i--) {
    if (data[i].low < data[i - 1].low && data[i].low < data[i + 1]?.low) {
      if (priceLow1Idx === -1) {
        priceLow1 = data[i].low;
        priceLow1Idx = i;
      } else if (priceLow2Idx === -1) {
        priceLow2 = data[i].low;
        priceLow2Idx = i;
        break;
      }
    }
  }
  
  // Find two most recent swing highs
  for (let i = lastIndex; i > lastIndex - lookback && i >= 2; i--) {
    if (data[i].high > data[i - 1].high && data[i].high > data[i + 1]?.high) {
      if (priceHigh1Idx === -1) {
        priceHigh1 = data[i].high;
        priceHigh1Idx = i;
      } else if (priceHigh2Idx === -1) {
        priceHigh2 = data[i].high;
        priceHigh2Idx = i;
        break;
      }
    }
  }
  
  // Bullish divergence: price making lower lows, RSI making higher lows
  let bullishDiv = false;
  if (priceLow1Idx !== -1 && priceLow2Idx !== -1 && 
      rsiArray[priceLow1Idx] !== null && rsiArray[priceLow2Idx] !== null) {
    if (priceLow1 < priceLow2 && rsiArray[priceLow1Idx] > rsiArray[priceLow2Idx]) {
      bullishDiv = true;
    }
  }
  
  // Bearish divergence: price making higher highs, RSI making lower highs
  let bearishDiv = false;
  if (priceHigh1Idx !== -1 && priceHigh2Idx !== -1 &&
      rsiArray[priceHigh1Idx] !== null && rsiArray[priceHigh2Idx] !== null) {
    if (priceHigh1 > priceHigh2 && rsiArray[priceHigh1Idx] < rsiArray[priceHigh2Idx]) {
      bearishDiv = true;
    }
  }
  
  return { bullish: bullishDiv, bearish: bearishDiv };
};

// Detect Volume Climax
const detectVolumeClimax = (data) => {
  if (data.length < 20) return false;
  
  const lastIndex = data.length - 1;
  const avgVolume = calculateVolumeSMA(data, 20)[lastIndex];
  
  if (!avgVolume) return false;
  
  const currentVolume = data[lastIndex].volume;
  const volumeRatio = currentVolume / avgVolume;
  
  // Volume climax = 2x+ average with reversal candle
  const isReversalCandle = Math.abs(data[lastIndex].close - data[lastIndex].open) < 
                           (data[lastIndex].high - data[lastIndex].low) * 0.3;
  
  return volumeRatio >= 2 && isReversalCandle;
};

// ============================================================================
// SWING TRADE SETUP DETECTION
// ============================================================================

const detectSwingSetups = (data, indicators) => {
  const setups = [];
  if (data.length < 50) return setups;
  
  const lastIndex = data.length - 1;
  const current = data[lastIndex];
  const { rsi, macd, bb, atr, volumeSMA } = indicators;
  
  const currentRSI = rsi[lastIndex];
  const currentMACD = macd.macd[lastIndex];
  const currentSignal = macd.signal[lastIndex];
  const currentHist = macd.histogram[lastIndex];
  const prevHist = macd.histogram[lastIndex - 1];
  const avgVolume = volumeSMA[lastIndex];
  const currentVolume = current.volume;
  const volumeRatio = avgVolume ? currentVolume / avgVolume : 1;
  
  // 1. Breakout Setup
  // Near resistance + volume surge + RSI not overbought
  const recentHigh = Math.max(...data.slice(-20).map(d => d.high));
  const nearResistance = current.close >= recentHigh * 0.98;
  if (nearResistance && volumeRatio > 1.5 && currentRSI < 70) {
    setups.push({
      type: 'Breakout',
      signal: 'BULLISH',
      confidence: Math.min(90, 60 + (volumeRatio * 10) + (70 - currentRSI)),
      description: 'Breaking resistance with volume confirmation'
    });
  }
  
  // 2. Pullback to Support
  // Uptrend + pulling back to SMA/support + RSI cooling off
  const sma20 = indicators.sma20[lastIndex];
  const sma50 = indicators.sma50[lastIndex];
  const inUptrend = sma20 && sma50 && current.close > sma50 && sma20 > sma50;
  const nearSMA20 = sma20 && Math.abs(current.close - sma20) / sma20 < 0.02;
  if (inUptrend && nearSMA20 && currentRSI >= 40 && currentRSI <= 55) {
    setups.push({
      type: 'Pullback',
      signal: 'BULLISH',
      confidence: Math.min(85, 55 + (55 - currentRSI) + (inUptrend ? 15 : 0)),
      description: 'Healthy pullback to 20 SMA in uptrend'
    });
  }
  
  // 3. Squeeze Breakout
  // Bollinger squeeze + volume uptick
  const isSqueeze = detectBollingerSqueeze(data);
  if (isSqueeze && volumeRatio > 1.2) {
    const direction = currentMACD > 0 ? 'BULLISH' : currentMACD < 0 ? 'BEARISH' : 'NEUTRAL';
    setups.push({
      type: 'Squeeze',
      signal: direction,
      confidence: Math.min(80, 50 + (volumeRatio * 15)),
      description: 'Volatility squeeze with breakout potential'
    });
  }
  
  // 4. RSI Divergence
  const divergence = detectRSIDivergence(data, rsi);
  if (divergence.bullish) {
    setups.push({
      type: 'RSI Divergence',
      signal: 'BULLISH',
      confidence: 70,
      description: 'Bullish RSI divergence - potential reversal'
    });
  }
  if (divergence.bearish) {
    setups.push({
      type: 'RSI Divergence',
      signal: 'BEARISH',
      confidence: 70,
      description: 'Bearish RSI divergence - potential reversal'
    });
  }
  
  // 5. Volume Climax
  if (detectVolumeClimax(data)) {
    const direction = current.close > current.open ? 'BEARISH' : 'BULLISH'; // Reversal expected
    setups.push({
      type: 'Volume Climax',
      signal: direction,
      confidence: 65,
      description: 'Exhaustion volume - watch for reversal'
    });
  }
  
  // 6. MACD Crossover
  if (currentMACD !== null && currentSignal !== null && prevHist !== null && currentHist !== null) {
    if (prevHist < 0 && currentHist > 0) {
      setups.push({
        type: 'MACD Cross',
        signal: 'BULLISH',
        confidence: 60,
        description: 'MACD crossed above signal line'
      });
    } else if (prevHist > 0 && currentHist < 0) {
      setups.push({
        type: 'MACD Cross',
        signal: 'BEARISH',
        confidence: 60,
        description: 'MACD crossed below signal line'
      });
    }
  }
  
  // 7. Oversold Bounce
  if (currentRSI <= 30 && current.close > current.open) {
    setups.push({
      type: 'Oversold Bounce',
      signal: 'BULLISH',
      confidence: Math.min(75, 50 + (30 - currentRSI) * 2),
      description: 'RSI oversold with bullish candle'
    });
  }
  
  // 8. Overbought Reversal
  if (currentRSI >= 70 && current.close < current.open) {
    setups.push({
      type: 'Overbought Reversal',
      signal: 'BEARISH',
      confidence: Math.min(75, 50 + (currentRSI - 70) * 2),
      description: 'RSI overbought with bearish candle'
    });
  }
  
  return setups;
};

// Calculate confidence score for a stock
const calculateConfidenceScore = (data, indicators) => {
  if (data.length < 50 || !indicators) return { score: 0, breakdown: {} };
  
  const lastIndex = data.length - 1;
  const current = data[lastIndex];
  
  let score = 0;
  const breakdown = {
    trend: 0,
    technical: 0,
    volume: 0,
    riskReward: 0,
    momentum: 0
  };
  
  // Trend Alignment (25 points)
  const sma20 = indicators.sma20[lastIndex];
  const sma50 = indicators.sma50[lastIndex];
  const sma200 = indicators.sma200?.[lastIndex];
  
  if (sma20 && current.close > sma20) breakdown.trend += 8;
  if (sma50 && current.close > sma50) breakdown.trend += 8;
  if (sma50 && sma20 && sma20 > sma50) breakdown.trend += 9; // Golden alignment
  
  // Technical Setup (25 points)
  const rsi = indicators.rsi[lastIndex];
  const macdHist = indicators.macd.histogram[lastIndex];
  const bb = indicators.bb;
  
  if (rsi >= 40 && rsi <= 60) breakdown.technical += 10; // Not extreme
  else if (rsi >= 30 && rsi <= 70) breakdown.technical += 5;
  
  if (macdHist > 0) breakdown.technical += 8;
  if (macdHist > indicators.macd.histogram[lastIndex - 1]) breakdown.technical += 7; // Rising histogram
  
  // Volume Confirmation (20 points)
  const avgVolume = indicators.volumeSMA[lastIndex];
  if (avgVolume) {
    const volumeRatio = current.volume / avgVolume;
    if (volumeRatio >= 1.5) breakdown.volume += 20;
    else if (volumeRatio >= 1.2) breakdown.volume += 15;
    else if (volumeRatio >= 1.0) breakdown.volume += 10;
    else breakdown.volume += 5;
  }
  
  // Risk/Reward (15 points)
  const atr = indicators.atr[lastIndex];
  if (atr && bb.lower[lastIndex]) {
    const stopDistance = current.close - bb.lower[lastIndex];
    const targetDistance = bb.upper[lastIndex] - current.close;
    const rrRatio = targetDistance / stopDistance;
    if (rrRatio >= 3) breakdown.riskReward += 15;
    else if (rrRatio >= 2) breakdown.riskReward += 12;
    else if (rrRatio >= 1.5) breakdown.riskReward += 8;
    else breakdown.riskReward += 4;
  }
  
  // Momentum (15 points)
  if (rsi > 50) breakdown.momentum += 5;
  if (macdHist > 0 && indicators.macd.macd[lastIndex] > indicators.macd.signal[lastIndex]) {
    breakdown.momentum += 10;
  }
  
  score = breakdown.trend + breakdown.technical + breakdown.volume + breakdown.riskReward + breakdown.momentum;
  
  return { score: Math.min(100, score), breakdown };
};

const generateSampleData = (candleCount, timeRange = '1M', basePrice = 178.50) => {
  const data = [];
  let currentPrice = basePrice;
  const now = new Date();
  
  for (let i = candleCount; i >= 0; i--) {
    const date = new Date(now);
    // Adjust time based on candle count to simulate different intervals
    if (candleCount <= 78) {
      // 5-min candles for 1D
      date.setMinutes(date.getMinutes() - i * 5);
    } else if (candleCount <= 130) {
      // 15-min candles for 1W
      date.setMinutes(date.getMinutes() - i * 15);
    } else if (candleCount <= 168) {
      // 1-hour candles for 1M
      date.setHours(date.getHours() - i);
    } else if (candleCount <= 252) {
      // 1-day candles for 3M/1Y
      date.setDate(date.getDate() - i);
    } else {
      // Monthly candles for ALL
      date.setMonth(date.getMonth() - i);
    }
    
    const volatility = 0.015 + Math.random() * 0.025;
    const trend = Math.sin(i / 12) * 0.008 + 0.001;
    const open = currentPrice;
    const change = (Math.random() - 0.48 + trend) * currentPrice * volatility;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * currentPrice * 0.008;
    const low = Math.min(open, close) - Math.random() * currentPrice * 0.008;
    
    data.push({
      date: formatDate(date, timeRange),
      fullDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      timestamp: Math.floor(date.getTime() / 1000),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 45000000) + 15000000,
      isUp: close >= open,
    });
    currentPrice = close;
  }
  return data;
};

const sampleNews = [
  { id: 1, title: "Add API keys to see real news for this ticker", source: "StockScope", time: "Now", url: "#", isBreaking: false },
  { id: 2, title: "Configure Finnhub or NewsAPI for live financial news", source: "Settings", time: "—", url: "#", isBreaking: false },
  { id: 3, title: "Click 'API Keys' in the header to get started", source: "Help", time: "—", url: "#", isBreaking: false },
];

// ============================================================================
// PATTERN DESCRIPTIONS FOR HOVER POPUP
// ============================================================================

const patternDescriptions = {
  'Double Top': {
    description: 'A bearish reversal pattern formed when price reaches a high twice with a moderate decline between the two highs. Signals potential trend reversal from bullish to bearish.',
    type: 'Reversal',
    signal: 'Bearish',
    position: { row: 0, col: 0 }
  },
  'Double Bottom': {
    description: 'A bullish reversal pattern formed when price reaches a low twice with a moderate rise between the two lows. Signals potential trend reversal from bearish to bullish.',
    type: 'Reversal',
    signal: 'Bullish',
    position: { row: 1, col: 0 }
  },
  'Head and Shoulders': {
    description: 'A bearish reversal pattern with three peaks - a higher middle peak (head) flanked by two lower peaks (shoulders). The neckline connects the lows between peaks.',
    type: 'Reversal',
    signal: 'Bearish',
    position: { row: 0, col: 1 }
  },
  'Inverse Head and Shoulders': {
    description: 'A bullish reversal pattern with three troughs - a lower middle trough (head) flanked by two higher troughs (shoulders). Signals trend reversal from bearish to bullish.',
    type: 'Reversal',
    signal: 'Bullish',
    position: { row: 1, col: 1 }
  },
  'Rising Wedge': {
    description: 'A bearish pattern where price consolidates between upward sloping support and resistance lines that converge. Often leads to a downside breakout.',
    type: 'Reversal/Continuation',
    signal: 'Bearish',
    position: { row: 0, col: 2 }
  },
  'Falling Wedge': {
    description: 'A bullish pattern where price consolidates between downward sloping support and resistance lines that converge. Often leads to an upside breakout.',
    type: 'Reversal/Continuation',
    signal: 'Bullish',
    position: { row: 1, col: 2 }
  },
  'Bullish Rectangle': {
    description: 'A continuation pattern where price consolidates between horizontal support and resistance after an uptrend. Breakout typically continues the prior trend.',
    type: 'Continuation',
    signal: 'Bullish',
    position: { row: 2, col: 1 }
  },
  'Bearish Rectangle': {
    description: 'A continuation pattern where price consolidates between horizontal support and resistance after a downtrend. Breakdown typically continues the prior trend.',
    type: 'Continuation',
    signal: 'Bearish',
    position: { row: 3, col: 1 }
  },
  'Bullish Pennant': {
    description: 'A continuation pattern forming a small symmetrical triangle after a strong upward move. Typically resolves with a breakout in the direction of the prior trend.',
    type: 'Continuation',
    signal: 'Bullish',
    position: { row: 2, col: 2 }
  },
  'Bearish Pennant': {
    description: 'A continuation pattern forming a small symmetrical triangle after a strong downward move. Typically resolves with a breakdown in the direction of the prior trend.',
    type: 'Continuation',
    signal: 'Bearish',
    position: { row: 3, col: 2 }
  },
  'Bull Flag': {
    description: 'A continuation pattern where price consolidates in a downward sloping channel after a strong upward move, resembling a flag on a pole.',
    type: 'Continuation',
    signal: 'Bullish',
    position: { row: 2, col: 0 }
  },
  'Bear Flag': {
    description: 'A continuation pattern where price consolidates in an upward sloping channel after a strong downward move, resembling an inverted flag.',
    type: 'Continuation',
    signal: 'Bearish',
    position: { row: 3, col: 0 }
  },
  'Ascending Triangle': {
    description: 'A typically bullish pattern with a flat resistance level and rising support. Breakout usually occurs upward through the resistance.',
    type: 'Bilateral',
    signal: 'Typically Bullish',
    position: { row: 4, col: 0 }
  },
  'Descending Triangle': {
    description: 'A typically bearish pattern with a flat support level and falling resistance. Breakdown usually occurs downward through the support.',
    type: 'Bilateral',
    signal: 'Typically Bearish',
    position: { row: 4, col: 1 }
  },
  'Symmetrical Triangle': {
    description: 'A bilateral pattern where both support and resistance converge symmetrically. Can break in either direction, often continuing the prior trend.',
    type: 'Bilateral',
    signal: 'Neutral',
    position: { row: 4, col: 2 }
  },
  'Ascending Channel': {
    description: 'Price moves within parallel upward-sloping trendlines. Suggests continued bullish momentum while price respects the channel boundaries.',
    type: 'Trend',
    signal: 'Bullish',
    position: null
  },
  'Descending Channel': {
    description: 'Price moves within parallel downward-sloping trendlines. Suggests continued bearish momentum while price respects the channel boundaries.',
    type: 'Trend',
    signal: 'Bearish',
    position: null
  },
  'Consolidation': {
    description: 'Price is moving sideways within a range, indicating indecision between buyers and sellers. Watch for a breakout in either direction.',
    type: 'Neutral',
    signal: 'Neutral',
    position: null
  },
  'Momentum Breakout': {
    description: 'Price has broken out of a consolidation pattern with strong momentum, indicating a potential new trend direction.',
    type: 'Breakout',
    signal: 'Trend Direction',
    position: null
  },
  'Breakdown Pattern': {
    description: 'Price has broken down below a key support level, indicating potential continuation of bearish momentum.',
    type: 'Breakdown',
    signal: 'Bearish',
    position: null
  },
  'Range-Bound': {
    description: 'Price is oscillating between defined support and resistance levels without establishing a clear trend direction.',
    type: 'Neutral',
    signal: 'Neutral',
    position: null
  },
  'Expanding Wedge': {
    description: 'A pattern where price swings become increasingly volatile, with both higher highs and lower lows. Often indicates increased uncertainty.',
    type: 'Bilateral',
    signal: 'Uncertain',
    position: null
  }
};

// Fast-appearing QuickTooltip component (appears in 150ms instead of browser's default 1-2 seconds)
const QuickTooltip = ({ children, text, position = 'bottom' }) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setShow(true);
    }, 150); // 150ms delay - much faster than browser default
  };
  
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShow(false);
  };
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  const getTooltipStyle = () => {
    const baseStyle = {
      position: 'absolute',
      background: '#1a1a1a',
      border: '1px solid #333',
      color: '#fff',
      padding: '6px 10px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      zIndex: 10000,
      pointerEvents: 'none',
      opacity: show ? 1 : 0,
      transition: 'opacity 0.15s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    };
    
    switch (position) {
      case 'top':
        return { ...baseStyle, bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '6px' };
      case 'bottom':
        return { ...baseStyle, top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '6px' };
      case 'left':
        return { ...baseStyle, right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '6px' };
      case 'right':
        return { ...baseStyle, left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '6px' };
      default:
        return { ...baseStyle, top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '6px' };
    }
  };
  
  return (
    <div 
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      ref={triggerRef}
    >
      {children}
      {text && (
        <div style={getTooltipStyle()}>
          {text}
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            width: 0,
            height: 0,
            ...(position === 'bottom' ? {
              top: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '6px solid #333',
            } : position === 'top' ? {
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #333',
            } : position === 'left' ? {
              right: '-6px',
              top: '50%',
              transform: 'translateY(-50%)',
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: '6px solid #333',
            } : {
              left: '-6px',
              top: '50%',
              transform: 'translateY(-50%)',
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: '6px solid #333',
            })
          }} />
        </div>
      )}
    </div>
  );
};

// Helper function to find pattern info (handles partial matches)
const getPatternInfo = (patternName) => {
  if (!patternName) return null;
  
  // Direct match
  if (patternDescriptions[patternName]) {
    return patternDescriptions[patternName];
  }
  
  // Partial match
  const lowerPattern = patternName.toLowerCase();
  for (const [key, value] of Object.entries(patternDescriptions)) {
    if (lowerPattern.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerPattern)) {
      return value;
    }
  }
  
  // Fallback for any unrecognized pattern - provide generic info so popup still works
  return {
    description: `${patternName} is a technical chart pattern identified in the price action. This pattern suggests potential price movement based on historical price behavior and market structure.`,
    type: 'Technical Pattern',
    signal: 'See Analysis',
    position: null
  };
};

// Pattern Diagram Component - draws SVG representations of chart patterns
const PatternDiagram = ({ pattern, patternInfo }) => {
  const width = 200;
  const height = 60;
  const strokeColor = "#F5A524";
  const strokeWidth = 2;
  
  // Define SVG paths for different patterns
  const getPatternPath = () => {
    const patternLower = pattern?.toLowerCase() || '';
    
    if (patternLower.includes('double top')) {
      return (
        <g>
          <polyline points="10,50 40,15 70,45 100,15 130,50 160,55" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="10" y1="45" x2="160" y2="45" stroke="#F75555" strokeWidth={1} strokeDasharray="4,2" />
        </g>
      );
    }
    if (patternLower.includes('double bottom')) {
      return (
        <g>
          <polyline points="10,10 40,45 70,15 100,45 130,10 160,5" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="10" y1="15" x2="160" y2="15" stroke="#3ECF8E" strokeWidth={1} strokeDasharray="4,2" />
        </g>
      );
    }
    if (patternLower.includes('head and shoulders') && !patternLower.includes('inverse')) {
      return (
        <g>
          <polyline points="10,45 30,25 50,40 80,10 110,40 130,25 150,45 170,50" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="30" y1="40" x2="130" y2="40" stroke="#F75555" strokeWidth={1} strokeDasharray="4,2" />
        </g>
      );
    }
    if (patternLower.includes('inverse head and shoulders')) {
      return (
        <g>
          <polyline points="10,15 30,35 50,20 80,50 110,20 130,35 150,15 170,10" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="30" y1="20" x2="130" y2="20" stroke="#3ECF8E" strokeWidth={1} strokeDasharray="4,2" />
        </g>
      );
    }
    if (patternLower.includes('rising wedge')) {
      return (
        <g>
          <polyline points="10,50 50,35 70,45 110,20 130,35 160,10" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="10" y1="50" x2="160" y2="15" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
          <line x1="10" y1="35" x2="160" y2="5" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
        </g>
      );
    }
    if (patternLower.includes('falling wedge')) {
      return (
        <g>
          <polyline points="10,10 50,25 70,15 110,40 130,25 160,50" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="10" y1="10" x2="160" y2="45" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
          <line x1="10" y1="25" x2="160" y2="55" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
        </g>
      );
    }
    if (patternLower.includes('ascending triangle')) {
      return (
        <g>
          <polyline points="10,50 40,20 60,40 90,20 110,30 140,20 160,15" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="40" y1="20" x2="160" y2="20" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
          <line x1="10" y1="50" x2="140" y2="25" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
        </g>
      );
    }
    if (patternLower.includes('descending triangle')) {
      return (
        <g>
          <polyline points="10,10 40,40 60,20 90,40 110,30 140,40 160,45" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="40" y1="40" x2="160" y2="40" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
          <line x1="10" y1="10" x2="140" y2="35" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
        </g>
      );
    }
    if (patternLower.includes('symmetrical triangle')) {
      return (
        <g>
          <polyline points="10,15 40,45 70,20 100,40 130,25 150,35" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="10" y1="15" x2="150" y2="30" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
          <line x1="10" y1="50" x2="150" y2="35" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
        </g>
      );
    }
    if (patternLower.includes('bull flag') || patternLower.includes('bullish flag')) {
      return (
        <g>
          <polyline points="10,55 30,15 50,25 70,20 90,30 110,25 130,10" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="30" y1="15" x2="110" y2="30" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
          <line x1="30" y1="25" x2="110" y2="40" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
        </g>
      );
    }
    if (patternLower.includes('bear flag') || patternLower.includes('bearish flag')) {
      return (
        <g>
          <polyline points="10,5 30,45 50,35 70,40 90,30 110,35 130,50" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="30" y1="45" x2="110" y2="30" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
          <line x1="30" y1="35" x2="110" y2="20" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
        </g>
      );
    }
    if (patternLower.includes('pennant') && patternLower.includes('bull')) {
      return (
        <g>
          <polyline points="10,55 30,15 50,25 70,20 90,22 110,21 130,10" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="30" y1="15" x2="110" y2="21" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
          <line x1="30" y1="30" x2="110" y2="24" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
        </g>
      );
    }
    if (patternLower.includes('pennant') && patternLower.includes('bear')) {
      return (
        <g>
          <polyline points="10,5 30,45 50,35 70,40 90,38 110,39 130,50" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="30" y1="45" x2="110" y2="39" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
          <line x1="30" y1="30" x2="110" y2="36" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
        </g>
      );
    }
    if (patternLower.includes('rectangle') && patternLower.includes('bull')) {
      return (
        <g>
          <polyline points="10,55 30,15 50,30 70,15 90,30 110,15 130,30 150,10" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="30" y1="15" x2="130" y2="15" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
          <line x1="30" y1="30" x2="130" y2="30" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
        </g>
      );
    }
    if (patternLower.includes('rectangle') && patternLower.includes('bear')) {
      return (
        <g>
          <polyline points="10,5 30,45 50,30 70,45 90,30 110,45 130,30 150,50" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="30" y1="30" x2="130" y2="30" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
          <line x1="30" y1="45" x2="130" y2="45" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
        </g>
      );
    }
    if (patternLower.includes('ascending channel') || patternLower.includes('uptrend')) {
      return (
        <g>
          <polyline points="10,50 40,35 70,45 100,30 130,40 160,25" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="10" y1="50" x2="160" y2="25" stroke="#3ECF8E" strokeWidth={1} strokeDasharray="3,2" />
          <line x1="10" y1="35" x2="160" y2="10" stroke="#3ECF8E" strokeWidth={1} strokeDasharray="3,2" />
        </g>
      );
    }
    if (patternLower.includes('descending channel') || patternLower.includes('downtrend')) {
      return (
        <g>
          <polyline points="10,10 40,25 70,15 100,30 130,20 160,35" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="10" y1="10" x2="160" y2="35" stroke="#F75555" strokeWidth={1} strokeDasharray="3,2" />
          <line x1="10" y1="25" x2="160" y2="50" stroke="#F75555" strokeWidth={1} strokeDasharray="3,2" />
        </g>
      );
    }
    // Default consolidation/range pattern
    return (
      <g>
        <polyline points="10,30 40,20 70,35 100,25 130,32 160,28" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="10" y1="20" x2="160" y2="20" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
        <line x1="10" y1="38" x2="160" y2="38" stroke="#777" strokeWidth={1} strokeDasharray="3,2" />
      </g>
    );
  };
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {getPatternPath()}
    </svg>
  );
};

// ============================================================================
// API SETTINGS MODAL
// ============================================================================

const APISettingsModal = ({ isOpen, onClose, apiKeys, onSave }) => {
  const [keys, setKeys] = useState(apiKeys);
  const [showKeys, setShowKeys] = useState({
    claude: false,
    alphaVantage: false,
    finnhub: false,
    twelveData: false,
    newsApi: false,
    polygon: false
  });
  const [saved, setSaved] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'success', 'error'
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    setKeys(apiKeys);
  }, [apiKeys]);
  
  const handleSave = () => {
    onSave(keys);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  
  const toggleShowKey = (keyName) => {
    setShowKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };
  
  // Handle .env file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsedKeys = parseEnvFile(content);
        
        // Merge with existing keys (only overwrite if new value exists)
        const mergedKeys = { ...keys };
        let keysFound = 0;
        
        for (const [key, value] of Object.entries(parsedKeys)) {
          if (value) {
            mergedKeys[key] = value;
            keysFound++;
          }
        }
        
        if (keysFound > 0) {
          setKeys(mergedKeys);
          setUploadStatus('success');
          setTimeout(() => setUploadStatus(null), 3000);
        } else {
          setUploadStatus('error');
          setTimeout(() => setUploadStatus(null), 3000);
        }
      } catch (err) {
        console.error('Error parsing .env file:', err);
        setUploadStatus('error');
        setTimeout(() => setUploadStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    
    // Reset input so same file can be uploaded again
    event.target.value = '';
  };
  
  // Handle .env file download
  const handleDownloadEnv = () => {
    const content = generateEnvFile(keys);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (!isOpen) return null;
  
  const apiProviders = [
    {
      id: 'claude',
      name: 'Claude AI (Anthropic)',
      description: 'Required for AI pattern analysis & insights',
      signupUrl: 'https://console.anthropic.com/',
      features: ['AI Analysis', 'Pattern Detection', 'Price Targets'],
      color: '#8B5CF6',
      required: true
    },
    {
      id: 'finnhub',
      name: 'Finnhub',
      description: 'Real-time stock data & company news',
      signupUrl: 'https://finnhub.io/register',
      features: ['Daily prices', 'Company news', 'Free: 60 calls/min'],
      color: '#3ECF8E'
    },
    {
      id: 'twelveData',
      name: 'Twelve Data',
      description: 'Best free option for intraday data',
      signupUrl: 'https://twelvedata.com/register',
      features: ['5/15/60min candles', 'Intraday data', 'Free: 800 calls/day'],
      color: '#10B981',
      recommended: true
    },
    {
      id: 'polygon',
      name: 'Polygon.io',
      description: 'Professional-grade market data',
      signupUrl: 'https://polygon.io/dashboard/signup',
      features: ['Stock prices', 'Historical data', 'Free: 5 calls/min'],
      color: '#F5A524'
    },
    {
      id: 'alphaVantage',
      name: 'Alpha Vantage',
      description: 'Free stock data API',
      signupUrl: 'https://www.alphavantage.co/support/#api-key',
      features: ['Stock prices', 'Technicals', 'Free: 25 calls/day'],
      color: '#3B82F6'
    },
    {
      id: 'newsApi',
      name: 'NewsAPI',
      description: 'News articles from 80,000+ sources',
      signupUrl: 'https://newsapi.org/register',
      features: ['Financial news', 'Coverage', 'Free: 100 calls/day'],
      color: '#F75555'
    }
  ];
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#0d0d0d',
        border: '1px solid #2a2a2a',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={18} style={{ color: '#F5A524' }} />
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>API Settings</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#777',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <p style={{ 
            fontSize: '12px', 
            color: '#999', 
            marginBottom: '16px',
            lineHeight: 1.5,
          }}>
            Add your API keys to enable live market data and news. Keys are stored locally in your browser and never sent to our servers.
          </p>
          
          {/* File Upload/Download Section */}
          <div style={{
            background: '#111',
            border: '1px solid #2a2a2a',
            borderRadius: '6px',
            padding: '14px 16px',
            marginBottom: '16px',
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: '#fff',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <FileUp size={14} style={{ color: '#8B5CF6' }} />
                  Import / Export .env File
                </div>
                <p style={{ fontSize: '10px', color: '#777', margin: 0 }}>
                  Upload a .env file or download your current keys
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".env,.txt"
                  style={{ display: 'none' }}
                />
                
                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '6px 12px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    color: '#999',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Upload size={12} />
                  Upload .env
                </button>
                
                {/* Download Button */}
                <button
                  onClick={handleDownloadEnv}
                  style={{
                    padding: '6px 12px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    color: '#999',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Download size={12} />
                  Download .env
                </button>
              </div>
            </div>
            
            {/* Upload Status Message */}
            {uploadStatus && (
              <div style={{
                marginTop: '10px',
                padding: '8px 12px',
                background: uploadStatus === 'success' ? 'rgba(62, 207, 142, 0.1)' : 'rgba(247, 85, 85, 0.1)',
                border: `1px solid ${uploadStatus === 'success' ? 'rgba(62, 207, 142, 0.3)' : 'rgba(247, 85, 85, 0.3)'}`,
                borderRadius: '4px',
                fontSize: '11px',
                color: uploadStatus === 'success' ? '#3ECF8E' : '#F75555',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                {uploadStatus === 'success' ? (
                  <><Check size={12} /> API keys loaded from file! Review below and click Save.</>
                ) : (
                  <><AlertCircle size={12} /> No valid API keys found in file. Check format.</>
                )}
              </div>
            )}
          </div>
          
          {/* Divider with OR */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
            <span style={{ fontSize: '10px', color: '#777', fontWeight: 500 }}>OR ENTER MANUALLY</span>
            <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
          </div>
          
          {apiProviders.map(provider => (
            <div 
              key={provider.id}
              style={{
                background: provider.required ? '#111' : '#111',
                border: `1px solid ${provider.required && !keys[provider.id] ? '#F5A524' : '#1e1e1e'}`,
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '12px',
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: 600, 
                      color: '#fff',
                    }}>
                      {provider.name}
                    </span>
                    {provider.required && !keys[provider.id] && (
                      <span style={{
                        fontSize: '8px',
                        padding: '2px 6px',
                        background: 'rgba(245, 165, 36, 0.15)',
                        color: '#F5A524',
                        fontWeight: 600,
                        borderRadius: '2px',
                      }}>
                        REQUIRED FOR AI
                      </span>
                    )}
                    {keys[provider.id] && (
                      <span style={{
                        fontSize: '8px',
                        padding: '2px 6px',
                        background: 'rgba(62, 207, 142, 0.15)',
                        color: '#3ECF8E',
                        fontWeight: 600,
                        borderRadius: '2px',
                      }}>
                        CONFIGURED
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '11px', color: '#777', margin: 0 }}>
                    {provider.description}
                  </p>
                </div>
                {provider.signupUrl ? (
                  <a
                    href={provider.signupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '10px',
                      color: provider.color,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Get API Key <ExternalLink size={10} />
                  </a>
                ) : provider.helpText ? (
                  <span style={{
                    fontSize: '9px',
                    color: '#888',
                    maxWidth: '200px',
                    textAlign: 'right',
                    lineHeight: 1.4,
                  }}>
                    {provider.helpText}
                  </span>
                ) : null}
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {provider.features.map((feature, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '9px',
                      padding: '3px 8px',
                      background: '#1a1a1a',
                      color: '#999',
                      borderRadius: '3px',
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>
              
              <div style={{ position: 'relative' }}>
                <input
                  type={showKeys[provider.id] ? 'text' : 'password'}
                  placeholder={`Enter your ${provider.name} API key`}
                  value={keys[provider.id] || ''}
                  onChange={(e) => setKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    background: '#0a0a0a',
                    border: `1px solid ${keys[provider.id] ? provider.color + '40' : '#2a2a2a'}`,
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: "'JetBrains Mono', monospace",
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={() => toggleShowKey(provider.id)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#777',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showKeys[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ fontSize: '10px', color: '#777' }}>
            🔒 Keys stored locally in your browser
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid #333',
                color: '#999',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                background: saved ? '#3ECF8E' : '#F5A524',
                border: 'none',
                color: '#000',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.2s',
              }}
            >
              {saved ? <><Check size={14} /> Saved!</> : 'Save Keys'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTS
// ============================================================================

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        padding: '10px 12px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '10px',
        lineHeight: '1.5',
      }}>
        <div style={{ color: '#999', marginBottom: '6px', fontSize: '9px', letterSpacing: '0.5px' }}>{d.fullDate}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
          <span style={{ color: '#777' }}>O</span><span style={{ color: '#fff', textAlign: 'right' }}>{d.open?.toFixed(2)}</span>
          <span style={{ color: '#777' }}>H</span><span style={{ color: '#3ECF8E', textAlign: 'right' }}>{d.high?.toFixed(2)}</span>
          <span style={{ color: '#777' }}>L</span><span style={{ color: '#F75555', textAlign: 'right' }}>{d.low?.toFixed(2)}</span>
          <span style={{ color: '#777' }}>C</span><span style={{ color: '#fff', textAlign: 'right' }}>{d.close?.toFixed(2)}</span>
        </div>
        <div style={{ borderTop: '1px solid #2a2a2a', marginTop: '6px', paddingTop: '6px', color: '#777' }}>
          Vol <span style={{ color: '#999' }}>{(d.volume / 1e6).toFixed(1)}M</span>
        </div>
      </div>
    );
  }
  return null;
};

const PriceSummaryPanel = ({ ticker, chartData, previousClose, currentPrice: propCurrentPrice, timeRange }) => {
  // If no chart data yet, show placeholder
  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ background: '#111', border: '1px solid #1e1e1e', marginBottom: '12px' }}>
        <div style={{
          padding: '10px 12px',
          borderBottom: '1px solid #1e1e1e',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#777' }}>
            $—
          </span>
        </div>
        <div style={{ padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          {['OPEN', 'HIGH', 'LOW', 'VOL'].map((label, i) => (
            <div key={i} style={{ padding: '6px 8px', background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
              <div style={{ fontSize: '8px', color: '#777', marginBottom: '2px', letterSpacing: '0.5px' }}>{label}</div>
              <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#777' }}>—</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const lastCandle = chartData[chartData.length - 1] || {};
  const firstCandle = chartData[0] || {};
  
  // Use the prop currentPrice if available, otherwise fall back to last candle close
  const currentPrice = propCurrentPrice || lastCandle.close || 0;
  
  // Calculate change based on the chart's timeframe (first candle open to last candle close)
  // This shows the performance over the selected period
  const periodStartPrice = firstCandle.open || firstCandle.close || currentPrice;
  const periodEndPrice = lastCandle.close || currentPrice;
  const priceChange = periodEndPrice - periodStartPrice;
  const priceChangePercent = periodStartPrice ? (priceChange / periodStartPrice) * 100 : 0;
  const isPositive = priceChange >= 0;
  
  const sessionHigh = Math.max(...chartData.map(d => d.high || 0));
  const sessionLow = Math.min(...chartData.filter(d => d.low).map(d => d.low));
  const totalVolume = chartData.reduce((sum, d) => sum + (d.volume || 0), 0);

  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', marginBottom: '12px' }}>
      {/* Price + Change */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <span style={{
          fontSize: '20px',
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          color: '#fff',
        }}>
          ${currentPrice.toFixed(2)}
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 6px',
          background: isPositive ? 'rgba(62, 207, 142, 0.1)' : 'rgba(247, 85, 85, 0.1)',
        }}>
          {isPositive ? <TrendingUp size={10} style={{ color: '#3ECF8E' }} /> : <TrendingDown size={10} style={{ color: '#F75555' }} />}
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            color: isPositive ? '#3ECF8E' : '#F75555',
          }}>
          {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* OHLV Grid */}
      <div style={{ padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        <div style={{ padding: '6px 8px', background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: '8px', color: '#777', marginBottom: '2px', letterSpacing: '0.5px' }}>OPEN</div>
          <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#fff', fontWeight: 500 }}>
            ${firstCandle.open?.toFixed(2) || '—'}
          </div>
        </div>
        <div style={{ padding: '6px 8px', background: '#0a0a0a', border: '1px solid rgba(62, 207, 142, 0.2)' }}>
          <div style={{ fontSize: '8px', color: '#3ECF8E', marginBottom: '2px', letterSpacing: '0.5px' }}>HIGH</div>
          <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#3ECF8E', fontWeight: 500 }}>
            ${sessionHigh.toFixed(2)}
          </div>
        </div>
        <div style={{ padding: '6px 8px', background: '#0a0a0a', border: '1px solid rgba(247, 85, 85, 0.2)' }}>
          <div style={{ fontSize: '8px', color: '#F75555', marginBottom: '2px', letterSpacing: '0.5px' }}>LOW</div>
          <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#F75555', fontWeight: 500 }}>
            ${sessionLow.toFixed(2)}
          </div>
        </div>
        <div style={{ padding: '6px 8px', background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: '8px', color: '#777', marginBottom: '2px', letterSpacing: '0.5px' }}>VOL</div>
          <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#999', fontWeight: 500 }}>
            {(totalVolume / 1e6).toFixed(1)}M
          </div>
        </div>
      </div>
    </div>
  );
};

const AIAnalysis = ({ analysis, isLoading, isAIPowered }) => {
  const [expanded, setExpanded] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showPatternPopup, setShowPatternPopup] = useState(false);
  
  const { signal, confidence, pattern, summary, reasoning } = analysis || {};
  const patternInfo = getPatternInfo(pattern);

  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', marginBottom: '12px' }}>
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isAIPowered ? (
            <Cpu size={12} style={{ color: '#8B5CF6' }} />
          ) : (
            <Zap size={12} style={{ color: '#F5A524' }} />
          )}
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {isAIPowered ? 'AI Analysis' : 'Technical Analysis'}
          </span>
        </div>
        <div style={{
          fontSize: '8px',
          padding: '2px 6px',
          background: isAIPowered ? 'rgba(139, 92, 246, 0.1)' : 'rgba(245, 165, 36, 0.1)',
          color: isAIPowered ? '#8B5CF6' : '#F5A524',
          fontWeight: 600,
          letterSpacing: '0.3px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          {isAIPowered ? (
            <>
              <Cpu size={8} />
              CLAUDE AI
            </>
          ) : (
            <>
              <Zap size={8} />
              RULE-BASED
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#777' }}>
          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginBottom: '6px' }} />
          <div style={{ fontSize: '10px', letterSpacing: '1px' }}>ANALYZING...</div>
        </div>
      ) : (
        <div style={{ padding: '12px', position: 'relative' }}>
          {/* Analysis Type Explanation Banner */}
          <div style={{
            padding: '8px 10px',
            marginBottom: '12px',
            background: isAIPowered ? 'rgba(139, 92, 246, 0.05)' : 'rgba(245, 165, 36, 0.05)',
            border: `1px solid ${isAIPowered ? 'rgba(139, 92, 246, 0.2)' : 'rgba(245, 165, 36, 0.2)'}`,
            borderRadius: '4px',
          }}>
            <div style={{ fontSize: '9px', color: isAIPowered ? '#8B5CF6' : '#F5A524', fontWeight: 600, marginBottom: '4px' }}>
              {isAIPowered ? '🤖 Powered by Claude AI' : '📊 Algorithmic Analysis'}
            </div>
            <div style={{ fontSize: '9px', color: '#777', lineHeight: '1.4' }}>
              {isAIPowered 
                ? 'Using advanced AI to identify patterns, analyze market context, and provide insights.'
                : 'Using RSI, MACD, and moving averages to generate signals. Add a Claude API key for AI-powered analysis.'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: '9px', color: '#777', marginBottom: '2px', letterSpacing: '0.5px' }}>PATTERN</div>
              <div 
                style={{ 
                  fontSize: '12px', 
                  color: '#fff', 
                  fontWeight: 500,
                  cursor: patternInfo ? 'help' : 'default',
                  borderBottom: patternInfo ? '1px dashed #777' : 'none',
                  paddingBottom: '2px',
                }}
                onMouseEnter={() => patternInfo && setShowPatternPopup(true)}
                onMouseLeave={() => setShowPatternPopup(false)}
              >
                {pattern || 'Analyzing...'}
              </div>
              
              {/* Pattern Popup */}
              {showPatternPopup && patternInfo && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '8px',
                  width: '240px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  padding: '12px',
                  zIndex: 1000,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                  {/* Pattern Diagram SVG */}
                  {patternInfo.position && (
                    <div style={{
                      width: '100%',
                      height: '70px',
                      marginBottom: '10px',
                      background: '#252525',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      <PatternDiagram pattern={pattern} patternInfo={patternInfo} />
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      color: '#fff',
                      marginBottom: '6px',
                      wordWrap: 'break-word',
                    }}>
                      {pattern}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '8px',
                        padding: '2px 5px',
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#8B5CF6',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {patternInfo.type}
                      </span>
                      <span style={{
                        fontSize: '8px',
                        padding: '2px 5px',
                        background: patternInfo.signal === 'Bullish' ? 'rgba(62, 207, 142, 0.15)' : 
                                   patternInfo.signal === 'Bearish' ? 'rgba(247, 85, 85, 0.15)' : 
                                   'rgba(245, 165, 36, 0.15)',
                        color: patternInfo.signal === 'Bullish' ? '#3ECF8E' : 
                               patternInfo.signal === 'Bearish' ? '#F75555' : '#F5A524',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {patternInfo.signal}
                      </span>
                    </div>
                  </div>
                  
                  <p style={{ 
                    fontSize: '10px', 
                    lineHeight: '1.5', 
                    color: '#999', 
                    margin: 0,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}>
                    {patternInfo.description}
                  </p>
                </div>
              )}
            </div>
            <div style={{
              padding: '4px 8px',
              background: signal === 'BULLISH' ? 'rgba(62, 207, 142, 0.15)' : signal === 'BEARISH' ? 'rgba(247, 85, 85, 0.15)' : 'rgba(245, 165, 36, 0.15)',
              border: `1px solid ${signal === 'BULLISH' ? 'rgba(62, 207, 142, 0.3)' : signal === 'BEARISH' ? 'rgba(247, 85, 85, 0.3)' : 'rgba(245, 165, 36, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              {signal === 'BULLISH' ? <TrendingUp size={10} style={{ color: '#3ECF8E' }} /> : signal === 'BEARISH' ? <TrendingDown size={10} style={{ color: '#F75555' }} /> : <BarChart2 size={10} style={{ color: '#F5A524' }} />}
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: signal === 'BULLISH' ? '#3ECF8E' : signal === 'BEARISH' ? '#F75555' : '#F5A524',
                letterSpacing: '0.5px',
              }}>
                {signal || 'NEUTRAL'}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '9px', color: '#777', letterSpacing: '0.5px' }}>CONFIDENCE</span>
              <span style={{ fontSize: '10px', color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{confidence || 50}%</span>
            </div>
            <div style={{ height: '2px', background: '#1e1e1e', borderRadius: '1px' }}>
              <div style={{
                height: '100%',
                width: `${confidence || 50}%`,
                background: signal === 'BULLISH' ? '#3ECF8E' : signal === 'BEARISH' ? '#F75555' : '#F5A524',
                borderRadius: '1px',
              }} />
            </div>
          </div>

          {/* Button Row */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                flex: 1,
                padding: '8px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                color: '#999',
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              {expanded ? 'Hide Summary' : 'Summary'}
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              style={{
                flex: 1,
                padding: '8px',
                background: showReasoning ? 'rgba(245, 165, 36, 0.1)' : '#1a1a1a',
                border: `1px solid ${showReasoning ? 'rgba(245, 165, 36, 0.3)' : '#2a2a2a'}`,
                color: showReasoning ? '#F5A524' : '#999',
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <HelpCircle size={10} />
              {showReasoning ? 'Hide Logic' : 'Show Logic'}
            </button>
          </div>

          {/* Summary Section */}
          {expanded && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              background: '#0a0a0a',
              borderLeft: `2px solid ${signal === 'BULLISH' ? '#3ECF8E' : signal === 'BEARISH' ? '#F75555' : '#F5A524'}`,
            }}>
              <p style={{ fontSize: '11px', lineHeight: '1.6', color: '#999', margin: 0 }}>{summary}</p>
            </div>
          )}

          {/* Reasoning/Logic Section */}
          {showReasoning && (
            <div style={{
              marginTop: '10px',
              padding: '12px',
              background: '#0a0a0a',
              border: '1px solid #1e1e1e',
              borderRadius: '4px',
            }}>
              <div style={{ 
                fontSize: '10px', 
                fontWeight: 600, 
                color: '#F5A524', 
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <HelpCircle size={12} />
                {isAIPowered ? 'AI Analysis Logic' : 'Rule-Based Analysis Logic'}
              </div>
              
              {isAIPowered ? (
                // AI-powered explanation
                <div style={{ fontSize: '10px', color: '#999', lineHeight: '1.6' }}>
                  <p style={{ margin: '0 0 8px 0' }}>
                    Claude AI analyzes the price chart by examining:
                  </p>
                  <ul style={{ margin: '0 0 8px 0', paddingLeft: '16px' }}>
                    <li>Overall price structure and trend direction</li>
                    <li>Classic chart patterns (head & shoulders, triangles, channels, etc.)</li>
                    <li>Support and resistance levels</li>
                    <li>Technical indicators (RSI, MACD, moving averages)</li>
                    <li>Volume patterns and momentum</li>
                  </ul>
                  <p style={{ margin: 0, color: '#777', fontStyle: 'italic' }}>
                    The AI synthesizes these factors to provide contextual analysis beyond simple rule-based signals.
                  </p>
                </div>
              ) : reasoning ? (
                // Rule-based detailed explanation
                <div style={{ fontSize: '10px', color: '#999' }}>
                  {/* Method */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#aaa', marginBottom: '4px' }}>Method</div>
                    <div style={{ color: '#777' }}>{reasoning.method}</div>
                  </div>
                  
                  {/* Indicators Table */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#aaa', marginBottom: '8px' }}>Indicators Used</div>
                    {reasoning.indicators.map((ind, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '6px 8px',
                        background: i % 2 === 0 ? '#111' : 'transparent',
                        marginBottom: '2px',
                      }}>
                        <div>
                          <div style={{ color: '#aaa', fontSize: '9px' }}>{ind.name}</div>
                          <div style={{ color: '#777', fontSize: '8px' }}>{ind.interpretation}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#fff', fontSize: '9px' }}>
                            {ind.value}
                          </span>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: ind.signal === 'bullish' ? '#3ECF8E' : ind.signal === 'bearish' ? '#F75555' : '#F5A524',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pattern Logic */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#aaa', marginBottom: '4px' }}>Pattern Detection</div>
                    <div style={{ color: '#777', lineHeight: '1.5' }}>{reasoning.patternLogic}</div>
                  </div>
                  
                  {/* Signal Logic */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#aaa', marginBottom: '4px' }}>Signal Logic</div>
                    <div style={{ color: '#777', lineHeight: '1.5' }}>{reasoning.signalLogic}</div>
                  </div>
                  
                  {/* Support/Resistance */}
                  <div>
                    <div style={{ fontWeight: 600, color: '#aaa', marginBottom: '4px' }}>Support & Resistance</div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '4px' }}>
                      <span style={{ color: '#3ECF8E' }}>Support: {reasoning.supportResistance.support}</span>
                      <span style={{ color: '#F75555' }}>Resistance: {reasoning.supportResistance.resistance}</span>
                    </div>
                    <div style={{ color: '#777', fontSize: '9px' }}>{reasoning.supportResistance.logic}</div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '10px', color: '#777' }}>
                  Analysis reasoning not available for this data set.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MetricsPanel = ({ quoteData }) => {
  const metrics = quoteData ? [
    { label: 'Market Cap', value: quoteData.marketCap },
    { label: 'P/E Ratio', value: quoteData.peRatio },
    { label: 'EPS (TTM)', value: quoteData.eps },
    { label: 'Dividend', value: quoteData.dividendYield },
    { label: '52W High', value: quoteData.fiftyTwoWeekHigh, colorClass: 'green' },
    { label: '52W Low', value: quoteData.fiftyTwoWeekLow, colorClass: 'red' },
  ] : [
    { label: 'Market Cap', value: null },
    { label: 'P/E Ratio', value: null },
    { label: 'EPS (TTM)', value: null },
    { label: 'Dividend', value: null },
    { label: '52W High', value: null, colorClass: 'green' },
    { label: '52W Low', value: null, colorClass: 'red' },
  ];

  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', marginBottom: '12px' }}>
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <BarChart2 size={12} style={{ color: '#777' }} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Key Statistics
        </span>
      </div>
      <div style={{ padding: '6px' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 6px',
            borderBottom: i < metrics.length - 1 ? '1px solid #1a1a1a' : 'none',
          }}>
            <span style={{ fontSize: '11px', color: '#777' }}>{m.label}</span>
            <span style={{
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              color: m.colorClass === 'green' ? '#3ECF8E' : m.colorClass === 'red' ? '#F75555' : '#fff',
            }}>
              {m.value || '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TechnicalsPanel = ({ chartData }) => {
  // If no data, show placeholders
  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ background: '#111', border: '1px solid #1e1e1e' }}>
        <div style={{
          padding: '10px 12px',
          borderBottom: '1px solid #1e1e1e',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <AlertCircle size={12} style={{ color: '#777' }} />
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Technicals
          </span>
        </div>
        <div style={{ padding: '6px' }}>
          {['RSI (14)', 'MACD', 'SMA 20', 'SMA 50', 'SMA 200'].map((label, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 6px',
              borderBottom: i < 4 ? '1px solid #1a1a1a' : 'none',
            }}>
              <span style={{ fontSize: '11px', color: '#777' }}>{label}</span>
              <span style={{ fontSize: '11px', color: '#777' }}>—</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 12px', borderTop: '1px solid #1e1e1e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={12} style={{ color: '#777' }} />
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Support & Resistance
            </span>
          </div>
          <div style={{ padding: '8px 0', color: '#777', fontSize: '10px' }}>No data available</div>
        </div>
      </div>
    );
  }

  const rsi = calculateRSI(chartData);
  const macd = calculateMACD(chartData);
  const sma20 = calculateSMA(chartData, 20);
  const sma50 = calculateSMA(chartData, 50);
  const sma200 = calculateSMA(chartData, 200);
  const currentPrice = chartData[chartData.length - 1]?.close;
  
  // Calculate dynamic support/resistance levels
  const srLevels = calculateSupportResistance(chartData);

  const getStatus = (indicator, value) => {
    if (indicator === 'rsi') {
      if (value > 70) return { status: 'overbought', color: '#F75555' };
      if (value < 30) return { status: 'oversold', color: '#3ECF8E' };
      return { status: 'neutral', color: '#F5A524' };
    }
    if (indicator === 'macd') {
      if (value > 0) return { status: 'bullish', color: '#3ECF8E' };
      if (value < 0) return { status: 'bearish', color: '#F75555' };
      return { status: 'neutral', color: '#F5A524' };
    }
    if (indicator === 'sma') {
      if (currentPrice > value) return { status: 'above', color: '#3ECF8E' };
      return { status: 'below', color: '#F75555' };
    }
    return { status: 'N/A', color: '#777' };
  };

  const technicals = [
    { label: 'RSI (14)', value: rsi?.toFixed(1) || 'N/A', ...getStatus('rsi', rsi) },
    { label: 'MACD', value: macd !== null ? (macd > 0 ? '+' : '') + macd.toFixed(2) : 'N/A', ...getStatus('macd', macd) },
    { label: 'SMA 20', value: sma20 ? `$${sma20.toFixed(2)}` : 'N/A', ...getStatus('sma', sma20) },
    { label: 'SMA 50', value: sma50 ? `$${sma50.toFixed(2)}` : 'N/A', ...getStatus('sma', sma50) },
    { label: 'SMA 200', value: sma200 ? `$${sma200.toFixed(2)}` : 'N/A', ...getStatus('sma', sma200) },
  ];

  // Calculate distance to nearest S/R levels
  const distanceToSupport = srLevels.nearestSupport ? 
    (((currentPrice - srLevels.nearestSupport) / currentPrice) * 100).toFixed(1) : null;
  const distanceToResistance = srLevels.nearestResistance ? 
    (((srLevels.nearestResistance - currentPrice) / currentPrice) * 100).toFixed(1) : null;

  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e' }}>
      {/* Technical Indicators Section */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <AlertCircle size={12} style={{ color: '#777' }} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Technicals
        </span>
      </div>
      <div style={{ padding: '6px' }}>
        {technicals.map((t, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 6px',
            borderBottom: i < technicals.length - 1 ? '1px solid #1a1a1a' : 'none',
          }}>
            <span style={{ fontSize: '11px', color: '#777' }}>{t.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{t.value}</span>
              <span style={{
                fontSize: '8px',
                padding: '2px 4px',
                background: `${t.color}15`,
                color: t.color,
                fontWeight: 600,
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
              }}>
                {t.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Support & Resistance Section */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid #1e1e1e',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <TrendingUp size={12} style={{ color: '#777' }} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Support & Resistance
        </span>
      </div>
      <div style={{ padding: '8px' }}>
        {/* Resistance Levels */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '9px', color: '#F75555', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.3px' }}>
            RESISTANCE
          </div>
          {srLevels.resistances.length > 0 ? (
            srLevels.resistances.map((r, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 6px',
                background: i === 0 ? 'rgba(247, 85, 85, 0.08)' : 'transparent',
                marginBottom: '2px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    color: '#fff', 
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: i === 0 ? 600 : 400,
                  }}>
                    ${r.price.toFixed(2)}
                  </span>
                  {i === 0 && distanceToResistance && (
                    <span style={{ fontSize: '9px', color: '#777' }}>
                      (+{distanceToResistance}%)
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ 
                    fontSize: '8px', 
                    color: '#777',
                  }}>
                    {r.touches} {r.touches === 1 ? 'touch' : 'touches'}
                  </span>
                  <span style={{
                    fontSize: '7px',
                    padding: '1px 3px',
                    background: r.type === 'strong' ? 'rgba(247, 85, 85, 0.2)' : 
                               r.type === 'moderate' ? 'rgba(247, 85, 85, 0.1)' : 'rgba(247, 85, 85, 0.05)',
                    color: r.type === 'strong' ? '#F75555' : 
                           r.type === 'moderate' ? '#F7555599' : '#F7555566',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}>
                    {r.type}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '10px', color: '#777', padding: '4px 6px' }}>
              ${srLevels.nearestResistance?.toFixed(2) || 'N/A'} (period high)
            </div>
          )}
        </div>
        
        {/* Current Price Marker */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          margin: '4px 0',
          background: '#1a1a1a',
          borderLeft: '2px solid #F5A524',
        }}>
          <span style={{ fontSize: '10px', color: '#F5A524', fontWeight: 600 }}>
            Current: ${currentPrice?.toFixed(2)}
          </span>
        </div>
        
        {/* Support Levels */}
        <div>
          <div style={{ fontSize: '9px', color: '#3ECF8E', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.3px' }}>
            SUPPORT
          </div>
          {srLevels.supports.length > 0 ? (
            srLevels.supports.map((s, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 6px',
                background: i === 0 ? 'rgba(62, 207, 142, 0.08)' : 'transparent',
                marginBottom: '2px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    color: '#fff', 
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: i === 0 ? 600 : 400,
                  }}>
                    ${s.price.toFixed(2)}
                  </span>
                  {i === 0 && distanceToSupport && (
                    <span style={{ fontSize: '9px', color: '#777' }}>
                      (-{distanceToSupport}%)
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ 
                    fontSize: '8px', 
                    color: '#777',
                  }}>
                    {s.touches} {s.touches === 1 ? 'touch' : 'touches'}
                  </span>
                  <span style={{
                    fontSize: '7px',
                    padding: '1px 3px',
                    background: s.type === 'strong' ? 'rgba(62, 207, 142, 0.2)' : 
                               s.type === 'moderate' ? 'rgba(62, 207, 142, 0.1)' : 'rgba(62, 207, 142, 0.05)',
                    color: s.type === 'strong' ? '#3ECF8E' : 
                           s.type === 'moderate' ? '#3ECF8E99' : '#3ECF8E66',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}>
                    {s.type}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '10px', color: '#777', padding: '4px 6px' }}>
              ${srLevels.nearestSupport?.toFixed(2) || 'N/A'} (period low)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MY POSITIONS SCREEN
// ============================================================================

const MyPositionsScreen = ({ 
  favorites, 
  setFavorites, 
  onSelectTicker, 
  apiKeys,
  fetchStockDataFn,
  fetchCompanyProfileFn,
  calculateSRFn
}) => {
  const [positionsTimeRange, setPositionsTimeRange] = useState('1D');
  const [positionsData, setPositionsData] = useState({});
  const [loadingSymbols, setLoadingSymbols] = useState(new Set()); // Track which symbols are loading
  const [showLoadingFeedback, setShowLoadingFeedback] = useState(false); // Only show after 5 seconds
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const fileInputRef = useRef(null);
  const loadingTimerRef = useRef(null);
  
  const timeRanges = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
  
  // Fetch data for a single position based on the CURRENT selected timeframe
  // Note: fetchStockDataFn already uses the global stockDataCache internally
  const fetchPositionData = useCallback(async (symbol) => {
    console.log(`[MyPositions] ${symbol} - Fetching data for ${positionsTimeRange}...`);
    
    try {
      const [chartResult, profileResult] = await Promise.all([
        fetchStockDataFn(symbol, positionsTimeRange, apiKeys),
        fetchCompanyProfileFn(symbol, apiKeys.finnhub)
      ]);
      
      let data;
      if (chartResult.success && chartResult.chartData.length > 0) {
        const chartData = chartResult.chartData;
        const currentPrice = chartData[chartData.length - 1]?.close;
        const startPrice = chartData[0]?.open || chartData[0]?.close;
        const priceChange = currentPrice - startPrice;
        const priceChangePercent = startPrice ? ((priceChange / startPrice) * 100) : 0;
        
        // Calculate S/R levels
        const srLevels = calculateSRFn(chartData);
        
        // Use the same analysis as Dashboard for consistent pattern detection
        let signal = 'NEUTRAL';
        let pattern = 'Analyzing...';
        
        try {
          const analysis = generateFallbackAnalysis(chartData, symbol);
          signal = analysis.signal || 'NEUTRAL';
          pattern = analysis.pattern || 'Consolidation';
        } catch (analysisError) {
          console.error(`Analysis error for ${symbol}:`, analysisError);
          // Fallback to simple analysis
          const rsi = calculateRSI(chartData);
          const macd = calculateMACD(chartData);
          if (rsi !== null && macd !== null) {
            if (rsi > 50 && macd > 0) signal = 'BULLISH';
            else if (rsi < 50 && macd < 0) signal = 'BEARISH';
          }
          pattern = priceChangePercent > 2 ? 'Uptrend' : priceChangePercent < -2 ? 'Downtrend' : 'Consolidation';
        }
        
        data = {
          currentPrice,
          priceChange,
          priceChangePercent,
          signal,
          pattern,
          support: srLevels.nearestSupport,
          resistance: srLevels.nearestResistance,
          companyName: profileResult?.name || '',
          isLive: true
        };
      } else {
        data = {
          currentPrice: null,
          priceChange: 0,
          priceChangePercent: 0,
          signal: 'N/A',
          pattern: 'No Data',
          support: null,
          resistance: null,
          companyName: profileResult?.name || '',
          isLive: false
        };
        console.log(`[MyPositions] ${symbol} - No chart data available`);
      }
      
      console.log(`[MyPositions] ${symbol} - Data loaded: $${data.currentPrice?.toFixed(2) || 'N/A'}, ${data.pattern}`);
      return { symbol, data, fromCache: false };
      
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
      return {
        symbol,
        data: {
          currentPrice: null,
          priceChange: 0,
          priceChangePercent: 0,
          signal: 'ERROR',
          pattern: 'Error',
          support: null,
          resistance: null,
          companyName: '',
          isLive: false
        },
        fromCache: false
      };
    }
  }, [positionsTimeRange, apiKeys, fetchStockDataFn, fetchCompanyProfileFn, calculateSRFn]);
  
  // Load all positions - fetch in parallel for speed
  const loadAllPositions = useCallback(async (forceRefresh = false) => {
    if (favorites.length === 0) {
      setPositionsData({});
      setLoadingSymbols(new Set());
      setShowLoadingFeedback(false);
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      return;
    }
    
    // Clear global stockDataCache if force refresh
    if (forceRefresh) {
      stockDataCache.clear();
    }
    
    // Capture the current favorites to prevent race conditions
    const currentFavorites = [...favorites];
    
    // Mark all symbols as loading
    setLoadingSymbols(new Set(currentFavorites));
    setShowLoadingFeedback(false);
    
    // Start 5-second timer to show loading feedback
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    loadingTimerRef.current = setTimeout(() => {
      setShowLoadingFeedback(true);
    }, 5000);
    
    // Fetch ALL positions in parallel using Promise.allSettled to handle all results
    const fetchPromises = currentFavorites.map(async (symbol) => {
      try {
        const result = await fetchPositionData(symbol);
        return { symbol, data: result.data, success: true };
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error);
        return {
          symbol,
          data: {
            currentPrice: null,
            priceChange: 0,
            priceChangePercent: 0,
            signal: 'ERROR',
            pattern: 'Failed',
            support: null,
            resistance: null,
            companyName: '',
            isLive: false
          },
          success: false
        };
      }
    });
    
    // Wait for all fetches to complete
    const results = await Promise.allSettled(fetchPromises);
    
    // Process all results at once
    const newPositionsData = {};
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        newPositionsData[result.value.symbol] = result.value.data;
      }
    });
    
    // Update state once with all data
    setPositionsData(prev => ({
      ...prev,
      ...newPositionsData
    }));
    
    // Clear loading state
    setLoadingSymbols(new Set());
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    setShowLoadingFeedback(false);
  }, [favorites, fetchPositionData]);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);
  
  // Create a stable string representation of favorites for dependency comparison
  const favoritesKey = JSON.stringify(favorites);
  
  // Load data when component mounts, timeframe changes, or favorites change
  useEffect(() => {
    // Only load if we have favorites
    if (favorites.length > 0) {
      loadAllPositions();
    } else {
      // Clear data if no favorites
      setPositionsData({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionsTimeRange, favoritesKey]); // Re-run when timeframe or actual favorites change
  
  // Check if any symbols are still loading
  const isLoadingPositions = loadingSymbols.size > 0;
  
  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const newPositions = parsePositionsFile(content, file.name);
        if (newPositions.length > 0) {
          // Merge with existing, removing duplicates
          const merged = [...new Set([...favorites, ...newPositions])].slice(0, MAX_FAVORITES);
          setFavorites(merged);
          saveFavorites(merged);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };
  
  // Handle drag and drop reordering
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };
  
  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  
  const handleDrop = (index) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    
    const newFavorites = [...favorites];
    const [removed] = newFavorites.splice(draggedIndex, 1);
    newFavorites.splice(index, 0, removed);
    
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  
  const handleRemove = (symbol) => {
    const newFavorites = favorites.filter(f => f !== symbol);
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };
  
  const getSignalColor = (signal) => {
    if (signal === 'BULLISH') return '#3ECF8E';
    if (signal === 'BEARISH') return '#F75555';
    return '#F5A524';
  };
  
  return (
    <div style={{ 
      height: 'calc(100vh - 48px)',
      display: 'flex', 
      flexDirection: 'column',
      background: '#0a0a0a',
      overflow: 'hidden',
    }}>
      {/* Header with timeframe selector */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ 
            fontSize: '16px', 
            fontWeight: 700, 
            color: '#fff',
            margin: 0,
          }}>
            My Positions ({favorites.length}/{MAX_FAVORITES})
          </h2>
          
          {/* Timeframe selector */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {timeRanges.map(range => (
              <button
                key={range}
                onClick={() => setPositionsTimeRange(range)}
                style={{
                  padding: '4px 10px',
                  background: positionsTimeRange === range ? '#252525' : 'transparent',
                  border: '1px solid',
                  borderColor: positionsTimeRange === range ? '#3ECF8E' : '#252525',
                  color: positionsTimeRange === range ? '#3ECF8E' : '#777',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isLoadingPositions && (
            <RefreshCw size={14} style={{ color: '#777', animation: 'spin 1s linear infinite' }} />
          )}
          
          {/* Upload positions button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.csv,.txt"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#1a1a1a',
              border: '1px solid #333',
              color: '#999',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            <Upload size={12} />
            Import
          </button>
          
          {/* Export positions button */}
          <button
            onClick={() => {
              if (favorites.length === 0) {
                alert('No positions to export');
                return;
              }
              const exportData = {
                positions: favorites,
                exportedAt: new Date().toISOString(),
                count: favorites.length
              };
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `stockscope-positions-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              // Delay revocation to ensure download has started
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
            disabled={favorites.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#1a1a1a',
              border: '1px solid #333',
              color: favorites.length === 0 ? '#777' : '#aaa',
              fontSize: '11px',
              cursor: favorites.length === 0 ? 'not-allowed' : 'pointer',
              opacity: favorites.length === 0 ? 0.5 : 1,
            }}
          >
            <Download size={12} />
            Export
          </button>
          
          {/* Refresh button */}
          <button
            onClick={() => loadAllPositions(true)}
            disabled={isLoadingPositions}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#1a1a1a',
              border: '1px solid #333',
              color: '#999',
              fontSize: '11px',
              cursor: isLoadingPositions ? 'not-allowed' : 'pointer',
              opacity: isLoadingPositions ? 0.5 : 1,
            }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Loading Status Bar - Only shows after 5 seconds of loading */}
      {showLoadingFeedback && isLoadingPositions && (
        <div style={{
          background: 'rgba(62, 207, 142, 0.1)',
          borderBottom: '1px solid rgba(62, 207, 142, 0.3)',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <RefreshCw size={14} style={{ color: '#3ECF8E', animation: 'spin 1s linear infinite' }} />
          <span style={{ 
            fontSize: '11px', 
            color: '#3ECF8E',
            fontWeight: 500,
          }}>
            Still loading {loadingSymbols.size} position{loadingSymbols.size > 1 ? 's' : ''}... This may take a moment due to API rate limits.
          </span>
        </div>
      )}
      
      {/* Positions list */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '16px 24px',
      }}>
        {favorites.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#777',
            textAlign: 'center',
            gap: '16px',
          }}>
            <Star size={48} style={{ color: '#333' }} />
            <div>
              <p style={{ fontSize: '16px', marginBottom: '8px', color: '#999' }}>No positions yet</p>
              <p style={{ fontSize: '12px', color: '#777' }}>
                Click the star icon on any stock's Dashboard to add it to your positions,<br />
                or import a list using the "Import Positions" button above.
              </p>
            </div>
            <div style={{ 
              marginTop: '16px', 
              padding: '12px 16px', 
              background: '#111', 
              border: '1px solid #1e1e1e',
              fontSize: '11px',
              color: '#777',
            }}>
              <strong style={{ color: '#999' }}>Supported file formats:</strong><br />
              • JSON: <code style={{ color: '#3ECF8E' }}>["AAPL", "GOOGL", "MSFT"]</code><br />
              • CSV/TXT: One symbol per line or comma-separated
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '30px 120px 90px 100px 80px 100px 80px 80px 30px',
              gap: '8px',
              padding: '8px 12px',
              background: '#111',
              borderBottom: '1px solid #1e1e1e',
              fontSize: '9px',
              fontWeight: 600,
              color: '#777',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              <div></div>
              <div>Symbol</div>
              <div style={{ textAlign: 'right' }}>Price</div>
              <div style={{ textAlign: 'right' }}>Change</div>
              <div style={{ textAlign: 'center' }}>Signal</div>
              <div style={{ textAlign: 'center' }}>Pattern</div>
              <div style={{ textAlign: 'right' }}>Support</div>
              <div style={{ textAlign: 'right' }}>Resist.</div>
              <div></div>
            </div>
            
            {/* Position rows */}
            {favorites.map((symbol, index) => {
              const data = positionsData[symbol] || {};
              const isPositive = data.priceChange >= 0;
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              const isSymbolLoading = loadingSymbols.has(symbol);
              const hasData = data.currentPrice !== undefined && data.currentPrice !== null;
              const hasError = data.signal === 'ERROR' || data.pattern === 'Error' || data.pattern === 'Failed';
              
              return (
                <div
                  key={symbol}
                  draggable={!isSymbolLoading}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
                  onClick={() => !isSymbolLoading && onSelectTicker(symbol)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '30px 120px 90px 100px 80px 100px 80px 80px 30px',
                    gap: '8px',
                    padding: '10px 12px',
                    background: hasError ? 'rgba(247, 85, 85, 0.05)' : isDragOver ? '#1a1a1a' : '#111',
                    border: '1px solid',
                    borderColor: hasError ? 'rgba(247, 85, 85, 0.3)' : isDragging ? '#3ECF8E' : isDragOver ? '#333' : '#1e1e1e',
                    cursor: isSymbolLoading ? 'wait' : 'pointer',
                    opacity: isSymbolLoading ? 0.5 : isDragging ? 0.5 : 1,
                    transition: 'all 0.15s',
                    alignItems: 'center',
                  }}
                >
                  {/* Loading indicator - always show spinning icon when loading */}
                  <div 
                    style={{ cursor: isSymbolLoading ? 'wait' : 'grab', color: '#777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isSymbolLoading ? (
                      <RefreshCw size={14} style={{ color: '#3ECF8E', animation: 'spin 1s linear infinite' }} />
                    ) : hasError ? (
                      <AlertCircle size={14} style={{ color: '#F75555' }} />
                    ) : (
                      <GripVertical size={14} />
                    )}
                  </div>
                  
                  {/* Symbol & Company */}
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 700, 
                      color: isSymbolLoading ? '#999' : '#fff',
                    }}>
                      {symbol}
                    </div>
                    {hasError ? (
                      <div style={{ fontSize: '9px', color: '#F75555' }}>Failed to load</div>
                    ) : data.companyName ? (
                      <div style={{ 
                        fontSize: '9px', 
                        color: isSymbolLoading ? '#777' : '#999',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {data.companyName}
                      </div>
                    ) : null}
                  </div>
                  
                  {/* Price */}
                  <div style={{ 
                    textAlign: 'right',
                    fontSize: '12px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: hasData ? '#fff' : '#777',
                  }}>
                    {hasData ? `$${data.currentPrice.toFixed(2)}` : '—'}
                  </div>
                  
                  {/* Change */}
                  <div style={{ 
                    textAlign: 'right',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: hasData ? (isPositive ? '#3ECF8E' : '#F75555') : '#777',
                  }}>
                    {hasData ? (
                      <>
                        {isPositive ? '+' : ''}{data.priceChangePercent.toFixed(2)}%
                      </>
                    ) : '—'}
                  </div>
                  
                  {/* Signal */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontSize: '8px',
                      padding: '2px 6px',
                      background: hasError ? 'rgba(247, 85, 85, 0.15)' : data.signal ? `${getSignalColor(data.signal)}15` : 'transparent',
                      color: hasError ? '#F75555' : data.signal ? getSignalColor(data.signal) : '#777',
                      fontWeight: 600,
                      letterSpacing: '0.3px',
                    }}>
                      {hasError ? 'ERROR' : data.signal || '—'}
                    </span>
                  </div>
                  
                  {/* Pattern */}
                  <div style={{ 
                    textAlign: 'center',
                    fontSize: '10px',
                    color: hasError ? '#F75555' : '#999',
                  }}>
                    {hasError ? 'Retry' : (data.pattern || '—')}
                  </div>
                  
                  {/* Support */}
                  <div style={{ 
                    textAlign: 'right',
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#3ECF8E',
                  }}>
                    {data.support ? `$${data.support.toFixed(2)}` : '—'}
                  </div>
                  
                  {/* Resistance */}
                  <div style={{ 
                    textAlign: 'right',
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#F75555',
                  }}>
                    {data.resistance ? `$${data.resistance.toFixed(2)}` : '—'}
                  </div>
                  
                  {/* Remove button */}
                  <QuickTooltip text="Remove from positions" position="left">
                    <div 
                      onClick={(e) => { e.stopPropagation(); handleRemove(symbol); }}
                      style={{ 
                        cursor: 'pointer', 
                        color: '#777',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} style={{ transition: 'color 0.15s' }} 
                        onMouseEnter={(e) => e.target.style.color = '#F75555'}
                        onMouseLeave={(e) => e.target.style.color = '#777'}
                      />
                    </div>
                  </QuickTooltip>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const NewsFeed = ({ news, isLoading, isLive }) => (
  <div style={{ borderTop: '1px solid #1e1e1e' }}>
    <div style={{
      padding: '10px 16px',
      borderBottom: '1px solid #1e1e1e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: '41px',
      boxSizing: 'border-box',
      background: '#0a0a0a',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FileText size={12} style={{ color: '#777' }} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Latest News
        </span>
      </div>
      {isLive && (
        <div style={{
          fontSize: '8px',
          padding: '2px 6px',
          background: 'rgba(62, 207, 142, 0.1)',
          color: '#3ECF8E',
          fontWeight: 600,
        }}>
          LIVE
        </div>
      )}
    </div>
    <div style={{ padding: '12px 16px' }}>
      {isLoading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#777' }}>
          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginBottom: '6px' }} />
          <div style={{ fontSize: '10px' }}>Loading news...</div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '12px' 
        }}>
          {news.map((n) => (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '12px',
                background: '#111',
                border: '1px solid #1e1e1e',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1a1a1a';
                e.currentTarget.style.borderColor = '#2a2a2a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#111';
                e.currentTarget.style.borderColor = '#1e1e1e';
              }}
            >
              {n.isBreaking && (
                <div style={{ fontSize: '8px', color: '#F5A524', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>
                  BREAKING
                </div>
              )}
              <h4 style={{ 
                fontSize: '12px', 
                fontWeight: 500, 
                color: '#ddd', 
                lineHeight: 1.4, 
                margin: '0 0 8px 0',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {n.title}
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#777', fontWeight: 500 }}>{n.source}</span>
                  <span style={{ fontSize: '10px', color: '#333' }}>•</span>
                  <span style={{ fontSize: '10px', color: '#777', fontFamily: "'JetBrains Mono', monospace" }}>{n.time}</span>
                </div>
                <ExternalLink size={10} style={{ color: '#777' }} />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  </div>
);

const CandlestickChart = ({ data, showAIOverlay, showSRLevels, showSMAs, showBB, showRSI, showMACD, showVolume, priceStructure, timeRange }) => {
  const prices = data.flatMap(d => [d.high, d.low]).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) * 0.997 : 0;
  const maxPrice = prices.length ? Math.max(...prices) * 1.003 : 100;
  const maxVolume = Math.max(...data.map(d => d.volume || 0));
  const priceRange = maxPrice - minPrice;
  
  // Calculate SMAs for the data
  const calculateSMAData = (period) => {
    const smaData = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        smaData.push(null);
      } else {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += data[i - j].close;
        }
        smaData.push(sum / period);
      }
    }
    return smaData;
  };
  
  // Calculate Support/Resistance levels from chart data (returns multiple levels)
  const calculateSRLevels = () => {
    if (!data || data.length < 10) return { supports: [], resistances: [] };
    
    const currentPrice = data[data.length - 1]?.close;
    const priceRangeCalc = Math.max(...data.map(d => d.high)) - Math.min(...data.map(d => d.low));
    const tolerance = priceRangeCalc * 0.015;
    
    // Find pivot points
    const pivots = [];
    const lookback = Math.max(2, Math.floor(data.length / 20));
    
    for (let i = lookback; i < data.length - lookback; i++) {
      const current = data[i];
      let isSwingHigh = true;
      let isSwingLow = true;
      
      for (let j = 1; j <= lookback; j++) {
        if (data[i - j].high >= current.high || data[i + j].high >= current.high) isSwingHigh = false;
        if (data[i - j].low <= current.low || data[i + j].low <= current.low) isSwingLow = false;
      }
      
      if (isSwingHigh) pivots.push({ price: current.high, type: 'high', index: i });
      if (isSwingLow) pivots.push({ price: current.low, type: 'low', index: i });
    }
    
    // Cluster pivots
    const clusters = [];
    pivots.forEach(pivot => {
      const existingCluster = clusters.find(c => Math.abs(c.level - pivot.price) <= tolerance);
      if (existingCluster) {
        existingCluster.touches++;
        existingCluster.level = (existingCluster.level * (existingCluster.touches - 1) + pivot.price) / existingCluster.touches;
      } else {
        clusters.push({ level: pivot.price, touches: 1 });
      }
    });
    
    // Get multiple support levels (below current price, sorted by proximity)
    const supports = clusters
      .filter(c => c.level < currentPrice)
      .sort((a, b) => b.level - a.level) // Nearest first
      .slice(0, 3) // Up to 3 levels
      .map((c, i) => ({
        price: parseFloat(c.level.toFixed(2)),
        touches: c.touches,
        label: `S${i + 1}`,
        strength: c.touches >= 3 ? 'strong' : c.touches >= 2 ? 'moderate' : 'weak'
      }));
    
    // Get multiple resistance levels (above current price, sorted by proximity)
    const resistances = clusters
      .filter(c => c.level > currentPrice)
      .sort((a, b) => a.level - b.level) // Nearest first
      .slice(0, 3) // Up to 3 levels
      .map((c, i) => ({
        price: parseFloat(c.level.toFixed(2)),
        touches: c.touches,
        label: `R${i + 1}`,
        strength: c.touches >= 3 ? 'strong' : c.touches >= 2 ? 'moderate' : 'weak'
      }));
    
    // Add fallback levels if none found
    if (supports.length === 0) {
      supports.push({
        price: parseFloat(Math.min(...data.map(d => d.low)).toFixed(2)),
        touches: 1,
        label: 'S1',
        strength: 'weak'
      });
    }
    if (resistances.length === 0) {
      resistances.push({
        price: parseFloat(Math.max(...data.map(d => d.high)).toFixed(2)),
        touches: 1,
        label: 'R1',
        strength: 'weak'
      });
    }
    
    return { supports, resistances };
  };
  
  // Pre-calculate SMAs (always calculate so data is ready when toggled on)
  const sma20Data = calculateSMAData(20);
  const sma50Data = calculateSMAData(50);
  const sma200Data = calculateSMAData(200);
  
  // Pre-calculate S/R levels (always calculate so data is ready when toggled on)
  const srLevels = calculateSRLevels();
  
  // Calculate Bollinger Bands
  const bb = calculateBollingerBands(data, 20, 2);
  
  // Calculate RSI
  const rsiData = calculateRSIArray(data, 14);
  
  // Calculate MACD
  const macdData = calculateMACDFull(data);
  
  // Calculate Volume SMA
  const volumeSMA = calculateVolumeSMA(data, 20);
  
  // Calculate optimal x-axis tick interval based on data length and timeframe
  const getTickInterval = () => {
    const dataLength = data.length;
    if (dataLength <= 10) return 0;
    if (dataLength <= 20) return 1;
    if (dataLength <= 40) return Math.floor(dataLength / 8);
    if (dataLength <= 80) return Math.floor(dataLength / 7);
    if (dataLength <= 150) return Math.floor(dataLength / 6);
    return Math.floor(dataLength / 5);
  };
  
  const tickInterval = getTickInterval();
  
  // Add all indicator values to data
  const chartDataWithIndicators = data.map((d, i) => ({
    ...d,
    sma20: sma20Data[i],
    sma50: sma50Data[i],
    sma200: sma200Data[i],
    bbUpper: bb.upper[i],
    bbMiddle: bb.middle[i],
    bbLower: bb.lower[i],
    rsi: rsiData[i],
    macd: macdData.macd[i],
    macdSignal: macdData.signal[i],
    macdHist: macdData.histogram[i],
    volumeSMA: volumeSMA[i],
  }));
  
  // Calculate chart heights based on which panels are visible
  const indicatorCount = (showRSI ? 1 : 0) + (showMACD ? 1 : 0);
  const mainChartHeight = indicatorCount > 0 ? 65 : 100;
  const indicatorHeight = indicatorCount > 0 ? 35 / indicatorCount : 0;
  
  // RSI domain
  const rsiMin = 0;
  const rsiMax = 100;
  
  // MACD domain
  const macdValues = macdData.macd.filter(v => v !== null);
  const macdHistValues = macdData.histogram.filter(v => v !== null);
  const allMacdValues = [...macdValues, ...macdHistValues];
  const macdMax = allMacdValues.length ? Math.max(...allMacdValues.map(Math.abs)) * 1.2 : 1;
  
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Main Price Chart */}
      <div style={{ height: `${mainChartHeight}%`, minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartDataWithIndicators} margin={{ top: 20, right: 16, left: 10, bottom: showRSI || showMACD ? 5 : 20 }}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#777', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
              interval={tickInterval}
              padding={{ left: 10, right: 10 }}
              tickMargin={8}
              tickFormatter={(value) => value}
              hide={showRSI || showMACD}
            />
            <YAxis
              yAxisId="price"
              domain={[minPrice, maxPrice]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#777', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              tickFormatter={(val) => val.toFixed(0)}
              orientation="right"
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* S/R Reference Lines */}
            {showSRLevels && srLevels.supports.slice(0, 3).map((s, i) => (
              <ReferenceLine
                key={`support-${i}`}
                yAxisId="price"
                y={s.price}
                stroke="#3ECF8E"
                strokeWidth={s.strength === 'strong' ? 2 : 1.5}
                strokeDasharray="3 6"
                strokeOpacity={s.strength === 'strong' ? 0.9 : s.strength === 'moderate' ? 0.7 : 0.5}
                label={{
                  value: `${s.label}: $${s.price.toFixed(2)}`,
                  position: 'insideLeft',
                  fill: '#3ECF8E',
                  fontSize: 10,
                  fontWeight: 600,
                  dy: -8,
                }}
              />
            ))}
            {showSRLevels && srLevels.resistances.slice(0, 3).map((r, i) => (
              <ReferenceLine
                key={`resistance-${i}`}
                yAxisId="price"
                y={r.price}
                stroke="#F75555"
                strokeWidth={r.strength === 'strong' ? 2 : 1.5}
                strokeDasharray="3 6"
                strokeOpacity={r.strength === 'strong' ? 0.9 : r.strength === 'moderate' ? 0.7 : 0.5}
                label={{
                  value: `${r.label}: $${r.price.toFixed(2)}`,
                  position: 'insideLeft',
                  fill: '#F75555',
                  fontSize: 10,
                  fontWeight: 600,
                  dy: -8,
                }}
              />
            ))}
            
            {/* Bollinger Bands */}
            {showBB && bb.upper.some(v => v !== null) && (
              <>
                <Line yAxisId="price" type="monotone" dataKey="bbUpper" stroke="#8B5CF6" strokeWidth={1} strokeDasharray="3 3" dot={false} connectNulls={true} isAnimationActive={false} />
                <Line yAxisId="price" type="monotone" dataKey="bbMiddle" stroke="#8B5CF6" strokeWidth={1} dot={false} connectNulls={true} isAnimationActive={false} />
                <Line yAxisId="price" type="monotone" dataKey="bbLower" stroke="#8B5CF6" strokeWidth={1} strokeDasharray="3 3" dot={false} connectNulls={true} isAnimationActive={false} />
              </>
            )}
            
            {/* SMA Lines */}
            {showSMAs && sma20Data.some(v => v !== null) && (
              <Line yAxisId="price" type="monotone" dataKey="sma20" stroke="#3B82F6" strokeWidth={2} dot={false} connectNulls={true} isAnimationActive={false} name="SMA 20" />
            )}
            {showSMAs && sma50Data.some(v => v !== null) && (
              <Line yAxisId="price" type="monotone" dataKey="sma50" stroke="#F5A524" strokeWidth={2} dot={false} connectNulls={true} isAnimationActive={false} name="SMA 50" />
            )}
            {showSMAs && sma200Data.some(v => v !== null) && (
              <Line yAxisId="price" type="monotone" dataKey="sma200" stroke="#8B5CF6" strokeWidth={2} dot={false} connectNulls={true} isAnimationActive={false} name="SMA 200" />
            )}
            
            {/* Candles */}
            <Bar
              yAxisId="price"
              dataKey="close"
              shape={(props) => {
                const { x, width, payload, background, index } = props;
                if (!payload) return null;
                
                const { open, close, high, low, volume, isUp } = payload;
                const color = isUp ? '#3ECF8E' : '#F75555';
                
                const chartHeight = background?.height || 350;
                const chartTop = background?.y || 20;
                
                const getY = (price) => chartTop + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
                
                const highY = getY(high);
                const lowY = getY(low);
                const openY = getY(open);
                const closeY = getY(close);
                
                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
                const candleWidth = Math.min(Math.max(width * 0.6, 3), 12);
                const centerX = x + width / 2;
                
                // Volume bars
                const volumeHeight = showVolume ? (volume / maxVolume) * (chartHeight * 0.2) : 0;
                const volumeY = chartTop + chartHeight - volumeHeight;
                const volumeWidth = Math.min(width * 0.8, 16);
                
                const candleOpacity = showAIOverlay ? 0.5 : 1;
                
                return (
                  <g>
                    {showVolume && <rect x={centerX - volumeWidth / 2} y={volumeY} width={volumeWidth} height={volumeHeight} fill={color} opacity={0.2 * candleOpacity} />}
                    <line x1={centerX} y1={highY} x2={centerX} y2={lowY} stroke={color} strokeWidth={1} opacity={candleOpacity} />
                    <rect x={centerX - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={color} stroke={color} strokeWidth={1} opacity={candleOpacity} />
                  </g>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* RSI Panel */}
      {showRSI && (
        <div style={{ height: `${indicatorHeight}%`, minHeight: 80, borderTop: '1px solid #252525' }}>
          <div style={{ position: 'relative', height: '100%' }}>
            <div style={{ position: 'absolute', top: 4, left: 12, fontSize: '9px', color: '#F5A524', fontWeight: 600 }}>RSI (14)</div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartDataWithIndicators} margin={{ top: 20, right: 16, left: 10, bottom: showMACD ? 5 : 20 }}>
                <XAxis dataKey="date" hide={showMACD} axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 9 }} interval={tickInterval} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 9 }} tickFormatter={(val) => val} orientation="right" width={40} ticks={[30, 50, 70]} />
                <ReferenceLine y={70} stroke="#F75555" strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceLine y={30} stroke="#3ECF8E" strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceLine y={50} stroke="#555" strokeDasharray="3 3" strokeOpacity={0.3} />
                <Line type="monotone" dataKey="rsi" stroke="#F5A524" strokeWidth={1.5} dot={false} connectNulls={true} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* MACD Panel */}
      {showMACD && (
        <div style={{ height: `${indicatorHeight}%`, minHeight: 80, borderTop: '1px solid #252525' }}>
          <div style={{ position: 'relative', height: '100%' }}>
            <div style={{ position: 'absolute', top: 4, left: 12, fontSize: '9px', color: '#3ECF8E', fontWeight: 600 }}>MACD (12, 26, 9)</div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartDataWithIndicators} margin={{ top: 20, right: 16, left: 10, bottom: 20 }}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 9 }} interval={tickInterval} />
                <YAxis domain={[-macdMax, macdMax]} axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 9 }} tickFormatter={(val) => val.toFixed(2)} orientation="right" width={40} />
                <ReferenceLine y={0} stroke="#555" strokeOpacity={0.5} />
                <Bar dataKey="macdHist" fill="#555" shape={(props) => {
                  const { x, y, width, height, payload } = props;
                  if (!payload || payload.macdHist === null) return null;
                  const isPositive = payload.macdHist >= 0;
                  return <rect x={x} y={y} width={width} height={Math.abs(height)} fill={isPositive ? '#3ECF8E' : '#F75555'} opacity={0.5} />;
                }} />
                <Line type="monotone" dataKey="macd" stroke="#3B82F6" strokeWidth={1.5} dot={false} connectNulls={true} isAnimationActive={false} />
                <Line type="monotone" dataKey="macdSignal" stroke="#F5A524" strokeWidth={1.5} dot={false} connectNulls={true} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORT & SHARING UTILITIES
// ============================================================================

// Generate text summary for clipboard sharing
const generateTextSummary = (ticker, companyName, currentPrice, previousClose, timeRange, chartData, quoteData, aiAnalysis, isAIPowered) => {
  const priceChange = currentPrice && previousClose ? (currentPrice - previousClose).toFixed(2) : 'N/A';
  const priceChangePercent = currentPrice && previousClose 
    ? ((currentPrice - previousClose) / previousClose * 100).toFixed(2) 
    : 'N/A';
  const changeSign = priceChange > 0 ? '+' : '';
  
  const periodStart = chartData[0]?.close;
  const periodEnd = chartData[chartData.length - 1]?.close;
  const periodChange = periodStart && periodEnd 
    ? ((periodEnd - periodStart) / periodStart * 100).toFixed(2)
    : 'N/A';
  
  let summary = `📊 ${ticker}${companyName ? ` - ${companyName}` : ''}\n`;
  summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  summary += `💵 Price: $${currentPrice?.toFixed(2) || 'N/A'}\n`;
  summary += `📈 Day Change: ${changeSign}$${priceChange} (${changeSign}${priceChangePercent}%)\n`;
  summary += `📅 ${timeRange} Change: ${periodChange > 0 ? '+' : ''}${periodChange}%\n`;
  
  if (quoteData) {
    summary += `\n📋 Key Stats:\n`;
    if (quoteData.marketCap && quoteData.marketCap !== 'N/A') summary += `  Market Cap: ${quoteData.marketCap}\n`;
    if (quoteData.peRatio && quoteData.peRatio !== 'N/A') summary += `  P/E Ratio: ${quoteData.peRatio}\n`;
    if (quoteData.fiftyTwoWeekLow && quoteData.fiftyTwoWeekHigh) {
      summary += `  52W Range: ${quoteData.fiftyTwoWeekLow} - ${quoteData.fiftyTwoWeekHigh}\n`;
    }
  }
  
  if (aiAnalysis) {
    summary += `\n${isAIPowered ? '🤖 AI Analysis (Claude):' : '📊 Technical Analysis (Rule-Based):'}\n`;
    summary += `  Pattern: ${aiAnalysis.pattern || 'N/A'}\n`;
    summary += `  Signal: ${aiAnalysis.signal || 'N/A'}\n`;
    if (aiAnalysis.support) summary += `  Support: $${aiAnalysis.support.toFixed(2)}\n`;
    if (aiAnalysis.resistance) summary += `  Resistance: $${aiAnalysis.resistance.toFixed(2)}\n`;
    if (aiAnalysis.summary) summary += `  ${aiAnalysis.summary}\n`;
  }
  
  summary += `\n⏰ Generated: ${new Date().toLocaleString()}\n`;
  summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  return summary;
};

// Generate HTML report for PDF export
const generateHTMLReport = (ticker, companyName, currentPrice, previousClose, timeRange, chartData, quoteData, aiAnalysis, news, isAIPowered) => {
  const priceChange = currentPrice && previousClose ? (currentPrice - previousClose).toFixed(2) : 'N/A';
  const priceChangePercent = currentPrice && previousClose 
    ? ((currentPrice - previousClose) / previousClose * 100).toFixed(2) 
    : 'N/A';
  const changeSign = parseFloat(priceChange) > 0 ? '+' : '';
  const changeColor = parseFloat(priceChange) >= 0 ? '#22c55e' : '#ef4444';
  
  const periodStart = chartData[0]?.close;
  const periodEnd = chartData[chartData.length - 1]?.close;
  const periodChange = periodStart && periodEnd 
    ? ((periodEnd - periodStart) / periodStart * 100).toFixed(2)
    : 'N/A';

  const analysisTitle = isAIPowered ? 'AI Analysis (Claude)' : 'Technical Analysis (Rule-Based)';
  const analysisBadge = isAIPowered 
    ? '<span style="background: rgba(139, 92, 246, 0.2); color: #8B5CF6; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">🤖 CLAUDE AI</span>'
    : '<span style="background: rgba(245, 165, 36, 0.2); color: #F5A524; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">⚡ RULE-BASED</span>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${ticker} Stock Analysis Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a; 
      color: #fff; 
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header { margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .ticker { font-size: 36px; font-weight: 700; color: #F5A524; }
    .company { font-size: 18px; color: #999; margin-top: 5px; }
    .price-section { display: flex; gap: 40px; margin: 30px 0; }
    .price-box { background: #1a1a1a; padding: 20px; border-radius: 8px; flex: 1; }
    .price-label { color: #999; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
    .price-value { font-size: 28px; font-weight: 600; }
    .price-change { font-size: 16px; margin-top: 5px; }
    .positive { color: #22c55e; }
    .negative { color: #ef4444; }
    .section { margin: 30px 0; }
    .section-title { font-size: 18px; font-weight: 600; color: #F5A524; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .stat-item { background: #1a1a1a; padding: 15px; border-radius: 8px; }
    .stat-label { color: #999; font-size: 12px; }
    .stat-value { font-size: 16px; font-weight: 500; margin-top: 5px; }
    .ai-box { background: linear-gradient(135deg, #1a1a1a 0%, #2a2a1a 100%); padding: 20px; border-radius: 8px; border: 1px solid #F5A524; }
    .signal { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 600; margin: 10px 0; }
    .signal.bullish { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .signal.bearish { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .signal.neutral { background: rgba(245, 165, 36, 0.2); color: #F5A524; }
    .news-item { background: #1a1a1a; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
    .news-title { font-weight: 500; margin-bottom: 5px; }
    .news-source { color: #999; font-size: 12px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; color: #777; font-size: 12px; text-align: center; }
    @media print {
      body { background: white; color: black; }
      .price-box, .stat-item, .ai-box, .news-item { background: #f5f5f5; }
      .ticker { color: #b8860b; }
      .section-title { color: #b8860b; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="ticker">${ticker}</div>
    ${companyName ? `<div class="company">${companyName}</div>` : ''}
    <div style="color: #777; font-size: 12px; margin-top: 10px;">
      Generated: ${new Date().toLocaleString()} | Timeframe: ${timeRange}
    </div>
  </div>

  <div class="price-section">
    <div class="price-box">
      <div class="price-label">Current Price</div>
      <div class="price-value">$${currentPrice?.toFixed(2) || 'N/A'}</div>
      <div class="price-change ${parseFloat(priceChange) >= 0 ? 'positive' : 'negative'}">
        ${changeSign}$${priceChange} (${changeSign}${priceChangePercent}%)
      </div>
    </div>
    <div class="price-box">
      <div class="price-label">${timeRange} Performance</div>
      <div class="price-value ${parseFloat(periodChange) >= 0 ? 'positive' : 'negative'}">
        ${parseFloat(periodChange) > 0 ? '+' : ''}${periodChange}%
      </div>
      <div style="color: #999; font-size: 14px; margin-top: 5px;">
        ${chartData.length} data points
      </div>
    </div>
  </div>

  ${quoteData ? `
  <div class="section">
    <div class="section-title">Key Statistics</div>
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">Market Cap</div>
        <div class="stat-value">${quoteData.marketCap || 'N/A'}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">P/E Ratio</div>
        <div class="stat-value">${quoteData.peRatio || 'N/A'}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">EPS</div>
        <div class="stat-value">${quoteData.eps || 'N/A'}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">52 Week Range</div>
        <div class="stat-value">${quoteData.fiftyTwoWeekLow || 'N/A'} - ${quoteData.fiftyTwoWeekHigh || 'N/A'}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Volume</div>
        <div class="stat-value">${quoteData.volume || 'N/A'}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Avg Volume</div>
        <div class="stat-value">${quoteData.avgVolume || 'N/A'}</div>
      </div>
    </div>
  </div>
  ` : ''}

  ${aiAnalysis ? `
  <div class="section">
    <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">
      <span>${analysisTitle}</span>
      ${analysisBadge}
    </div>
    <div class="ai-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div>
          <div style="font-size: 20px; font-weight: 600;">${aiAnalysis.pattern || 'Analysis Pending'}</div>
          <span class="signal ${(aiAnalysis.signal || '').toLowerCase()}">${aiAnalysis.signal || 'N/A'}</span>
        </div>
        <div style="text-align: right; color: #999;">
          ${aiAnalysis.support ? `<div>Support: $${aiAnalysis.support.toFixed(2)}</div>` : ''}
          ${aiAnalysis.resistance ? `<div>Resistance: $${aiAnalysis.resistance.toFixed(2)}</div>` : ''}
        </div>
      </div>
      ${aiAnalysis.summary ? `<div style="color: #ccc; line-height: 1.6;">${aiAnalysis.summary}</div>` : ''}
      ${!isAIPowered && aiAnalysis.reasoning ? `
      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #333;">
        <div style="font-size: 12px; font-weight: 600; color: #F5A524; margin-bottom: 10px;">📊 Analysis Logic</div>
        <div style="font-size: 11px; color: #999; line-height: 1.6;">
          <p style="margin-bottom: 8px;"><strong>Method:</strong> ${aiAnalysis.reasoning.method}</p>
          <p style="margin-bottom: 8px;"><strong>Pattern Detection:</strong> ${aiAnalysis.reasoning.patternLogic}</p>
          <p><strong>Signal Logic:</strong> ${aiAnalysis.reasoning.signalLogic}</p>
        </div>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  ${news && news.length > 0 ? `
  <div class="section">
    <div class="section-title">Recent News</div>
    ${news.slice(0, 5).map(item => `
      <div class="news-item">
        <div class="news-title">${item.headline || item.title}</div>
        <div class="news-source">${item.source} • ${item.time || new Date(item.datetime * 1000).toLocaleDateString()}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    <p>This report was generated by StockScope. Data is provided for informational purposes only and should not be considered financial advice.</p>
  </div>
</body>
</html>`;
};


// ============================================================================
// AI CHAT DRAWER COMPONENT (Reusable across all screens)
// ============================================================================

const ChatDrawer = ({
  apiKeys,
  isOpen,
  setIsOpen,
  chatMessages,
  setChatMessages,
  chatLoading,
  setChatLoading,
  contextInfo, // { screen, ticker, positions, scanResults, filters }
}) => {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  
  // Scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  
  // Format markdown content for display
  const formatMessage = (content) => {
    return content
      // Convert ## headers to bold + underlined (with spacing)
      .replace(/^## (.+)$/gm, '<strong style="color: #fff; text-decoration: underline; display: block; margin-top: 10px; margin-bottom: 4px;">$1</strong>')
      // Convert **SYMBOL Analysis** pattern to title style (bigger, bold, blue)
      .replace(/\*\*([A-Z.]{1,5} Analysis)\*\*/g, '<strong style="color: #3B82F6; font-size: 14px; display: block; margin-bottom: 6px;">$1</strong>')
      // Convert **Header** - content pattern (section with dash)
      .replace(/\*\*([^*]+)\*\* - /g, '<strong style="color: #fff;">$1</strong> — ')
      // Convert remaining **text** to inline bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #fff;">$1</strong>')
      // Normalize multiple newlines to double
      .replace(/\n{3,}/g, '\n\n')
      // Convert double newlines to single line break with spacing
      .replace(/\n\n/g, '<br style="display: block; margin: 6px 0;"/>')
      // Convert single newlines to spaces (keeps paragraphs flowing)
      .replace(/\n/g, ' ');
  };
  
  // Send chat message
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    if (!apiKeys.claude) {
      alert('Please configure your Claude API key in Settings to use the AI Chat.');
      return;
    }
    
    const userMessage = chatInput.trim();
    setChatInput('');
    
    const newMessages = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessages(newMessages);
    setChatLoading(true);
    
    try {
      // Build context based on current screen
      let context = `You are a helpful stock research assistant. Be concise and actionable.

Current Context:
- Screen: ${contextInfo.screen || 'Dashboard'}
- Current Stock: ${contextInfo.ticker || 'None selected'}
- User's Positions: ${contextInfo.positions?.length > 0 ? contextInfo.positions.join(', ') : 'None'}`;

      if (contextInfo.scanResults?.length > 0) {
        context += `
- Recent Scan Results: ${contextInfo.scanResults.length} stocks analyzed
- Top Opportunities: ${contextInfo.scanResults.slice(0, 3).map(r => `${r.symbol} (${r.signal} ${r.confidence}%)`).join(', ')}`;
      }
      
      if (contextInfo.filters) {
        context += `
- Active Filters: Sectors=${contextInfo.filters.sectors?.length > 0 ? contextInfo.filters.sectors.join(', ') : 'All'}`;
      }

      context += `

Keep responses concise (under 150 words). Use **bold** for emphasis. Avoid excessive line breaks.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKeys.claude,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: 'You are a concise stock research assistant. Give direct, actionable answers. Use **bold** sparingly for key terms. Write in flowing paragraphs, not bullet lists. Keep responses compact.',
          messages: [{ role: 'user', content: context + '\n\nUser question: ' + userMessage }]
        })
      });

      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      const assistantMessage = data.content[0].text;
      
      const updatedMessages = [...newMessages, { role: 'assistant', content: assistantMessage }];
      setChatMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessages = [...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please check your API key and try again.' }];
      setChatMessages(errorMessages);
    }
    
    setChatLoading(false);
  };
  
  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 48, // Below header
      bottom: 0,
      width: isOpen ? '320px' : '48px',
      background: '#141414',
      borderLeft: '1px solid #252525',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      overflow: 'hidden',
      zIndex: 90, // Below header (200) so header stays on top
    }}>
      {/* Chat Header */}
      <div
        title={isOpen ? 'Collapse chat panel' : 'Expand chat panel'}
        style={{
          padding: '12px',
          borderBottom: '1px solid #252525',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Cpu size={16} style={{ color: '#3B82F6' }} />
        {isOpen && <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', flex: 1 }}>Research Assistant</span>}
        <ChevronDown size={14} style={{ color: '#666', transform: isOpen ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
      </div>
      
      {isOpen && (
        <>
          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                <Cpu size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '11px' }}>Ask me about stocks, market trends, or analysis.</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: msg.role === 'user' ? '#3B82F6' : '#252525',
                    color: msg.role === 'user' ? '#fff' : '#ccc',
                    fontSize: '12px',
                    maxWidth: '85%',
                    lineHeight: '1.6',
                  }}>
                    {msg.role === 'assistant' ? (
                      <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '11px' }}>
                <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                Thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          {/* Chat Input */}
          <div style={{ padding: '12px', borderTop: '1px solid #252525' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask about stocks..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#252525',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                title="Send message"
                style={{
                  padding: '8px 12px',
                  background: chatLoading || !chatInput.trim() ? '#333' : '#3B82F6',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronUp size={16} />
              </button>
            </div>
            {!apiKeys.claude && (
              <p style={{ margin: '8px 0 0', fontSize: '10px', color: '#F75555' }}>
                ⚠️ Configure Claude API key in Settings to use chat
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};


// ============================================================================
// AI DISCOVER VIEW COMPONENT
// ============================================================================

const DiscoverView = ({ 
  apiKeys, 
  favorites, 
  onSelectStock, 
  onAddToPositions,
  // Global chat props
  chatOpen,
  setChatOpen,
  chatMessages,
  setChatMessages,
  chatLoading,
  setChatLoading,
  // Callbacks to update parent state for chat context
  onScanResultsChange,
  onFiltersChange,
}) => {
  // State for stock source
  const [stockSource, setStockSource] = useState('predefined'); // 'predefined', 'watchlist', 'manual'
  const [selectedLists, setSelectedLists] = useState(['popular']); // dow30, nasdaq100, sp500, popular
  const [watchlist, setWatchlist] = useState(() => getStoredWatchlist());
  const [manualTicker, setManualTicker] = useState('');
  
  // State for filters (arrays for multi-select)
  const [filters, setFilters] = useState({
    sectors: [], // Empty = all sectors
    timeframes: [], // Empty = all timeframes
    riskLevels: [], // Empty = all risk levels
    signalTypes: [], // Empty = all signals
    setupTypes: [], // Empty = all setups
    minConfidence: 60,
  });
  
  // Update parent when filters change
  useEffect(() => {
    if (onFiltersChange) onFiltersChange(filters);
  }, [filters, onFiltersChange]);
  
  // Filter options
  const TIMEFRAME_OPTIONS = ['Short-term', 'Swing', 'Long-term'];
  const RISK_OPTIONS = ['Conservative', 'Moderate', 'Aggressive'];
  const SIGNAL_OPTIONS = ['Bullish', 'Bearish'];
  const SETUP_OPTIONS = ['Breakout', 'Pullback', 'Squeeze', 'RSI Divergence', 'MACD Cross', 'Oversold Bounce', 'Volume Climax'];
  
  // Toggle filter value in array
  const toggleFilter = (filterName, value) => {
    setFilters(prev => {
      const current = prev[filterName];
      if (current.includes(value)) {
        return { ...prev, [filterName]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [filterName]: [...current, value] };
      }
    });
  };
  
  // State for scanning
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, status: '' });
  const [scanResults, setScanResults] = useState(() => {
    const stored = getStoredDiscoverResults();
    return stored?.results || [];
  });
  const [lastScanTime, setLastScanTime] = useState(() => {
    const stored = getStoredDiscoverResults();
    return stored?.timestamp || null;
  });
  
  // Update parent when scan results change
  useEffect(() => {
    if (onScanResultsChange) onScanResultsChange(scanResults);
  }, [scanResults, onScanResultsChange]);
  
  // State for selected result (for highlighting in table)
  const [selectedResult, setSelectedResult] = useState(null);
  
  // Get stocks to scan based on source
  const getStocksToScan = () => {
    let stocks = [];
    
    if (stockSource === 'predefined') {
      if (selectedLists.includes('dow30')) stocks = [...stocks, ...DOW_30];
      if (selectedLists.includes('nasdaq100')) stocks = [...stocks, ...NASDAQ_100];
      if (selectedLists.includes('sp500')) stocks = [...stocks, ...SP_500];
      if (selectedLists.includes('popular')) stocks = [...stocks, ...POPULAR_STOCKS];
      // Remove duplicates
      stocks = [...new Set(stocks)];
    } else if (stockSource === 'watchlist') {
      stocks = watchlist;
    }
    
    // Apply sector filter (if any sectors selected)
    if (filters.sectors.length > 0) {
      stocks = stocks.filter(s => filters.sectors.includes(getStockSector(s)));
    }
    
    return stocks.slice(0, 50); // Limit to 50
  };
  
  // Quick technical analysis with setup detection
  const quickAnalyze = async (symbol) => {
    try {
      // Try to fetch real data from APIs
      let data = null;
      let isRealData = false;
      
      // Always try to fetch real data - fetchStockData has Yahoo Finance as fallback
      try {
        const fetchResult = await fetchStockData(symbol, '3M', apiKeys);
        if (fetchResult.success && fetchResult.chartData && fetchResult.chartData.length >= 20) {
          data = fetchResult.chartData;
          isRealData = true;
          console.log(`✓ Real data fetched for ${symbol}: ${data.length} candles, latest price: $${data[data.length-1]?.close}`);
        }
      } catch (fetchError) {
        console.log(`Failed to fetch real data for ${symbol}:`, fetchError.message);
      }
      
      // Fall back to sample data only if real data fetch completely failed
      if (!data || data.length < 20) {
        console.log(`⚠ Using sample data for ${symbol} (fetch failed or insufficient data)`);
        data = generateSampleData(100, '3M', 100 + Math.random() * 200);
        isRealData = false;
      }
      
      // Calculate all technical indicators
      const rsiArray = calculateRSIArray(data, 14);
      const rsi = rsiArray[rsiArray.length - 1];
      const macdFull = calculateMACDFull(data);
      const macd = macdFull.macd[macdFull.macd.length - 1];
      const macdSignal = macdFull.signal[macdFull.signal.length - 1];
      const macdHist = macdFull.histogram[macdFull.histogram.length - 1];
      const prevMacdHist = macdFull.histogram[macdFull.histogram.length - 2];
      const bb = calculateBollingerBands(data, 20, 2);
      const atr = calculateATR(data, 14);
      const volumeSMA = calculateVolumeSMA(data, 20);
      
      const sma20Array = calculateSMAArray(data, 20);
      const sma50Array = calculateSMAArray(data, 50);
      const sma200Array = calculateSMAArray(data, 200);
      
      const sma20 = sma20Array[sma20Array.length - 1];
      const sma50 = sma50Array[sma50Array.length - 1];
      const sma200 = sma200Array[sma200Array.length - 1];
      
      const currentPrice = data[data.length - 1].close;
      const currentVolume = data[data.length - 1].volume;
      const avgVolume = volumeSMA[volumeSMA.length - 1];
      const volumeRatio = avgVolume ? currentVolume / avgVolume : 1;
      
      // Build indicators object for setup detection
      const indicators = {
        rsi: rsiArray,
        macd: macdFull,
        bb,
        atr,
        volumeSMA,
        sma20: sma20Array,
        sma50: sma50Array,
        sma200: sma200Array,
      };
      
      // Detect swing trade setups
      const setups = detectSwingSetups(data, indicators);
      
      // Calculate confidence score
      const { score: confidenceScore, breakdown } = calculateConfidenceScore(data, indicators);
      
      // Determine primary signal from setups or indicators
      let signal = 'NEUTRAL';
      let primarySetup = null;
      let confidence = confidenceScore;
      let reasons = [];
      
      // If we found setups, use the highest confidence one
      if (setups.length > 0) {
        // Sort by confidence
        setups.sort((a, b) => b.confidence - a.confidence);
        primarySetup = setups[0];
        signal = primarySetup.signal;
        confidence = Math.max(confidence, primarySetup.confidence);
        reasons.push(primarySetup.description);
        
        // Add supporting setups
        if (setups.length > 1) {
          reasons.push(`+${setups.length - 1} more setup${setups.length > 2 ? 's' : ''}`);
        }
      } else {
        // Fallback to basic indicator analysis
        if (rsi < 30) {
          signal = 'BULLISH';
          reasons.push('RSI oversold');
        } else if (rsi > 70) {
          signal = 'BEARISH';
          reasons.push('RSI overbought');
        }
        
        if (macd > 0 && macdSignal && macd > macdSignal) {
          if (signal !== 'BEARISH') signal = 'BULLISH';
          reasons.push('MACD bullish');
        } else if (macd < 0 && macdSignal && macd < macdSignal) {
          if (signal !== 'BULLISH') signal = 'BEARISH';
          reasons.push('MACD bearish');
        }
        
        if (sma20 && sma50 && currentPrice > sma20 && sma20 > sma50) {
          if (signal !== 'BEARISH') signal = 'BULLISH';
          reasons.push('Uptrend');
        } else if (sma20 && sma50 && currentPrice < sma20 && sma20 < sma50) {
          if (signal !== 'BULLISH') signal = 'BEARISH';
          reasons.push('Downtrend');
        }
      }
      
      // Price change analysis
      const priceChange5d = ((data[data.length - 1].close - data[data.length - 6].close) / data[data.length - 6].close) * 100;
      
      // Determine timeframe suitability based on setup and volatility
      let timeframe = 'Swing';
      if (primarySetup) {
        if (['Breakout', 'Squeeze', 'Volume Climax'].includes(primarySetup.type)) {
          timeframe = 'Short-term';
        } else if (['Pullback', 'RSI Divergence'].includes(primarySetup.type)) {
          timeframe = 'Swing';
        }
      } else {
        if (Math.abs(priceChange5d) > 8) timeframe = 'Short-term';
        if (Math.abs(priceChange5d) < 2 && signal !== 'NEUTRAL') timeframe = 'Long-term';
      }
      
      // Determine risk level based on ATR and setup
      const atrValue = atr[atr.length - 1] || (currentPrice * 0.02);
      const atrPercent = atrValue ? (atrValue / currentPrice) * 100 : 2;
      let riskLevel = 'Moderate';
      if (atrPercent < 1.5) riskLevel = 'Conservative';
      if (atrPercent > 3) riskLevel = 'Aggressive';
      
      // Volume analysis
      let volumeSignal = '';
      if (volumeRatio >= 2) {
        volumeSignal = 'High volume';
      } else if (volumeRatio >= 1.5) {
        volumeSignal = 'Above avg vol';
      } else if (volumeRatio < 0.7) {
        volumeSignal = 'Low volume';
      }
      if (volumeSignal && !reasons.includes(volumeSignal)) {
        reasons.push(volumeSignal);
      }
      
      // Bollinger Band position
      const bbUpper = bb.upper[bb.upper.length - 1];
      const bbLower = bb.lower[bb.lower.length - 1];
      const bbMiddle = bb.middle[bb.middle.length - 1];
      let bbPosition = '';
      if (bbUpper && bbLower) {
        const bbRange = bbUpper - bbLower;
        const posInBB = (currentPrice - bbLower) / bbRange;
        if (posInBB > 0.9) bbPosition = 'Near upper BB';
        else if (posInBB < 0.1) bbPosition = 'Near lower BB';
      }
      
      // =========================================
      // TRADE SETUP CALCULATIONS
      // =========================================
      
      // Calculate support/resistance for entry/exit
      const recentHigh = Math.max(...data.slice(-20).map(d => d.high));
      const recentLow = Math.min(...data.slice(-20).map(d => d.low));
      
      // Determine trade type (Stock vs Options)
      // Options preferred for: high volatility, clear directional moves, shorter timeframes
      const useOptions = (atrPercent > 2 && confidence >= 70) || 
                         (timeframe === 'Short-term' && confidence >= 75) ||
                         (primarySetup && ['Breakout', 'Squeeze', 'RSI Divergence'].includes(primarySetup.type));
      
      // Calculate entry, stop loss, take profit based on signal direction
      let tradeDirection, entry, stopLoss, takeProfit, riskRewardRatio;
      
      if (signal === 'BULLISH') {
        tradeDirection = useOptions ? 'CALL' : 'BUY';
        // Entry: current price or slightly below for better fill
        entry = currentPrice;
        // Stop loss: below recent support or 1.5x ATR below entry
        stopLoss = Math.max(
          recentLow - (atrValue * 0.5),
          currentPrice - (atrValue * 1.5),
          bbLower || (currentPrice * 0.95)
        );
        // Take profit: recent resistance or 2-3x the risk
        const risk = entry - stopLoss;
        takeProfit = Math.min(
          recentHigh + (atrValue * 0.5),
          entry + (risk * 2.5)
        );
        riskRewardRatio = (takeProfit - entry) / (entry - stopLoss);
      } else if (signal === 'BEARISH') {
        tradeDirection = useOptions ? 'PUT' : 'SHORT';
        entry = currentPrice;
        // Stop loss: above recent resistance or 1.5x ATR above entry
        stopLoss = Math.min(
          recentHigh + (atrValue * 0.5),
          currentPrice + (atrValue * 1.5),
          bbUpper || (currentPrice * 1.05)
        );
        // Take profit: recent support or 2-3x the risk
        const risk = stopLoss - entry;
        takeProfit = Math.max(
          recentLow - (atrValue * 0.5),
          entry - (risk * 2.5)
        );
        riskRewardRatio = (entry - takeProfit) / (stopLoss - entry);
      } else {
        // Neutral - no clear trade
        tradeDirection = 'WAIT';
        entry = currentPrice;
        stopLoss = currentPrice - atrValue;
        takeProfit = currentPrice + atrValue;
        riskRewardRatio = 1;
      }
      
      // Calculate option expiration (if using options)
      // Short-term: 2-3 weeks out, Swing: 4-6 weeks, Long-term: 2-3 months
      let optionExpiry = null;
      if (useOptions) {
        const today = new Date();
        let daysToAdd;
        if (timeframe === 'Short-term') {
          daysToAdd = 14 + Math.floor(Math.random() * 7); // 2-3 weeks
        } else if (timeframe === 'Swing') {
          daysToAdd = 30 + Math.floor(Math.random() * 14); // 4-6 weeks
        } else {
          daysToAdd = 60 + Math.floor(Math.random() * 30); // 2-3 months
        }
        const expiryDate = new Date(today);
        expiryDate.setDate(expiryDate.getDate() + daysToAdd);
        // Adjust to next Friday (options typically expire on Fridays)
        const dayOfWeek = expiryDate.getDay();
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
        expiryDate.setDate(expiryDate.getDate() + daysUntilFriday);
        optionExpiry = expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      
      // Calculate position size recommendation (based on 2% risk rule)
      const riskPerShare = Math.abs(entry - stopLoss);
      const positionSizeFor1000 = Math.floor(20 / riskPerShare); // $20 risk on $1000 account (2%)
      const positionSizeFor10000 = Math.floor(200 / riskPerShare); // $200 risk on $10000 account
      
      // Strike price recommendation for options (ATM or slightly OTM)
      let strikePrice = null;
      if (useOptions) {
        // Round to nearest $5 for stocks over $50, nearest $2.50 for under $50, nearest $1 for under $25
        if (currentPrice >= 50) {
          strikePrice = Math.round(currentPrice / 5) * 5;
        } else if (currentPrice >= 25) {
          strikePrice = Math.round(currentPrice / 2.5) * 2.5;
        } else {
          strikePrice = Math.round(currentPrice);
        }
        // Adjust strike based on direction
        if (signal === 'BULLISH') {
          // Slightly OTM call
          strikePrice = strikePrice + (currentPrice >= 50 ? 5 : currentPrice >= 25 ? 2.5 : 1);
        } else if (signal === 'BEARISH') {
          // Slightly OTM put
          strikePrice = strikePrice - (currentPrice >= 50 ? 5 : currentPrice >= 25 ? 2.5 : 1);
        }
      }
      
      // Trade setup object
      const tradeSetup = {
        type: useOptions ? 'OPTIONS' : 'STOCK',
        direction: tradeDirection,
        entry: parseFloat(entry.toFixed(2)),
        stopLoss: parseFloat(stopLoss.toFixed(2)),
        takeProfit: parseFloat(takeProfit.toFixed(2)),
        riskReward: parseFloat(riskRewardRatio.toFixed(2)),
        optionExpiry,
        strikePrice: strikePrice ? parseFloat(strikePrice.toFixed(2)) : null,
        positionSize: {
          small: positionSizeFor1000, // $1k account
          medium: positionSizeFor10000, // $10k account
        },
        riskPercent: parseFloat(((riskPerShare / currentPrice) * 100).toFixed(1)),
        potentialGain: parseFloat((((takeProfit - entry) / entry) * 100).toFixed(1)),
        potentialLoss: parseFloat((((entry - stopLoss) / entry) * 100).toFixed(1)),
      };
      
      return {
        symbol,
        sector: getStockSector(symbol),
        signal,
        confidence: Math.min(Math.round(confidence), 95),
        timeframe,
        riskLevel,
        price: currentPrice.toFixed(2),
        change: priceChange5d.toFixed(1),
        rsi: rsi?.toFixed(1) || 'N/A',
        macd: macd?.toFixed(2) || 'N/A',
        volumeRatio: volumeRatio.toFixed(1),
        setup: primarySetup?.type || null,
        setupCount: setups.length,
        allSetups: setups,
        summary: reasons.slice(0, 3).join(' • ') || 'Mixed signals',
        scoreBreakdown: breakdown,
        tradeSetup, // Complete trade setup
        isRealData, // Flag to indicate if this is real market data
        data, // Keep for deep dive
        indicators, // Keep indicator data for details view
      };
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error);
      return null;
    }
  };
  
  // Run scan
  const runScan = async () => {
    const stocks = getStocksToScan();
    if (stocks.length === 0) {
      alert('No stocks to scan. Please select a stock list or add stocks to your watchlist.');
      return;
    }
    
    setIsScanning(true);
    setScanProgress({ current: 0, total: stocks.length, status: 'Initializing scanner...' });
    
    const results = [];
    let realDataCount = 0;
    let sampleDataCount = 0;
    
    for (let i = 0; i < stocks.length; i++) {
      const symbol = stocks[i];
      setScanProgress({ 
        current: i + 1, 
        total: stocks.length, 
        status: `Fetching & analyzing ${symbol}...` 
      });
      
      const result = await quickAnalyze(symbol);
      if (result) {
        if (result.isRealData) {
          realDataCount++;
        } else {
          sampleDataCount++;
        }
        
        // Apply filters (empty array = include all)
        let include = true;
        if (filters.timeframes.length > 0 && !filters.timeframes.includes(result.timeframe)) include = false;
        if (filters.riskLevels.length > 0 && !filters.riskLevels.includes(result.riskLevel)) include = false;
        if (filters.signalTypes.length > 0 && !filters.signalTypes.map(s => s.toUpperCase()).includes(result.signal)) include = false;
        if (filters.setupTypes.length > 0) {
          // Check if any of the stock's setups match the filter
          const stockSetupTypes = result.allSetups?.map(s => s.type) || [];
          if (!filters.setupTypes.some(filterSetup => stockSetupTypes.includes(filterSetup))) {
            include = false;
          }
        }
        if (result.confidence < filters.minConfidence) include = false;
        
        if (include) {
          results.push(result);
        }
      }
      
      // Delay between API calls to prevent rate limiting
      // Use longer delay (800ms) to allow CORS proxy and API to respond
      await new Promise(r => setTimeout(r, 800));
    }
    
    console.log(`Scan complete: ${realDataCount} with real data, ${sampleDataCount} with sample data`);
    
    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);
    
    setScanResults(results);
    setLastScanTime(Date.now());
    saveDiscoverResults({ results, timestamp: Date.now() });
    setIsScanning(false);
    setScanProgress({ current: 0, total: 0, status: '' });
  };
  
  // AI Deep Dive - outputs to chat panel
  const runDeepDive = async (result) => {
    if (!apiKeys.claude) {
      alert('Please configure your Claude API key in Settings to use AI Deep Dive.');
      return;
    }
    
    // Expand chat panel if collapsed
    setChatOpen(true);
    
    // Add user request to chat
    const userMessage = `Analyze ${result.symbol} for trading opportunities`;
    const newMessages = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessages(newMessages);
    setChatLoading(true);
    
    try {
      const prompt = `You are a stock research analyst. Analyze ${result.symbol} (${result.sector} sector) for trading opportunities.

IMPORTANT: Use your real knowledge about ${result.symbol}. The technical indicators below may be simulated.

Context: Signal=${result.signal}, Confidence=${result.confidence}%

Format your response EXACTLY like this (use **bold** for headers, keep content concise, NO extra blank lines between sections):

**${result.symbol} Analysis**

**Company Overview** - Brief overview in 1-2 sentences.

**Key Price Levels** - Recent performance and S/R levels.

**Bullish Factors** - Positive catalysts (2-3 points).

**Bearish Factors** - Risks to consider (2-3 points).

**Outlook** - Short and long-term perspective.

Keep total response under 250 words. Be specific and actionable.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKeys.claude,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      const assistantMessage = data.content[0].text;
      
      const updatedMessages = [...newMessages, { role: 'assistant', content: assistantMessage }];
      setChatMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    } catch (error) {
      console.error('Deep dive error:', error);
      const errorMessages = [...newMessages, { role: 'assistant', content: 'Error: Unable to perform AI analysis. Please check your API key and try again.' }];
      setChatMessages(errorMessages);
    }
    
    setChatLoading(false);
  };
  
  // Add to watchlist
  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      const newWatchlist = [...watchlist, symbol.toUpperCase()];
      setWatchlist(newWatchlist);
      saveWatchlist(newWatchlist);
    }
  };
  
  // Remove from watchlist
  const removeFromWatchlist = (symbol) => {
    const newWatchlist = watchlist.filter(s => s !== symbol);
    setWatchlist(newWatchlist);
    saveWatchlist(newWatchlist);
  };
  
  // Handle manual ticker add
  const handleAddManualTicker = () => {
    if (manualTicker.trim()) {
      addToWatchlist(manualTicker.trim().toUpperCase());
      setManualTicker('');
    }
  };
  
  // Parse uploaded watchlist file
  const handleWatchlistUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      // Parse CSV or text file (one ticker per line or comma-separated)
      const tickers = content
        .split(/[\n,]/)
        .map(t => t.trim().toUpperCase())
        .filter(t => t && /^[A-Z.]{1,5}$/.test(t));
      
      if (tickers.length > 0) {
        const newWatchlist = [...new Set([...watchlist, ...tickers])];
        setWatchlist(newWatchlist);
        saveWatchlist(newWatchlist);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };
  
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main Content */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={20} style={{ color: '#3B82F6' }} />
            AI Discover
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#777' }}>
            Find profitable trading opportunities using technical analysis and AI
          </p>
        </div>
        
        {/* Stock Source Selection */}
        <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>
            Stock Source
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {['predefined', 'watchlist'].map(source => (
              <button
                key={source}
                onClick={() => setStockSource(source)}
                style={{
                  padding: '6px 12px',
                  background: stockSource === source ? '#3B82F6' : '#252525',
                  border: 'none',
                  borderRadius: '4px',
                  color: stockSource === source ? '#fff' : '#888',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {source === 'predefined' ? 'Predefined Lists' : 'My Watchlist'}
              </button>
            ))}
          </div>
          
          {stockSource === 'predefined' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                { id: 'popular', label: 'Popular (50)', count: POPULAR_STOCKS.length },
                { id: 'dow30', label: 'Dow 30', count: DOW_30.length },
                { id: 'nasdaq100', label: 'NASDAQ 100', count: NASDAQ_100.length },
                { id: 'sp500', label: 'S&P 500', count: SP_500.length },
              ].map(list => (
                <label
                  key={list.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: selectedLists.includes(list.id) ? 'rgba(59, 130, 246, 0.2)' : '#252525',
                    border: `1px solid ${selectedLists.includes(list.id) ? '#3B82F6' : '#333'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: selectedLists.includes(list.id) ? '#3B82F6' : '#888',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedLists.includes(list.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLists([...selectedLists, list.id]);
                      } else {
                        setSelectedLists(selectedLists.filter(l => l !== list.id));
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  {list.label}
                </label>
              ))}
            </div>
          )}
          
          {stockSource === 'watchlist' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={manualTicker}
                  onChange={(e) => setManualTicker(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddManualTicker()}
                  placeholder="Add ticker (e.g., AAPL)"
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    background: '#252525',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <button
                  onClick={handleAddManualTicker}
                  title="Add ticker to watchlist"
                  style={{
                    padding: '6px 12px',
                    background: '#3B82F6',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={12} />
                </button>
                <label 
                  title="Upload CSV or TXT file with tickers"
                  style={{
                  padding: '6px 12px',
                  background: '#252525',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: '#888',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <Upload size={12} />
                  Upload
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleWatchlistUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              {watchlist.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {watchlist.map(symbol => (
                    <span
                      key={symbol}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        background: '#252525',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: '#aaa',
                      }}
                    >
                      {symbol}
                      <X
                        size={10}
                        style={{ cursor: 'pointer', color: '#666' }}
                        onClick={() => removeFromWatchlist(symbol)}
                        title={`Remove ${symbol} from watchlist`}
                      />
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>
                  No stocks in watchlist. Add tickers above or upload a CSV file.
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Filters */}
        <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '10px', textTransform: 'uppercase' }}>
            Filters
          </div>
          
          {/* Sector Filter */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>Sectors {filters.sectors.length > 0 && `(${filters.sectors.length})`}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {ALL_SECTORS.filter(s => s !== 'All').map(sector => (
                <button
                  key={sector}
                  onClick={() => toggleFilter('sectors', sector)}
                  title={`Filter by ${sector}`}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    background: filters.sectors.includes(sector) ? 'rgba(59, 130, 246, 0.2)' : '#252525',
                    border: `1px solid ${filters.sectors.includes(sector) ? '#3B82F6' : '#333'}`,
                    borderRadius: '4px',
                    color: filters.sectors.includes(sector) ? '#3B82F6' : '#888',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>
          
          {/* Timeframe, Risk, Signal Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '10px' }}>
            {/* Timeframe */}
            <div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>Timeframe</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {TIMEFRAME_OPTIONS.map(tf => (
                  <button
                    key={tf}
                    onClick={() => toggleFilter('timeframes', tf)}
                    title={`Filter by ${tf}`}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      background: filters.timeframes.includes(tf) ? 'rgba(59, 130, 246, 0.2)' : '#252525',
                      border: `1px solid ${filters.timeframes.includes(tf) ? '#3B82F6' : '#333'}`,
                      borderRadius: '4px',
                      color: filters.timeframes.includes(tf) ? '#3B82F6' : '#888',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Risk Level */}
            <div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>Risk Level</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {RISK_OPTIONS.map(risk => (
                  <button
                    key={risk}
                    onClick={() => toggleFilter('riskLevels', risk)}
                    title={`Filter by ${risk} risk`}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      background: filters.riskLevels.includes(risk) ? 'rgba(59, 130, 246, 0.2)' : '#252525',
                      border: `1px solid ${filters.riskLevels.includes(risk) ? '#3B82F6' : '#333'}`,
                      borderRadius: '4px',
                      color: filters.riskLevels.includes(risk) ? '#3B82F6' : '#888',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {risk}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Signal Type */}
            <div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>Signal</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {SIGNAL_OPTIONS.map(signal => (
                  <button
                    key={signal}
                    onClick={() => toggleFilter('signalTypes', signal)}
                    title={`Filter by ${signal} signals`}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      background: filters.signalTypes.includes(signal) ? (signal === 'Bullish' ? 'rgba(62, 207, 142, 0.2)' : 'rgba(247, 85, 85, 0.2)') : '#252525',
                      border: `1px solid ${filters.signalTypes.includes(signal) ? (signal === 'Bullish' ? '#3ECF8E' : '#F75555') : '#333'}`,
                      borderRadius: '4px',
                      color: filters.signalTypes.includes(signal) ? (signal === 'Bullish' ? '#3ECF8E' : '#F75555') : '#888',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {signal}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Setup Types */}
            <div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>Setup Type {filters.setupTypes.length > 0 && `(${filters.setupTypes.length})`}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {SETUP_OPTIONS.map(setup => (
                  <button
                    key={setup}
                    onClick={() => toggleFilter('setupTypes', setup)}
                    title={`Filter by ${setup} setups`}
                    style={{
                      padding: '3px 6px',
                      fontSize: '9px',
                      background: filters.setupTypes.includes(setup) ? 'rgba(139, 92, 246, 0.2)' : '#252525',
                      border: `1px solid ${filters.setupTypes.includes(setup) ? '#8B5CF6' : '#333'}`,
                      borderRadius: '4px',
                      color: filters.setupTypes.includes(setup) ? '#8B5CF6' : '#888',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {setup}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Confidence Slider & Scan Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: '#666' }}>Min Confidence:</span>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={filters.minConfidence}
                onChange={(e) => setFilters({ ...filters, minConfidence: parseInt(e.target.value) })}
                style={{ width: '80px' }}
                title={`Minimum confidence: ${filters.minConfidence}%`}
              />
              <span style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 600 }}>{filters.minConfidence}%</span>
            </div>
            <button
              onClick={runScan}
              disabled={isScanning}
              title="Scan stocks with current filters"
              style={{
                padding: '8px 16px',
                background: isScanning ? '#333' : '#3B82F6',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 600,
                cursor: isScanning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginLeft: 'auto',
              }}
            >
              {isScanning ? (
                <>
                  <RefreshCw size={12} className="spinning" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search size={12} />
                  Scan ({getStocksToScan().length} stocks)
                </>
              )}
            </button>
          </div>
          {isScanning && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                <span>{scanProgress.status}</span>
                <span>{scanProgress.current}/{scanProgress.total}</span>
              </div>
              <div style={{ height: '4px', background: '#252525', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(scanProgress.current / scanProgress.total) * 100}%`, background: '#3B82F6', transition: 'width 0.2s' }} />
              </div>
            </div>
          )}
        </div>
        
        {/* Results */}
        <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>
              Results ({scanResults.length})
            </div>
            {lastScanTime && (
              <div style={{ fontSize: '10px', color: '#666' }}>
                Last scan: {new Date(lastScanTime).toLocaleString()}
              </div>
            )}
          </div>
          
          {scanResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <Search size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '12px' }}>No results yet. Configure your settings and click Scan to find opportunities.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#888', fontWeight: 600 }}>Symbol</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#888', fontWeight: 600 }}>Sector</th>
                    <th style={{ padding: '8px', textAlign: 'center', color: '#888', fontWeight: 600 }}>Signal</th>
                    <th style={{ padding: '8px', textAlign: 'center', color: '#888', fontWeight: 600 }}>Score</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#888', fontWeight: 600 }}>Setup</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#888', fontWeight: 600 }}>Summary</th>
                    <th style={{ padding: '8px', textAlign: 'center', color: '#888', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scanResults.map((result, idx) => (
                    <React.Fragment key={result.symbol}>
                      <tr
                        style={{
                          borderBottom: selectedResult?.symbol === result.symbol ? 'none' : '1px solid #252525',
                          background: selectedResult?.symbol === result.symbol ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedResult(selectedResult?.symbol === result.symbol ? null : result)}
                      >
                        <td style={{ padding: '10px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ChevronDown 
                              size={12} 
                              style={{ 
                                color: '#666', 
                                transform: selectedResult?.symbol === result.symbol ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                              }} 
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 600, color: '#fff' }}>{result.symbol}</span>
                                <span style={{
                                  padding: '1px 4px',
                                  borderRadius: '3px',
                                  fontSize: '8px',
                                  fontWeight: 700,
                                  background: result.isRealData ? 'rgba(62, 207, 142, 0.2)' : 'rgba(245, 165, 36, 0.2)',
                                  color: result.isRealData ? '#3ECF8E' : '#F5A524',
                                  letterSpacing: '0.5px',
                                }}>
                                  {result.isRealData ? 'LIVE' : 'DEMO'}
                                </span>
                              </div>
                              <div style={{ fontSize: '9px', color: '#666' }}>${result.price} {result.change && <span style={{ color: parseFloat(result.change) >= 0 ? '#3ECF8E' : '#F75555' }}>({result.change > 0 ? '+' : ''}{result.change}%)</span>}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 8px', color: '#888', fontSize: '10px' }}>
                          {result.sector}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            background: result.signal === 'BULLISH' ? 'rgba(62, 207, 142, 0.2)' : result.signal === 'BEARISH' ? 'rgba(247, 85, 85, 0.2)' : 'rgba(128, 128, 128, 0.2)',
                            color: result.signal === 'BULLISH' ? '#3ECF8E' : result.signal === 'BEARISH' ? '#F75555' : '#888',
                          }}>
                            {result.signal === 'BULLISH' ? '▲ BULL' : result.signal === 'BEARISH' ? '▼ BEAR' : '— NEUTRAL'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: result.confidence >= 80 ? 'rgba(62, 207, 142, 0.15)' : result.confidence >= 70 ? 'rgba(59, 130, 246, 0.15)' : result.confidence >= 60 ? 'rgba(245, 165, 36, 0.15)' : 'rgba(128, 128, 128, 0.15)',
                            border: `2px solid ${result.confidence >= 80 ? '#3ECF8E' : result.confidence >= 70 ? '#3B82F6' : result.confidence >= 60 ? '#F5A524' : '#555'}`,
                          }}>
                            <span style={{
                              color: result.confidence >= 80 ? '#3ECF8E' : result.confidence >= 70 ? '#3B82F6' : result.confidence >= 60 ? '#F5A524' : '#888',
                              fontWeight: 700,
                              fontSize: '11px',
                            }}>
                              {result.confidence}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          {result.setup ? (
                            <div>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '9px',
                                fontWeight: 600,
                                background: 'rgba(139, 92, 246, 0.2)',
                                color: '#8B5CF6',
                              }}>
                                {result.setup}
                              </span>
                              {result.setupCount > 1 && (
                                <span style={{ fontSize: '9px', color: '#666', marginLeft: '4px' }}>
                                  +{result.setupCount - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#555', fontSize: '10px' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#aaa', maxWidth: '180px', fontSize: '10px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={result.summary}>
                            {result.summary}
                          </div>
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); runDeepDive(result); }}
                              title="AI Deep Dive"
                              style={{
                                padding: '4px 8px',
                                background: '#3B82F6',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Zap size={10} />
                              AI
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onSelectStock(result.symbol); }}
                              title="View Chart"
                              style={{
                                padding: '4px 8px',
                                background: '#252525',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: '#888',
                                fontSize: '10px',
                                cursor: 'pointer',
                              }}
                            >
                              <BarChart2 size={10} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onAddToPositions(result.symbol); }}
                              title="Add to Positions"
                              style={{
                                padding: '4px 8px',
                                background: favorites.includes(result.symbol) ? 'rgba(62, 207, 142, 0.2)' : '#252525',
                                border: `1px solid ${favorites.includes(result.symbol) ? '#3ECF8E' : '#333'}`,
                                borderRadius: '4px',
                                color: favorites.includes(result.symbol) ? '#3ECF8E' : '#888',
                                fontSize: '10px',
                                cursor: 'pointer',
                              }}
                            >
                              <Star size={10} fill={favorites.includes(result.symbol) ? '#3ECF8E' : 'none'} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Inline Expandable Detail Row */}
                      {selectedResult?.symbol === result.symbol && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0, background: '#111', borderBottom: '2px solid #282828' }}>
                            <div style={{ padding: '24px' }}>
                              
                              {/* Sample Data Warning - minimal */}
                              {!result.isRealData && (
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  marginBottom: '20px',
                                  background: 'rgba(217, 119, 6, 0.1)',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  color: '#D97706',
                                }}>
                                  <AlertCircle size={12} />
                                  Simulated data — Add API keys for live prices
                                </div>
                              )}
                              
                              {/* ===== HERO: Trade Recommendation ===== */}
                              <div style={{ marginBottom: '28px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}>
                                  
                                  {/* Main Action */}
                                  <div>
                                    <div style={{ 
                                      fontSize: '11px', 
                                      color: '#666', 
                                      textTransform: 'uppercase', 
                                      letterSpacing: '1px',
                                      marginBottom: '6px',
                                    }}>
                                      {result.tradeSetup?.type || 'Stock'} Trade
                                    </div>
                                    <div style={{ 
                                      fontSize: '36px', 
                                      fontWeight: 700,
                                      color: result.tradeSetup?.direction === 'WAIT' ? '#555' : result.signal === 'BULLISH' ? '#22C55E' : '#EF4444',
                                      lineHeight: 1,
                                      marginBottom: '8px',
                                    }}>
                                      {result.tradeSetup?.direction === 'BUY' && '↑ BUY'}
                                      {result.tradeSetup?.direction === 'SHORT' && '↓ SHORT'}
                                      {result.tradeSetup?.direction === 'CALL' && '↑ CALL'}
                                      {result.tradeSetup?.direction === 'PUT' && '↓ PUT'}
                                      {result.tradeSetup?.direction === 'WAIT' && '— WAIT'}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#888' }}>
                                      {result.confidence}% confidence · {result.timeframe} · {result.riskLevel} risk
                                    </div>
                                  </div>
                                  
                                  {/* Price Levels - inline, not boxed */}
                                  <div style={{ display: 'flex', gap: '28px' }}>
                                    <div>
                                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Entry</div>
                                      <div style={{ fontSize: '24px', fontWeight: 600, color: '#fff' }}>${result.tradeSetup?.entry}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '11px', color: '#22C55E', marginBottom: '4px' }}>Target (+{result.tradeSetup?.potentialGain}%)</div>
                                      <div style={{ fontSize: '24px', fontWeight: 600, color: '#22C55E' }}>${result.tradeSetup?.takeProfit}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '11px', color: '#EF4444', marginBottom: '4px' }}>Stop (-{result.tradeSetup?.potentialLoss}%)</div>
                                      <div style={{ fontSize: '24px', fontWeight: 600, color: '#EF4444' }}>${result.tradeSetup?.stopLoss}</div>
                                    </div>
                                  </div>
                                  
                                  {/* Risk:Reward badge */}
                                  <div style={{
                                    padding: '12px 20px',
                                    background: result.tradeSetup?.riskReward >= 2 ? 'rgba(34, 197, 94, 0.08)' : '#1a1a1a',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                  }}>
                                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>R:R</div>
                                    <div style={{ 
                                      fontSize: '22px', 
                                      fontWeight: 700, 
                                      color: result.tradeSetup?.riskReward >= 2 ? '#22C55E' : '#fff',
                                    }}>
                                      1:{result.tradeSetup?.riskReward || '—'}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Option Contract - if applicable */}
                                {result.tradeSetup?.type === 'OPTIONS' && (
                                  <div style={{ marginTop: '16px', fontSize: '13px', color: '#888' }}>
                                    <span style={{ color: '#fff', fontWeight: 500 }}>{result.symbol} ${result.tradeSetup?.strikePrice} {result.tradeSetup?.direction}</span>
                                    {' '} expiring <span style={{ color: '#D97706' }}>{result.tradeSetup?.optionExpiry}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* ===== SECONDARY: Why + Details ===== */}
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'minmax(300px, 2fr) minmax(200px, 1fr)', 
                                gap: '32px',
                              }}>
                                
                                {/* Why This Trade */}
                                <div>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    color: '#555', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.5px',
                                    marginBottom: '12px',
                                    fontWeight: 500,
                                  }}>
                                    Analysis
                                  </div>
                                  <div style={{ fontSize: '14px', color: '#B0B0B0', lineHeight: 1.7 }}>
                                    {(() => {
                                      const reasons = [];
                                      const rsi = parseFloat(result.rsi);
                                      const macd = parseFloat(result.macd);
                                      const vol = parseFloat(result.volumeRatio);
                                      const setup = result.allSetups?.[0];
                                      
                                      if (result.signal === 'BULLISH') {
                                        if (rsi < 35) reasons.push(`RSI at ${result.rsi} suggests oversold conditions with potential for reversal.`);
                                        else if (rsi > 50 && rsi < 70) reasons.push(`RSI at ${result.rsi} shows healthy momentum without being overbought.`);
                                        if (macd > 0) reasons.push(`MACD is positive (${result.macd}), confirming bullish momentum.`);
                                        if (vol >= 1.3) reasons.push(`Volume is ${result.volumeRatio}x average, indicating institutional interest.`);
                                      } else if (result.signal === 'BEARISH') {
                                        if (rsi > 65) reasons.push(`RSI at ${result.rsi} suggests overbought conditions with potential for pullback.`);
                                        else if (rsi < 50 && rsi > 30) reasons.push(`RSI at ${result.rsi} shows weakening momentum.`);
                                        if (macd < 0) reasons.push(`MACD is negative (${result.macd}), confirming bearish momentum.`);
                                        if (vol >= 1.3) reasons.push(`Elevated volume (${result.volumeRatio}x avg) may signal distribution.`);
                                      }
                                      
                                      if (setup) {
                                        const setupReasons = {
                                          'Breakout': 'Price is breaking through key resistance with volume confirmation.',
                                          'Pullback': 'Healthy pullback to support in an established uptrend offers favorable entry.',
                                          'Squeeze': 'Bollinger Band compression suggests an imminent volatility expansion.',
                                          'RSI Divergence': 'Price and RSI are diverging, often preceding a trend reversal.',
                                          'MACD Cross': 'MACD crossing signal line indicates a momentum shift.',
                                          'Oversold Bounce': 'Extreme oversold conditions with early reversal signs.',
                                          'Volume Climax': 'Extreme volume spike may indicate capitulation and reversal.',
                                        };
                                        if (setupReasons[setup.type]) reasons.push(setupReasons[setup.type]);
                                      }
                                      
                                      if (result.tradeSetup?.riskReward >= 2) {
                                        reasons.push(`Risk/reward of 1:${result.tradeSetup.riskReward} provides favorable asymmetry.`);
                                      }
                                      
                                      return reasons.length > 0 
                                        ? reasons.slice(0, 3).join(' ') 
                                        : 'Multiple technical factors align for this trade setup.';
                                    })()}
                                  </div>
                                  
                                  {/* Setup Tags - subtle */}
                                  {result.allSetups && result.allSetups.length > 0 && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                                      {result.allSetups.slice(0, 3).map((setup, idx) => (
                                        <span key={idx} style={{
                                          fontSize: '11px',
                                          color: '#666',
                                          padding: '3px 0',
                                          borderBottom: '1px dashed #333',
                                        }}>
                                          {setup.type}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Technical Details - compact list */}
                                <div>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    color: '#555', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.5px',
                                    marginBottom: '12px',
                                    fontWeight: 500,
                                  }}>
                                    Indicators
                                  </div>
                                  <div style={{ fontSize: '13px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a' }}>
                                      <span style={{ color: '#666' }}>RSI</span>
                                      <span style={{ color: parseFloat(result.rsi) > 70 ? '#EF4444' : parseFloat(result.rsi) < 30 ? '#22C55E' : '#fff' }}>
                                        {result.rsi}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a' }}>
                                      <span style={{ color: '#666' }}>MACD</span>
                                      <span style={{ color: parseFloat(result.macd) > 0 ? '#22C55E' : '#EF4444' }}>
                                        {result.macd}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a' }}>
                                      <span style={{ color: '#666' }}>Volume</span>
                                      <span style={{ color: '#fff' }}>{result.volumeRatio}x</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                                      <span style={{ color: '#666' }}>Size (2% risk)</span>
                                      <span style={{ color: '#888' }}>{result.tradeSetup?.positionSize?.medium} shares</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* ===== ACTIONS ===== */}
                              <div style={{ 
                                display: 'flex', 
                                gap: '12px', 
                                marginTop: '28px',
                                paddingTop: '20px',
                                borderTop: '1px solid #1a1a1a',
                              }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); runDeepDive(result); }}
                                  style={{
                                    padding: '10px 20px',
                                    background: '#3B82F6',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                >
                                  <Zap size={14} />
                                  AI Deep Dive
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onSelectStock(result.symbol); }}
                                  style={{
                                    padding: '10px 20px',
                                    background: 'transparent',
                                    border: '1px solid #333',
                                    borderRadius: '6px',
                                    color: '#999',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                >
                                  <BarChart2 size={14} />
                                  Chart
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onAddToPositions(result.symbol); }}
                                  style={{
                                    padding: '10px 20px',
                                    background: 'transparent',
                                    border: `1px solid ${favorites.includes(result.symbol) ? '#22C55E' : '#333'}`,
                                    borderRadius: '6px',
                                    color: favorites.includes(result.symbol) ? '#22C55E' : '#999',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                >
                                  <Star size={14} fill={favorites.includes(result.symbol) ? '#22C55E' : 'none'} />
                                  {favorites.includes(result.symbol) ? 'Watching' : 'Watch'}
                                </button>
                              </div>
                              
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================

export default function StockAnalyzer() {
  const [ticker, setTicker] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('');
  const [timeRange, setTimeRange] = useState('1M');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(''); // What's currently being loaded
  const [loadError, setLoadError] = useState(null); // Error message if loading failed
  const [chartData, setChartData] = useState(() => generateSampleData(30, '1M'));
  const [quoteData, setQuoteData] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [meta, setMeta] = useState({ symbol: 'AAPL', exchange: 'NASDAQ', currency: 'USD' });
  const [previousClose, setPreviousClose] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null); // Separate state for current price
  const [companyName, setCompanyName] = useState(''); // Company name from profile
  const [showLoadingFeedback, setShowLoadingFeedback] = useState(false); // Only show after 5 seconds
  const [lastUpdated, setLastUpdated] = useState(null); // Timestamp of last successful data fetch
  const [dataSource, setDataSource] = useState(''); // Which API provided the data
  const loadingTimerRef = useRef(null);
  const prevTickerRef = useRef(ticker); // Track previous ticker to detect ticker vs timeframe changes
  const chartRef = useRef(null); // Reference for chart export
  
  // Screen navigation state
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // 'dashboard', 'positions', or 'discover'
  
  // Favorites state
  const [favorites, setFavorites] = useState(() => getStoredFavorites());
  
  // API Settings state
  const [apiKeys, setApiKeys] = useState(() => getStoredApiKeys());
  const [showApiSettings, setShowApiSettings] = useState(false);
  
  // News state
  const [news, setNews] = useState(sampleNews);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsLive, setNewsLive] = useState(false);
  
  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isAIPowered, setIsAIPowered] = useState(false);
  const [showAIOverlay, setShowAIOverlay] = useState(false);
  const [showSRLevels, setShowSRLevels] = useState(false); // S/R hidden by default (like SMA)
  const [showSMAs, setShowSMAs] = useState(false); // SMAs hidden by default
  const [showBB, setShowBB] = useState(false); // Bollinger Bands
  const [showRSI, setShowRSI] = useState(false); // RSI panel
  const [showMACD, setShowMACD] = useState(false); // MACD panel
  const [showVolume, setShowVolume] = useState(true); // Volume bars (default on)
  
  // Global AI Chat state (shared across all screens)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState(() => getStoredChatHistory());
  const [chatLoading, setChatLoading] = useState(false);
  const [discoverScanResults, setDiscoverScanResults] = useState([]); // For chat context
  const [discoverFilters, setDiscoverFilters] = useState(null); // For chat context
  
  // Check if current ticker is favorited
  const isFavorited = favorites.includes(ticker);
  
  // Toggle favorite status
  const toggleFavorite = useCallback(() => {
    let newFavorites;
    if (isFavorited) {
      newFavorites = favorites.filter(f => f !== ticker);
    } else {
      if (favorites.length >= MAX_FAVORITES) {
        alert(`Maximum of ${MAX_FAVORITES} positions allowed. Remove one to add more.`);
        return;
      }
      newFavorites = [...favorites, ticker];
    }
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  }, [favorites, ticker, isFavorited]);

  const timeRanges = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
  const candleCountMap = { '1D': 78, '1W': 130, '1M': 168, '3M': 63, '1Y': 252, 'ALL': 120 };

  // Load data - fetches chart data per timeframe (cached), news/AI only on ticker change
  const loadData = useCallback(async (symbol, range, overrideApiKeys = null, isTickerChange = true) => {
    // Use override keys if provided (e.g., when saving new API keys), otherwise use state
    const keysToUse = overrideApiKeys || apiKeys;
    
    console.log(`\n========== Loading data for ${symbol}, timeframe: ${range}${!isTickerChange ? ' (timeframe change only)' : ''} ==========`);
    
    setIsLoading(true);
    setLoadError(null);
    setLoadingStatus('');
    setShowLoadingFeedback(false);
    
    // Only set news/AI loading if this is a ticker change
    if (isTickerChange) {
      setAiLoading(true);
      setNewsLoading(true);
    }
    setShowAIOverlay(false);
    
    // Start 5-second timer to show loading feedback
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    loadingTimerRef.current = setTimeout(() => {
      setShowLoadingFeedback(true);
      setLoadingStatus('Still loading data... This may take a moment.');
    }, 5000);
    
    try {
      // On ticker change: fetch price, profile, and quote data
      // On timeframe change: only fetch chart data (price/profile/quote don't change)
      let fetchedCurrentPrice = currentPrice;
      let fetchedPreviousClose = previousClose;
      let profileResult = null;
      let currentQuoteData = quoteData;
      
      if (isTickerChange) {
        console.log('Step 1: Fetching current price and company profile...');
        const [priceResult, profile] = await Promise.all([
          fetchCurrentPrice(symbol, keysToUse),
          fetchCompanyProfile(symbol, keysToUse.finnhub)
        ]);
        
        profileResult = profile;
        
        if (priceResult.success) {
          fetchedCurrentPrice = priceResult.currentPrice;
          fetchedPreviousClose = priceResult.previousClose;
          console.log(`Current price for ${symbol}: $${fetchedCurrentPrice}, Prev close: $${fetchedPreviousClose}`);
          setCurrentPrice(fetchedCurrentPrice);
          setPreviousClose(fetchedPreviousClose);
        }
        
        // Set company name from profile
        if (profileResult?.name) {
          setCompanyName(profileResult.name);
          console.log(`Company name: ${profileResult.name}`);
        } else {
          setCompanyName('');
        }
        
        // Fetch quote data on ticker change
        const quoteResult = await fetchQuoteDataWithFallback(symbol, keysToUse);
        if (quoteResult.success) {
          currentQuoteData = quoteResult.data;
          console.log('[QuoteData] Setting quote data');
          setQuoteData(currentQuoteData);
        } else {
          console.log('[QuoteData] Quote fetch failed, setting null');
          setQuoteData(null);
          currentQuoteData = null;
        }
      }
      
      // Fetch chart data (uses global cache - stockDataCache)
      console.log(`Step 2: Fetching chart data for ${range}...`);
      const chartResult = await fetchStockData(symbol, range, keysToUse);

      let currentChartData;
      
      if (chartResult.success && chartResult.chartData.length > 0) {
        currentChartData = chartResult.chartData;
        console.log(`Chart data received: ${currentChartData.length} candles`);
        console.log(`Chart range: ${currentChartData[0]?.fullDate || currentChartData[0]?.date} to ${currentChartData[currentChartData.length-1]?.fullDate || currentChartData[currentChartData.length-1]?.date}`);
        
        setChartData(currentChartData);
        setMeta({ ...chartResult.meta, symbol });
        setLastUpdated(new Date());
        setDataSource(chartResult.source || 'API');
        
        // Only use chart's last close if we couldn't get current price from quote API
        if (fetchedCurrentPrice === null) {
          const lastClose = currentChartData[currentChartData.length - 1]?.close;
          console.log(`No quote price available, using chart last close: $${lastClose}`);
          setCurrentPrice(lastClose);
        }
        
        setIsLive(true);
      } else {
        console.log('Chart data failed, using sample data');
        setLoadError(`Could not load ${range} data for ${symbol}. Showing sample data.`);
        currentChartData = generateSampleData(candleCountMap[range], range);
        setChartData(currentChartData);
        setLastUpdated(null);
        setDataSource('Sample');
        if (fetchedCurrentPrice === null) {
          setCurrentPrice(currentChartData[currentChartData.length - 1]?.close || null);
        }
        setIsLive(false);
      }
      
      // Clear the timer and hide feedback - data loaded successfully
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setShowLoadingFeedback(false);
      setLoadingStatus('');
      setIsLoading(false);
    
      // Only fetch news and AI if this is a ticker change
      if (isTickerChange) {
        // Fetch news
        console.log('Step 3: Fetching news...');
        const companyNameForNews = profileResult?.name || currentQuoteData?.shortName || symbol;
        const newsResult = await fetchNews(symbol, companyNameForNews, keysToUse);
        if (newsResult.success && newsResult.news.length > 0) {
          setNews(newsResult.news);
          setNewsLive(true);
        } else {
          setNews(sampleNews);
          setNewsLive(false);
        }
        setNewsLoading(false);
        
        // Fetch AI analysis
        console.log('Step 4: Fetching AI analysis...');
        const aiResult = await fetchAIAnalysis(symbol, currentChartData, currentQuoteData, companyNameForNews, keysToUse.claude);
        setAiAnalysis(aiResult.analysis);
        setIsAIPowered(aiResult.success);
        setAiLoading(false);
      }
      
      console.log(`========== Done loading ${symbol} ==========\n`);
      
    } catch (error) {
      console.error('Error loading data:', error);
      // Clear timer on error too
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setShowLoadingFeedback(false);
      setLoadError(`Failed to load data for ${symbol}. Please check your API keys and try again.`);
      setLoadingStatus('');
      setIsLoading(false);
      if (isTickerChange) {
        setAiLoading(false);
        setNewsLoading(false);
      }
    }
  }, [apiKeys, currentPrice, previousClose, quoteData]);

  // Handle selecting a ticker from My Positions
  const handleSelectFromPositions = useCallback((symbol) => {
    setCurrentScreen('dashboard');
    if (symbol !== ticker) {
      // Different ticker - this will trigger useEffect to reload
      setTicker(symbol);
    } else {
      // Same ticker - manually trigger a refresh
      // Clear global cache for this symbol to force fresh data
      stockDataCache.forEach((_, key) => {
        if (key.startsWith(`${symbol}_`)) {
          stockDataCache.delete(key);
        }
      });
      loadData(symbol, timeRange, null, true); // true = isTickerChange (force full refetch)
    }
  }, [ticker, timeRange, loadData]);

  // Reset all data when ticker changes to prevent stale data
  const handleTickerChange = useCallback((newTicker) => {
    // Clear all state immediately when ticker changes
    setCurrentPrice(null);
    setPreviousClose(null);
    setChartData([]);
    setQuoteData(null);
    setCompanyName('');
    setNews(sampleNews);
    setAiAnalysis(null);
    setShowAIOverlay(false);
    setTicker(newTicker);
  }, []); // No dependencies needed - only uses setters which are stable

  // Load data when ticker or timeRange changes
  // On ticker change: fetch both datasets
  // On timeframe change only: derive from cached datasets (instant)
  useEffect(() => {
    const isTickerChange = ticker !== prevTickerRef.current;
    prevTickerRef.current = ticker;
    
    loadData(ticker, timeRange, null, isTickerChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, timeRange]);
  
  // Handle API keys save
  const handleSaveApiKeys = (newKeys) => {
    setApiKeys(newKeys);
    saveApiKeys(newKeys);
    // Clear global cache since new API keys might provide different data
    stockDataCache.clear();
    // Reload data with new keys - pass newKeys directly since setApiKeys is async
    loadData(ticker, timeRange, newKeys, true); // true = full refetch
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      // Switch to dashboard view and set 1M timeframe when searching
      setCurrentScreen('dashboard');
      setTimeRange('1M');
      handleTickerChange(searchInput.toUpperCase().trim());
      setSearchInput('');
    }
  };

  // Export: Copy summary to clipboard
  const handleCopyToClipboard = async () => {
    const summary = generateTextSummary(
      ticker, companyName, currentPrice, previousClose, 
      timeRange, chartData, quoteData, aiAnalysis, isAIPowered
    );
    try {
      await navigator.clipboard.writeText(summary);
      alert('Summary copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = summary;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Summary copied to clipboard!');
    }
  };

  // Export: Generate and download PDF report
  const handleExportPDF = () => {
    const htmlContent = generateHTMLReport(
      ticker, companyName, currentPrice, previousClose,
      timeRange, chartData, quoteData, aiAnalysis, news, isAIPowered
    );
    
    // Create a new window and print to PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Give it a moment to render, then trigger print dialog
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Export: Download chart data as CSV
  const handleExportCSV = () => {
    if (!chartData || chartData.length === 0) {
      alert('No chart data to export');
      return;
    }
    
    const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'];
    const rows = chartData.map(d => [
      d.fullDate || d.date,
      d.open,
      d.high,
      d.low,
      d.close,
      d.volume
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ticker}-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Format last updated time
  const formatLastUpdated = (date) => {
    if (!date) return null;
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
      color: '#fff',
      overflowX: 'hidden', // Prevent horizontal scrolling
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { overflow-x: hidden; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        /* Mobile responsive styles */
        @media (max-width: 1024px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .sidebar { display: none !important; }
        }
        @media (max-width: 768px) {
          .header-search { display: none !important; }
          .header-nav { gap: 8px !important; }
          .export-buttons { display: none !important; }
          .chart-header { flex-wrap: wrap; gap: 8px !important; }
          .timerange-buttons { flex-wrap: wrap; }
        }
        @media (max-width: 480px) {
          .price-summary { padding: 12px !important; }
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <header style={{
        background: '#0d0d0d',
        borderBottom: '1px solid #1e1e1e',
        padding: '0 24px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 200, // Higher than chat drawer
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={14} color="#0a0a0a" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>STOCKSCOPE</span>
          </div>

          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#777' }} />
            <input
              type="text"
              placeholder="Symbol..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              style={{
                width: '140px',
                padding: '6px 10px 6px 30px',
                background: '#151515',
                border: '1px solid #252525',
                color: '#fff',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                outline: 'none',
              }}
            />
          </form>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setCurrentScreen('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: currentScreen === 'dashboard' ? '#252525' : 'transparent',
                border: '1px solid',
                borderColor: currentScreen === 'dashboard' ? '#3ECF8E' : '#252525',
                color: currentScreen === 'dashboard' ? '#3ECF8E' : '#777',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <LayoutDashboard size={12} />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentScreen('positions')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: currentScreen === 'positions' ? '#252525' : 'transparent',
                border: '1px solid',
                borderColor: currentScreen === 'positions' ? '#3ECF8E' : '#252525',
                color: currentScreen === 'positions' ? '#3ECF8E' : '#777',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <List size={12} />
              My Positions
              {favorites.length > 0 && (
                <span style={{
                  background: '#3ECF8E',
                  color: '#000',
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '8px',
                  marginLeft: '2px',
                }}>
                  {favorites.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentScreen('discover')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: currentScreen === 'discover' ? '#252525' : 'transparent',
                border: '1px solid',
                borderColor: currentScreen === 'discover' ? '#3B82F6' : '#252525',
                color: currentScreen === 'discover' ? '#3B82F6' : '#777',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Zap size={12} />
              AI Discover
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Settings Button */}
          <button
            onClick={() => setShowApiSettings(true)}
            style={{
              padding: '4px 10px',
              background: 'transparent',
              border: '1px solid #252525',
              color: '#777',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
            }}
          >
            <Settings size={10} />
            API Keys
          </button>
          
          <button
            onClick={() => loadData(ticker, timeRange)}
            style={{
              padding: '4px 10px',
              background: 'transparent',
              border: '1px solid #252525',
              color: '#777',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
            }}
          >
            <RefreshCw size={10} style={isLoading ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh
          </button>
          <div style={{
            fontSize: '10px',
            color: '#777',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '4px 8px',
            background: '#151515',
            border: '1px solid #252525',
          }}>
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ET
          </div>
        </div>
      </header>

      {/* Loading/Error Status Bar - Only shows after 5 seconds of loading OR on error */}
      {(loadError || (showLoadingFeedback && isLoading)) && currentScreen === 'dashboard' && (
        <div style={{
          background: loadError ? 'rgba(247, 85, 85, 0.1)' : 'rgba(62, 207, 142, 0.1)',
          borderBottom: `1px solid ${loadError ? 'rgba(247, 85, 85, 0.3)' : 'rgba(62, 207, 142, 0.3)'}`,
          padding: '8px 24px',
          marginRight: chatOpen ? '320px' : '48px', // Account for chat drawer
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          transition: 'margin-right 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            {!loadError && (
              <RefreshCw size={14} style={{ color: '#3ECF8E', animation: 'spin 1s linear infinite' }} />
            )}
            {loadError && (
              <AlertCircle size={14} style={{ color: '#F75555', flexShrink: 0 }} />
            )}
            <span style={{ 
              fontSize: '11px', 
              color: loadError ? '#F75555' : '#3ECF8E',
              fontWeight: 500,
            }}>
              {loadError || loadingStatus || 'Still loading data... This may take a moment.'}
            </span>
            {/* Show API key hint if no keys configured */}
            {loadError && !apiKeys.finnhub && !apiKeys.polygon && !apiKeys.alphaVantage && (
              <span style={{ fontSize: '10px', color: '#999', marginLeft: '8px' }}>
                💡 Tip: Add API keys in Settings for reliable data
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {loadError && !apiKeys.finnhub && (
              <button
                onClick={() => setShowApiSettings(true)}
                style={{
                  padding: '4px 12px',
                  background: 'rgba(245, 165, 36, 0.2)',
                  border: '1px solid rgba(245, 165, 36, 0.3)',
                  color: '#F5A524',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Settings size={10} />
                Add API Keys
              </button>
            )}
            {loadError && (
              <button
                onClick={() => { setLoadError(null); loadData(ticker, timeRange, null, true); }}
                style={{
                  padding: '4px 12px',
                  background: 'rgba(247, 85, 85, 0.2)',
                  border: '1px solid rgba(247, 85, 85, 0.3)',
                  color: '#F75555',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RefreshCw size={10} />
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Conditional rendering: Dashboard, My Positions, or AI Discover */}
      {currentScreen === 'positions' ? (
        <div style={{ 
          marginRight: chatOpen ? '320px' : '48px',
          transition: 'margin-right 0.2s ease',
        }}>
          <MyPositionsScreen
            favorites={favorites}
            setFavorites={setFavorites}
            onSelectTicker={handleSelectFromPositions}
            apiKeys={apiKeys}
            fetchStockDataFn={fetchStockData}
            fetchCompanyProfileFn={fetchCompanyProfile}
            calculateSRFn={calculateSupportResistance}
          />
        </div>
      ) : currentScreen === 'discover' ? (
        <div style={{ 
          height: 'calc(100vh - 48px)', 
          overflow: 'hidden',
          background: '#0a0a0a',
          marginRight: chatOpen ? '320px' : '48px', // Make room for chat drawer
          transition: 'margin-right 0.2s ease',
        }}>
          <DiscoverView
            apiKeys={apiKeys}
            favorites={favorites}
            onSelectStock={(symbol) => {
              setTicker(symbol);
              setSearchInput(symbol);
              setCurrentScreen('dashboard');
              loadData(symbol, timeRange, apiKeys, true);
            }}
            onAddToPositions={(symbol) => {
              if (!favorites.includes(symbol)) {
                if (favorites.length >= MAX_FAVORITES) {
                  alert(`Maximum of ${MAX_FAVORITES} positions allowed.`);
                  return;
                }
                const newFavorites = [...favorites, symbol];
                setFavorites(newFavorites);
                saveFavorites(newFavorites);
              }
            }}
            // Chat props
            chatOpen={chatOpen}
            setChatOpen={setChatOpen}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            chatLoading={chatLoading}
            setChatLoading={setChatLoading}
            onScanResultsChange={setDiscoverScanResults}
            onFiltersChange={setDiscoverFilters}
          />
        </div>
      ) : (
      <main className="main-grid" style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: '1px',
        background: '#1e1e1e',
        height: (loadError || (showLoadingFeedback && isLoading)) ? 'calc(100vh - 48px - 37px)' : 'calc(100vh - 48px)',
        overflow: 'hidden',
        marginRight: chatOpen ? '320px' : '48px', // Make room for chat drawer
        transition: 'margin-right 0.2s ease',
      }}>
        {/* Left Sidebar - Independently scrollable */}
        <div className="sidebar" style={{ 
          background: '#0a0a0a', 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}>
          {/* Left panel header - fixed at top */}
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid #1e1e1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '41px',
            boxSizing: 'border-box',
            flexShrink: 0,
            gap: '8px',
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              minWidth: 0,
              flex: 1,
              overflow: 'hidden',
            }}>
              {/* Favorite star button */}
              <QuickTooltip text={isFavorited ? 'Remove from My Positions' : 'Add to My Positions'}>
                <button
                  onClick={toggleFavorite}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Star 
                    size={16} 
                    fill={isFavorited ? '#F5A524' : 'transparent'}
                    style={{ 
                      color: isFavorited ? '#F5A524' : '#777',
                      transition: 'all 0.15s',
                    }} 
                  />
                </button>
              </QuickTooltip>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 700, 
                color: '#fff', 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {ticker}{companyName ? ` - ${companyName}` : ''}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 6px',
              background: isLive ? 'rgba(62, 207, 142, 0.1)' : 'rgba(85, 85, 85, 0.2)',
              flexShrink: 0,
            }}>
              {isLive ? <Wifi size={8} style={{ color: '#3ECF8E' }} /> : <WifiOff size={8} style={{ color: '#777' }} />}
              <span style={{ fontSize: '8px', fontWeight: 600, color: isLive ? '#3ECF8E' : '#777', letterSpacing: '0.3px' }}>
                {isLive ? 'LIVE' : 'SAMPLE'}
              </span>
            </div>
          </div>
          {/* Scrollable content area */}
          <div style={{ 
            flex: 1, 
            padding: '12px', 
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,  /* Important for flex children to respect overflow */
          }}>
            <PriceSummaryPanel ticker={ticker} chartData={chartData} previousClose={previousClose} currentPrice={currentPrice} timeRange={timeRange} />
            <AIAnalysis analysis={aiAnalysis} isLoading={aiLoading} isAIPowered={isAIPowered} />
            <MetricsPanel quoteData={quoteData} />
            <TechnicalsPanel chartData={chartData} />
          </div>
        </div>

        {/* Right Section - Chart + News */}
        <div style={{ 
          background: '#0a0a0a', 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          {/* Chart Header */}
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid #1e1e1e',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: '41px',
            boxSizing: 'border-box',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '11px', color: '#777' }}>
                <span style={{ color: '#999', fontWeight: 500 }}>{meta.symbol || ticker}</span>
                <span style={{ margin: '0 6px' }}>•</span>
                <span>{meta.exchange || 'NASDAQ'}</span>
                <span style={{ margin: '0 6px' }}>•</span>
                <span>{meta.currency || 'USD'}</span>
              </div>
              {/* S/R Levels Toggle */}
              <QuickTooltip text={showSRLevels ? 'Hide support/resistance levels' : 'Show support/resistance levels'}>
                <button
                  onClick={() => setShowSRLevels(!showSRLevels)}
                  disabled={chartData.length < 10}
                  style={{
                    padding: '3px 8px',
                    background: showSRLevels ? 'rgba(62, 207, 142, 0.1)' : 'transparent',
                    border: `1px solid ${showSRLevels ? '#3ECF8E' : '#333'}`,
                    color: showSRLevels ? '#3ECF8E' : '#777',
                    fontSize: '9px',
                    fontWeight: 600,
                    cursor: chartData.length < 10 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: chartData.length < 10 ? 0.4 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <TrendingUp size={10} />
                  S/R
                </button>
              </QuickTooltip>
              {/* SMA Toggle */}
              <QuickTooltip text={showSMAs ? 'Hide moving averages (20, 50, 200)' : 'Show moving averages (20, 50, 200)'}>
                <button
                  onClick={() => setShowSMAs(!showSMAs)}
                  disabled={chartData.length < 20}
                  style={{
                    padding: '3px 8px',
                    background: showSMAs ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    border: `1px solid ${showSMAs ? '#3B82F6' : '#333'}`,
                    color: showSMAs ? '#3B82F6' : '#777',
                    fontSize: '9px',
                    fontWeight: 600,
                    cursor: chartData.length < 20 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: chartData.length < 20 ? 0.4 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <BarChart2 size={10} />
                  SMA
                </button>
              </QuickTooltip>
              {/* Bollinger Bands Toggle */}
              <QuickTooltip text={showBB ? 'Hide Bollinger Bands' : 'Show Bollinger Bands (20, 2)'}>
                <button
                  onClick={() => setShowBB(!showBB)}
                  disabled={chartData.length < 20}
                  style={{
                    padding: '3px 8px',
                    background: showBB ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                    border: `1px solid ${showBB ? '#8B5CF6' : '#333'}`,
                    color: showBB ? '#8B5CF6' : '#777',
                    fontSize: '9px',
                    fontWeight: 600,
                    cursor: chartData.length < 20 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: chartData.length < 20 ? 0.4 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  BB
                </button>
              </QuickTooltip>
              {/* RSI Toggle */}
              <QuickTooltip text={showRSI ? 'Hide RSI panel' : 'Show RSI (14)'}>
                <button
                  onClick={() => setShowRSI(!showRSI)}
                  disabled={chartData.length < 15}
                  style={{
                    padding: '3px 8px',
                    background: showRSI ? 'rgba(245, 165, 36, 0.1)' : 'transparent',
                    border: `1px solid ${showRSI ? '#F5A524' : '#333'}`,
                    color: showRSI ? '#F5A524' : '#777',
                    fontSize: '9px',
                    fontWeight: 600,
                    cursor: chartData.length < 15 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: chartData.length < 15 ? 0.4 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  RSI
                </button>
              </QuickTooltip>
              {/* MACD Toggle */}
              <QuickTooltip text={showMACD ? 'Hide MACD panel' : 'Show MACD (12, 26, 9)'}>
                <button
                  onClick={() => setShowMACD(!showMACD)}
                  disabled={chartData.length < 35}
                  style={{
                    padding: '3px 8px',
                    background: showMACD ? 'rgba(62, 207, 142, 0.1)' : 'transparent',
                    border: `1px solid ${showMACD ? '#3ECF8E' : '#333'}`,
                    color: showMACD ? '#3ECF8E' : '#777',
                    fontSize: '9px',
                    fontWeight: 600,
                    cursor: chartData.length < 35 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: chartData.length < 35 ? 0.4 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  MACD
                </button>
              </QuickTooltip>
              {/* Volume Toggle */}
              <QuickTooltip text={showVolume ? 'Hide volume bars' : 'Show volume bars'}>
                <button
                  onClick={() => setShowVolume(!showVolume)}
                  style={{
                    padding: '3px 8px',
                    background: showVolume ? 'rgba(107, 114, 128, 0.2)' : 'transparent',
                    border: `1px solid ${showVolume ? '#6B7280' : '#333'}`,
                    color: showVolume ? '#9CA3AF' : '#777',
                    fontSize: '9px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  VOL
                </button>
              </QuickTooltip>
              {/* AI Overlay Toggle */}
              <QuickTooltip text={showAIOverlay ? 'Hide AI pattern overlay' : 'Show AI pattern overlay'}>
                <button
                  onClick={() => setShowAIOverlay(!showAIOverlay)}
                  disabled={aiLoading || !aiAnalysis?.priceStructure}
                  style={{
                    padding: '3px 8px',
                    background: showAIOverlay ? 'rgba(245, 165, 36, 0.15)' : 'transparent',
                    border: `1px solid ${showAIOverlay ? '#F5A524' : '#333'}`,
                    color: showAIOverlay ? '#F5A524' : '#777',
                    fontSize: '9px',
                    fontWeight: 600,
                    cursor: (aiLoading || !aiAnalysis?.priceStructure) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: (aiLoading || !aiAnalysis?.priceStructure) ? 0.4 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {aiLoading ? (
                    <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Cpu size={10} />
                  )}
                  {aiLoading ? 'ANALYZING...' : 'PATTERN'}
                </button>
              </QuickTooltip>
            </div>
            <div style={{ display: 'flex', gap: '2px' }}>
              {timeRanges.map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  style={{
                    padding: '4px 10px',
                    background: timeRange === range ? '#252525' : 'transparent',
                    border: 'none',
                    color: timeRange === range ? '#fff' : '#777',
                    fontSize: '10px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {range}
                </button>
              ))}
              
              {/* Separator */}
              <div style={{ width: '1px', background: '#333', margin: '0 8px' }} />
              
              {/* Export buttons */}
              <QuickTooltip text="Copy summary to clipboard">
                <button
                  onClick={handleCopyToClipboard}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#777',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Copy size={12} />
                </button>
              </QuickTooltip>
              <QuickTooltip text="Export chart data as CSV">
                <button
                  onClick={handleExportCSV}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#777',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FileDown size={12} />
                </button>
              </QuickTooltip>
              <QuickTooltip text="Export as PDF report">
                <button
                  onClick={handleExportPDF}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#777',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FileText size={12} />
                </button>
              </QuickTooltip>
              
              {/* Last Updated */}
              {lastUpdated && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  color: '#777',
                  fontSize: '9px',
                  marginLeft: '8px',
                }}>
                  <Clock size={10} />
                  {formatLastUpdated(lastUpdated)}
                  {dataSource && <span style={{ color: '#333' }}>({dataSource})</span>}
                </div>
              )}
            </div>
          </div>

          {/* Scrollable content area - Chart + News */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
          }}>
            {/* Chart */}
            <div style={{ 
              height: showRSI || showMACD ? '650px' : '500px', 
              padding: '16px 0 16px 16px',  /* No right padding - chart extends to edge */
              boxSizing: 'border-box',
              transition: 'height 0.3s ease',
            }}>
              <CandlestickChart 
                data={chartData} 
                showAIOverlay={showAIOverlay}
                showSRLevels={showSRLevels}
                showSMAs={showSMAs}
                showBB={showBB}
                showRSI={showRSI}
                showMACD={showMACD}
                showVolume={showVolume}
                priceStructure={aiAnalysis?.priceStructure}
                timeRange={timeRange}
              />
            </div>

            {/* News Section Below Chart */}
            <NewsFeed news={news} isLoading={newsLoading} isLive={newsLive} />
          </div>
        </div>
      </main>
      )}
      
      {/* Global AI Chat Drawer - available on all screens */}
      <ChatDrawer
        apiKeys={apiKeys}
        isOpen={chatOpen}
        setIsOpen={setChatOpen}
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        chatLoading={chatLoading}
        setChatLoading={setChatLoading}
        contextInfo={{
          screen: currentScreen === 'dashboard' ? 'Dashboard' : currentScreen === 'positions' ? 'My Positions' : 'AI Discover',
          ticker: ticker,
          positions: favorites,
          scanResults: discoverScanResults,
          filters: discoverFilters,
        }}
      />
      
      {/* API Settings Modal */}
      <APISettingsModal
        isOpen={showApiSettings}
        onClose={() => setShowApiSettings(false)}
        apiKeys={apiKeys}
        onSave={handleSaveApiKeys}
      />
    </div>
  );
}

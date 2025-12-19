import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, DollarSign, Bitcoin, ArrowUp, ArrowDown, Wallet, BarChart3, Star, Sparkles, Target, Zap, Lightbulb, Shield, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import AppleLogo from '@/assets/logos/apple.svg';
import GoogleLogo from '@/assets/logos/google.svg';
import MicrosoftLogo from '@/assets/logos/microsoft.svg';
import TeslaLogo from '@/assets/logos/tesla.svg';
import BitcoinLogo from '@/assets/logos/bitcoin.svg';
import EthereumLogo from '@/assets/logos/ethereum.svg';
import { useMarketData, Stock } from '@/hooks/useMarketData';
import { useCoinbase } from '@/hooks/useCoinbase';
import { useAlpacaMarket } from '@/hooks/useAlpacaMarket';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CoinbaseConnection } from './CoinbaseConnection';
import { StockTradingCard } from './StockTradingCard';
import { IllustratedStatCard } from './IllustratedStatCard';
import { AnimatedList } from './AnimatedList';
import { ParticleEffect } from './ParticleEffect';

export const MarketSimulator = () => {
  const { stocks, marketCash, buyStock, sellStock, portfolioValue, totalPortfolioValue, portfolioChange } = useMarketData();
  const { 
    isConnected: coinbaseConnected, 
    placeBuyOrder, 
    placeSellOrder, 
    tickers, 
    getUSDBalance,
    getCryptoBalance,
    error: coinbaseError 
  } = useCoinbase();
  const alpaca = useAlpacaMarket(true, 10000); // Enable auto-refresh every 10 seconds
  
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeAmount, setTradeAmount] = useState(1);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  // Check localStorage to see if tutorial was already dismissed
  const [showTutorial, setShowTutorial] = useState(() => {
    const dismissed = localStorage.getItem('marketSimulatorTutorialDismissed');
    return dismissed !== 'true';
  });
  const [bitcoinInvested, setBitcoinInvested] = useState(false);
  const [totalTrades, setTotalTrades] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  // Default to 'simulator' mode so stocks are always visible
  const [realTradingMode, setRealTradingMode] = useState<'simulator' | 'alpaca' | 'coinbase'>('simulator');
  const [tradingError, setTradingError] = useState<string | null>(null);
  const [alpacaStocks, setAlpacaStocks] = useState<Stock[]>([]);
  const [loadingAlpacaStocks, setLoadingAlpacaStocks] = useState(false);

  // Load Alpaca stocks when switching to paper trading mode
  useEffect(() => {
    if (realTradingMode === 'alpaca' && alpaca.isConnected) {
      loadAlpacaStocks();
    }
  }, [realTradingMode, alpaca.isConnected]);

  // Update alpaca stocks from cache when quotes change
  useEffect(() => {
    if (realTradingMode === 'alpaca' && alpaca.isConnected && Object.keys(alpaca.lastQuotes).length > 0) {
      const updatedStocks = alpaca.getStocksFromCache();
      setAlpacaStocks(updatedStocks);
    }
  }, [alpaca.lastQuotes, realTradingMode, alpaca.isConnected]);

  const loadAlpacaStocks = async () => {
    setLoadingAlpacaStocks(true);
    try {
      const stocks = await alpaca.getStocksWithQuotes();
      setAlpacaStocks(stocks);
    } catch (error) {
      console.error('Error loading Alpaca stocks:', error);
    } finally {
      setLoadingAlpacaStocks(false);
    }
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
    // Persist the dismissal in localStorage so it doesn't show again
    localStorage.setItem('marketSimulatorTutorialDismissed', 'true');
  };

  // Use stocks based on selected mode, fallback to simulator stocks if needed
  const displayStocks = (realTradingMode === 'alpaca' && alpaca.isConnected && alpacaStocks.length > 0) 
    ? alpacaStocks 
    : stocks; // Always use simulator stocks for 'simulator' mode or as fallback

  const handleTrade = async () => {
    if (!selectedStock || tradeAmount <= 0) return;

    setTradingError(null);

    if (realTradingMode === 'simulator') {
      // Simulator mode - use local market data
      const success = tradeType === 'buy' 
        ? buyStock(selectedStock.symbol, tradeAmount)
        : sellStock(selectedStock.symbol, tradeAmount);
      
      if (success) {
        setTotalTrades(prev => prev + 1);
        
        // Check if Bitcoin was invested
        if (selectedStock.symbol.includes('BTC') && tradeType === 'buy') {
          setBitcoinInvested(true);
        }
        
        // Show success message
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        setSelectedStock(null);
        setTradeAmount(1);
      } else {
        setTradingError(tradeType === 'buy' 
          ? 'Not enough cash to buy this stock' 
          : 'Not enough shares to sell');
      }
    } else if (realTradingMode === 'alpaca' && alpaca.isConnected) {
      // Real trading with Alpaca paper account
      try {
        const orderFunc = tradeType === 'buy' ? alpaca.buyStock : alpaca.sellStock;
        const order = await orderFunc(selectedStock.symbol, tradeAmount);

        if (order) {
          setTotalTrades(prev => prev + 1);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
          setSelectedStock(null);
          setTradeAmount(1);
        }
      } catch (error) {
        setTradingError(error instanceof Error ? error.message : 'Trading failed');
      }
    } else if (realTradingMode === 'coinbase' && coinbaseConnected) {
      // Real trading with Coinbase
      try {
        const productId = selectedStock.symbol.includes('BTC') ? 'BTC-USD' : 
                         selectedStock.symbol.includes('ETH') ? 'ETH-USD' : 
                         selectedStock.symbol.includes('ADA') ? 'ADA-USD' : 'BTC-USD';
        
        const size = tradeAmount.toString();
        const order = tradeType === 'buy' 
          ? await placeBuyOrder(productId, size)
          : await placeSellOrder(productId, size);

        if (order) {
          setTotalTrades(prev => prev + 1);
          
          // Check if Bitcoin was invested
          if (selectedStock.symbol.includes('BTC') && tradeType === 'buy') {
            setBitcoinInvested(true);
          }
          
          // Show success message
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
          
          setSelectedStock(null);
          setTradeAmount(1);
        }
      } catch (error) {
        setTradingError(error instanceof Error ? error.message : 'Trading failed');
      }
    }
  };

  const openTradeDialog = (stock: Stock, type: 'buy' | 'sell') => {
    setSelectedStock(stock);
    setTradeType(type);
    // Set default amount based on asset type
    const isBitcoin = stock.symbol.includes('BTC') || stock.symbol.includes('ETH');
    setTradeAmount(isBitcoin ? 0.0001 : 1);
  };

  const totalReturn = portfolioChange;
  const totalReturnPercent = portfolioValue > 0 ? (portfolioChange / (portfolioValue - portfolioChange)) * 100 : 0;

  // Function to get the appropriate logo for each stock
  const getStockLogo = (symbol: string) => {
    switch (symbol) {
      case 'AAPL':
        return AppleLogo;
      case 'GOOGL':
        return GoogleLogo;
      case 'MSFT':
        return MicrosoftLogo;
      case 'TSLA':
        return TeslaLogo;
      case 'BTC':
        return BitcoinLogo;
      case 'ETH':
        return EthereumLogo;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tutorial Modal */}
      {showTutorial && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Close tutorial when clicking outside the card
            if (e.target === e.currentTarget) {
              handleTutorialClose();
            }
          }}
        >
          <Card 
            className="w-full max-w-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2 text-gray-900 dark:text-white">
                🎮 Welcome to the Investment Adventure!
                <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold mb-2 text-lg text-gray-900 dark:text-white">What You'll Learn:</h3>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• How to buy and sell stocks and Bitcoin</li>
                  <li>• Why investments can grow over time</li>
                  <li>• How to build a diverse portfolio</li>
                  <li>• The basics of market investing</li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold mb-2 text-lg text-gray-900 dark:text-white">How to Play:</h3>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• Start with $10,000 virtual money</li>
                  <li>• Buy stocks and Bitcoin to build your portfolio</li>
                  <li>• Watch your investments grow (or shrink!)</li>
                  <li>• Learn about different types of investments</li>
                </ul>
              </div>
              <Button 
                onClick={handleTutorialClose} 
                className="w-full"
                type="button"
              >
                <Zap className="h-4 w-4 mr-2" />
                Start Investing Adventure!
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <>
          <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 animate-in slide-in-from-right">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Trade Successful!</span>
            </div>
          </div>
          <ParticleEffect type="coins" count={20} trigger={showSuccess} />
        </>
      )}

      {/* Last Updated Indicator */}
      {realTradingMode === 'alpaca' && alpaca.lastUpdated && (
        <div className="text-center mb-4">
          <Badge variant="outline" className="text-xs">
            Last Updated: {alpaca.lastUpdated.toLocaleTimeString()}
          </Badge>
        </div>
      )}

      {/* Trading Mode Toggle */}
      <div className="flex justify-center">
        <div className="bg-muted/50 rounded-lg p-1 flex gap-1">
          <Button
            variant={realTradingMode === 'simulator' ? "default" : "ghost"}
            size="sm"
            onClick={() => setRealTradingMode('simulator')}
            className="text-xs sm:text-sm"
          >
            <Zap className="h-4 w-4 mr-1" />
            Simulator
          </Button>
          <Button
            variant={realTradingMode === 'alpaca' ? "default" : "ghost"}
            size="sm"
            onClick={() => setRealTradingMode('alpaca')}
            disabled={!alpaca.isConnected}
            className="text-xs sm:text-sm"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Paper Trading
          </Button>
          <Button
            variant={realTradingMode === 'coinbase' ? "default" : "ghost"}
            size="sm"
            onClick={() => setRealTradingMode('coinbase')}
            disabled={!coinbaseConnected}
            className="text-xs sm:text-sm"
          >
            <Shield className="h-4 w-4 mr-1" />
            Crypto
          </Button>
        </div>
      </div>

      {/* Trading Mode Alert */}
      {realTradingMode === 'simulator' && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <Zap className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Simulator Mode:</strong> Practice trading with virtual money! 
            Start with $10,000 and learn how to invest in stocks and Bitcoin. Perfect for learning!
          </AlertDescription>
        </Alert>
      )}
      {realTradingMode === 'alpaca' && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <strong>Paper Trading Mode:</strong> Trading with Alpaca paper account. 
                Virtual money only - perfect for testing strategies!
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live Data - Updates every 10s
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {realTradingMode === 'coinbase' && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>Real Crypto Trading:</strong> You are trading real cryptocurrency through Coinbase. 
            All trades use your actual account balance.
          </AlertDescription>
        </Alert>
      )}

      {/* Trading Error Alert */}
      {tradingError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {tradingError}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="simulator" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 gap-1 h-auto p-1 bg-muted/50">
          <TabsTrigger value="simulator" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Simulator</span>
            <span className="sm:hidden">📊</span>
          </TabsTrigger>
          <TabsTrigger value="coinbase" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Coinbase</span>
            <span className="sm:hidden">🔒</span>
          </TabsTrigger>
          <TabsTrigger value="tutorial" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Tutorial</span>
            <span className="sm:hidden">💡</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulator" className="space-y-4 sm:space-y-6">
          {/* Portfolio Overview with Illustrated Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <IllustratedStatCard
              title="💰 Money to Spend"
              value={`$${realTradingMode === 'alpaca' && alpaca.isConnected ? alpaca.cash.toFixed(2) : marketCash.toFixed(2)}`}
              subtitle={realTradingMode === 'alpaca' && alpaca.isConnected ? 'Paper trading cash' : 'Virtual money to invest'}
              emoji="💵"
              illustration="coins"
            />

            <IllustratedStatCard
              title="💎 My Collection Value"
              value={`$${realTradingMode === 'alpaca' && alpaca.isConnected ? alpaca.portfolioValue.toFixed(2) : portfolioValue.toFixed(2)}`}
              subtitle="Stocks & crypto value"
              emoji="📊"
              illustration="treasure"
              trend="neutral"
            />

            <IllustratedStatCard
              title="🌱 How Much I Grew"
              value={`$${(realTradingMode === 'alpaca' && alpaca.isConnected ? alpaca.portfolioChange : totalReturn).toFixed(2)}`}
              subtitle={`${totalReturn >= 0 ? '+' : ''}${totalReturnPercent.toFixed(1)}%`}
              emoji="📈"
              illustration="growth"
              trend={totalReturn >= 0 ? 'up' : 'down'}
            />

            <IllustratedStatCard
              title="🏆 Everything I Have"
              value={`$${realTradingMode === 'alpaca' && alpaca.isConnected ? alpaca.totalPortfolioValue.toFixed(2) : totalPortfolioValue.toFixed(2)}`}
              subtitle="Cash + investments"
              emoji="👑"
              illustration="trophy"
            />
          </div>

      {/* Market Stocks - Trading Card Style */}
      <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                🎴 Investment Card Collection
                {bitcoinInvested && <Sparkles className="h-5 w-5 text-orange-500 animate-pulse" />}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Collect all the investment cards! Each card is unique! 🌟
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {displayStocks.filter(s => s.owned > 0).length}/{displayStocks.length} Collected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingAlpacaStocks ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your trading cards...</p>
              </div>
            </div>
          ) : (
            <AnimatedList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" staggerDelay={0.05}>
              {displayStocks.map((stock) => (
                <StockTradingCard
                  key={stock.symbol}
                  symbol={stock.symbol}
                  name={stock.name}
                  price={stock.price}
                  change={stock.change}
                  owned={stock.owned}
                  logo={getStockLogo(stock.symbol) || undefined}
                  onBuy={() => openTradeDialog(stock, 'buy')}
                  onSell={() => openTradeDialog(stock, 'sell')}
                  canSell={stock.owned > 0}
                />
              ))}
            </AnimatedList>
          )}
        </CardContent>
      </Card>

      {/* Trading Dialog */}
      <Dialog open={selectedStock !== null} onOpenChange={() => setSelectedStock(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {tradeType === 'buy' ? '🛒 Buy' : '💰 Sell'} {selectedStock?.symbol}
              {getStockLogo(selectedStock?.symbol || '') ? (
                <img 
                  src={getStockLogo(selectedStock?.symbol || '')} 
                  alt={`${selectedStock?.symbol} logo`}
                  className="h-5 w-5"
                />
              ) : selectedStock?.symbol.includes('BTC') && <Bitcoin className="h-5 w-5 text-orange-500" />}
            </DialogTitle>
            <DialogDescription className="text-base">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200">
                <div className="font-medium">Current price: ${selectedStock?.price.toFixed(2)} per share</div>
                {tradeType === 'sell' && selectedStock && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    You own: {selectedStock.owned.toFixed(4)} shares
                  </div>
                )}
                {selectedStock?.symbol.includes('BTC') && (
                  <div className="mt-2 text-sm text-orange-600 font-medium">
                    ₿ This is Bitcoin - digital money that works worldwide!
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          
          {selectedStock && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="shares" className="text-base font-medium">Number of shares</Label>
                <Input
                  id="shares"
                  type="number"
                  min={tradeType === 'buy' ? (selectedStock.symbol.includes('BTC') || selectedStock.symbol.includes('ETH') ? 0.0001 : 1) : 0}
                  max={tradeType === 'sell' ? selectedStock.owned : undefined}
                  step={selectedStock.symbol.includes('BTC') || selectedStock.symbol.includes('ETH') ? 0.0001 : 1}
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(parseFloat(e.target.value) || 0)}
                  className="text-lg p-3"
                />
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border border-green-200 mt-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total cost: ${(selectedStock.price * tradeAmount).toFixed(2)}</span>
                    {tradeType === 'buy' && (
                      <span>Max affordable: {((realTradingMode === 'alpaca' && alpaca.isConnected ? alpaca.cash : marketCash) / selectedStock.price).toFixed(4)}</span>
                    )}
                  </div>
                </div>
              </div>

              {tradeType === 'buy' && (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Quick Buy Options:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const availableCash = realTradingMode === 'alpaca' && alpaca.isConnected ? alpaca.cash : marketCash;
                        setTradeAmount(availableCash / selectedStock.price * 0.25);
                      }}
                      className="hover:bg-blue-50"
                    >
                      25%
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const availableCash = realTradingMode === 'alpaca' && alpaca.isConnected ? alpaca.cash : marketCash;
                        setTradeAmount(availableCash / selectedStock.price * 0.5);
                      }}
                      className="hover:bg-blue-50"
                    >
                      50%
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const availableCash = realTradingMode === 'alpaca' && alpaca.isConnected ? alpaca.cash : marketCash;
                        setTradeAmount(availableCash / selectedStock.price * 0.75);
                      }}
                      className="hover:bg-blue-50"
                    >
                      75%
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const availableCash = realTradingMode === 'alpaca' && alpaca.isConnected ? alpaca.cash : marketCash;
                        setTradeAmount(availableCash / selectedStock.price);
                      }}
                      className="hover:bg-blue-50"
                    >
                      Max
                    </Button>
                  </div>
                </div>
              )}

              {tradeType === 'sell' && (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Quick Sell Options:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setTradeAmount(selectedStock.owned * 0.25)}
                      className="hover:bg-red-50"
                    >
                      25%
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setTradeAmount(selectedStock.owned * 0.5)}
                      className="hover:bg-red-50"
                    >
                      50%
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setTradeAmount(selectedStock.owned * 0.75)}
                      className="hover:bg-red-50"
                    >
                      75%
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setTradeAmount(selectedStock.owned)}
                      className="hover:bg-red-50"
                    >
                      All
                    </Button>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleTrade} 
                className="w-full text-lg py-3"
                variant="default"
                disabled={
                  tradeAmount <= 0 || 
                  (tradeType === 'buy' && (realTradingMode === 'alpaca' && alpaca.isConnected ? alpaca.cash : marketCash) < selectedStock.price * tradeAmount) ||
                  (tradeType === 'sell' && selectedStock.owned < tradeAmount)
                }
              >
                {tradeType === 'buy' ? '🛒 Buy' : '💰 Sell'} {tradeAmount} shares for ${(selectedStock.price * tradeAmount).toFixed(2)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Educational Tips */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-lg text-yellow-800">Investment Tips for Young Investors:</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">💡 Smart Investing:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Start small and learn as you go</li>
                <li>• Don't put all your money in one place</li>
                <li>• Bitcoin is digital money for the future</li>
                <li>• Stocks represent ownership in companies</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">🎯 Investment Goals:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Long-term investing usually works better</li>
                <li>• Markets go up and down - that's normal!</li>
                <li>• Learn about what you're investing in</li>
                <li>• Practice with virtual money first</li>
              </ul>
            </div>
          </div>
          {bitcoinInvested && (
            <div className="mt-4 p-3 bg-orange-100 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 font-medium">
                ₿ Great job! You've invested in Bitcoin - the future of digital money!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="coinbase" className="space-y-4 sm:space-y-6">
          <CoinbaseConnection />
          
          {coinbaseConnected && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Real-Time Market Data
                  </CardTitle>
                  <CardDescription>
                    Live prices from Coinbase Exchange
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {Object.entries(tickers).map(([pair, ticker]) => (
                      <div key={pair} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <img 
                              src={BitcoinLogo} 
                              alt="Bitcoin logo"
                              className="h-5 w-5"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium">{pair}</h4>
                            <p className="text-sm text-muted-foreground">
                              Volume: ${parseFloat(ticker.volume).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            ${parseFloat(ticker.price).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Bid: ${parseFloat(ticker.bid).toFixed(2)} | Ask: ${parseFloat(ticker.ask).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    Account Balances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="font-medium">USD Balance</span>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        ${parseFloat(getUSDBalance()).toFixed(2)}
                      </Badge>
                    </div>
                    
                    {['BTC', 'ETH', 'ADA'].map(currency => {
                      const balance = getCryptoBalance(currency);
                      if (parseFloat(balance) > 0) {
                        return (
                            <div key={currency} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <img 
                                src={currency === 'BTC' ? BitcoinLogo : EthereumLogo} 
                                alt={`${currency} logo`}
                                className="h-5 w-5"
                              />
                              <span className="font-medium">{currency} Balance</span>
                            </div>
                            <Badge className="bg-orange-600 text-white">
                              {parseFloat(balance).toFixed(6)} {currency}
                            </Badge>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tutorial" className="space-y-4 sm:space-y-6">
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Investment Learning Center
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 bg-white/50 rounded-lg border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <img 
                      src={BitcoinLogo} 
                      alt="Bitcoin logo"
                      className="h-4 w-4"
                    />
                    What is Bitcoin?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Bitcoin is digital money that exists only online. It's like having money in a digital wallet 
                    that you can send to anyone in the world instantly!
                  </p>
                </div>
                
                <div className="p-4 bg-white/50 rounded-lg border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Why Do Prices Change?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Prices change based on supply and demand. When more people want to buy Bitcoin, 
                    the price goes up. When more people want to sell, the price goes down.
                  </p>
                </div>
                
                <div className="p-4 bg-white/50 rounded-lg border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Investment Tips
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Start small and learn as you go</li>
                    <li>• Don't invest more than you can afford to lose</li>
                    <li>• Diversify your investments</li>
                    <li>• Think long-term, not short-term</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
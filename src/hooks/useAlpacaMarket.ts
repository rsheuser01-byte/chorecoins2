import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AlpacaPosition {
  symbol: string;
  qty: number | string;
  avg_entry_price: number | string;
  current_price: number | string;
  market_value: number | string;
  unrealized_pl: number | string;
  unrealized_plpc: number | string;
}

export interface AlpacaStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  owned: number;
  avgPrice: number;
}

export const useAlpacaMarket = (enableAutoRefresh = false, refreshInterval = 10000) => {
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [accountData, setAccountData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastQuotes, setLastQuotes] = useState<Record<string, any>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Stock symbols we want to track
  const watchlistSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: connection } = await supabase
        .from('alpaca_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      setIsConnected(!!connection);
      if (connection) {
        setAccountData(connection);
      }
    } catch (error) {
      console.error('Error checking Alpaca connection:', error);
    }
  };

  const syncAccount = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('alpaca-sync-account');
      
      if (error) throw error;
      
      if (data?.connection) {
        setAccountData(data.connection);
        toast.success('Account synced successfully');
      }
    } catch (error) {
      console.error('Error syncing account:', error);
      toast.error('Failed to sync account');
    } finally {
      setLoading(false);
    }
  };

  const loadPositions = async () => {
    if (!isConnected) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('alpaca-get-positions');
      
      if (error) throw error;
      
      if (data?.positions) {
        setPositions(data.positions);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
      toast.error('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const getQuotes = async (symbols: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('alpaca-get-quotes', {
        body: { symbols }
      });
      
      if (error) throw error;
      const quotes = data?.quotes || {};
      setLastQuotes(quotes);
      setLastUpdated(new Date());
      return quotes;
    } catch (error) {
      console.error('Error getting quotes:', error);
      return lastQuotes; // Return cached quotes on error
    }
  };

  const refreshQuotes = async () => {
    if (!isConnected) return;
    await getQuotes(watchlistSymbols);
  };

  const placeOrder = async (symbol: string, qty: number, side: 'buy' | 'sell') => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('alpaca-place-order', {
        body: { symbol, qty, side }
      });
      
      if (error) throw error;
      
      if (data?.order) {
        toast.success(`Order placed: ${side.toUpperCase()} ${qty} ${symbol}`);
        // Refresh positions after order
        await loadPositions();
        await syncAccount();
        return data.order;
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const buyStock = async (symbol: string, shares: number) => {
    return placeOrder(symbol, shares, 'buy');
  };

  const sellStock = async (symbol: string, shares: number) => {
    return placeOrder(symbol, shares, 'sell');
  };

  const getStocksWithQuotes = async (): Promise<AlpacaStock[]> => {
    const quotes = await getQuotes(watchlistSymbols);
    
    return watchlistSymbols.map(symbol => {
      const quote = quotes[symbol];
      const position = positions.find(p => p.symbol === symbol);
      
      const unrealizedPlpc = position?.unrealized_plpc;
      const qty = position?.qty;
      const avgEntryPrice = position?.avg_entry_price;
      
      // Use midpoint between bid and ask for more accurate current price
      const bidPrice = quote?.bp || 0;
      const askPrice = quote?.ap || 0;
      const currentPrice = bidPrice && askPrice ? (bidPrice + askPrice) / 2 : (askPrice || bidPrice || 0);
      
      return {
        symbol,
        name: getStockName(symbol),
        price: currentPrice,
        change: typeof unrealizedPlpc === 'string' ? parseFloat(unrealizedPlpc) : (unrealizedPlpc || 0),
        owned: qty ? (typeof qty === 'string' ? parseFloat(qty) : qty) : 0,
        avgPrice: typeof avgEntryPrice === 'string' ? parseFloat(avgEntryPrice) : (avgEntryPrice || 0),
      };
    });
  };

  const getStocksFromCache = (): AlpacaStock[] => {
    return watchlistSymbols.map(symbol => {
      const quote = lastQuotes[symbol];
      const position = positions.find(p => p.symbol === symbol);
      
      const unrealizedPlpc = position?.unrealized_plpc;
      const qty = position?.qty;
      const avgEntryPrice = position?.avg_entry_price;
      
      // Use midpoint between bid and ask for more accurate current price
      const bidPrice = quote?.bp || 0;
      const askPrice = quote?.ap || 0;
      const currentPrice = bidPrice && askPrice ? (bidPrice + askPrice) / 2 : (askPrice || bidPrice || 0);
      
      return {
        symbol,
        name: getStockName(symbol),
        price: currentPrice,
        change: typeof unrealizedPlpc === 'string' ? parseFloat(unrealizedPlpc) : (unrealizedPlpc || 0),
        owned: qty ? (typeof qty === 'string' ? parseFloat(qty) : qty) : 0,
        avgPrice: typeof avgEntryPrice === 'string' ? parseFloat(avgEntryPrice) : (avgEntryPrice || 0),
      };
    });
  };

  const getStockName = (symbol: string) => {
    const names: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corp.',
      'TSLA': 'Tesla Inc.',
    };
    return names[symbol] || symbol;
  };

  const portfolioValue = positions.reduce((sum, pos) => 
    sum + (typeof pos.market_value === 'string' ? parseFloat(pos.market_value) : pos.market_value), 0
  );

  const portfolioChange = positions.reduce((sum, pos) => 
    sum + (typeof pos.unrealized_pl === 'string' ? parseFloat(pos.unrealized_pl) : pos.unrealized_pl), 0
  );

  const cash = accountData?.cash || 0;
  const buyingPower = accountData?.buying_power || 0;
  const totalPortfolioValue = accountData?.portfolio_value || 0;

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (isConnected) {
      loadPositions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Auto-refresh quotes at specified interval
  useEffect(() => {
    if (!enableAutoRefresh || !isConnected) return;

    const interval = setInterval(() => {
      refreshQuotes();
    }, refreshInterval);

    // Initial fetch
    refreshQuotes();

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableAutoRefresh, isConnected, refreshInterval]);

  return {
    isConnected,
    positions,
    accountData,
    loading,
    cash,
    buyingPower,
    portfolioValue,
    totalPortfolioValue,
    portfolioChange,
    lastQuotes,
    lastUpdated,
    checkConnection,
    syncAccount,
    loadPositions,
    getQuotes,
    refreshQuotes,
    buyStock,
    sellStock,
    getStocksWithQuotes,
    getStocksFromCache,
  };
};

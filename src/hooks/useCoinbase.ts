import { useState, useEffect, useCallback } from 'react';
import { 
  CoinbaseAPI, 
  CoinbaseAccount, 
  CoinbaseProduct, 
  CoinbaseOrder, 
  CoinbaseTicker,
  initializeCoinbaseAPI,
  getCoinbaseAPI,
  POPULAR_PAIRS
} from '@/services/coinbaseApi';

export interface CoinbaseCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  sandbox: boolean;
}

export interface CoinbaseState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  accounts: CoinbaseAccount[];
  products: CoinbaseProduct[];
  tickers: Record<string, CoinbaseTicker>;
  orders: CoinbaseOrder[];
}

export const useCoinbase = () => {
  const [state, setState] = useState<CoinbaseState>({
    isConnected: false,
    isLoading: false,
    error: null,
    accounts: [],
    products: [],
    tickers: {},
    orders: [],
  });

  const [credentials, setCredentials] = useState<CoinbaseCredentials | null>(() => {
    try {
      const saved = localStorage.getItem('coinbaseCredentials');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error parsing Coinbase credentials from localStorage:', error);
      return null;
    }
  });

  // Initialize API connection
  const connect = useCallback(async (creds: CoinbaseCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const api = initializeCoinbaseAPI(
        creds.apiKey,
        creds.apiSecret,
        creds.passphrase,
        creds.sandbox
      );

      // Test connection by fetching accounts
      const accounts = await api.getAccounts();
      
      setCredentials(creds);
      localStorage.setItem('coinbaseCredentials', JSON.stringify(creds));
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        accounts,
      }));

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Coinbase',
      }));
      return false;
    }
  }, []);

  // Disconnect from Coinbase
  const disconnect = useCallback(() => {
    setCredentials(null);
    localStorage.removeItem('coinbaseCredentials');
    setState({
      isConnected: false,
      isLoading: false,
      error: null,
      accounts: [],
      products: [],
      tickers: {},
      orders: [],
    });
  }, []);

  // Load products
  const loadProducts = useCallback(async () => {
    if (!state.isConnected) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const api = getCoinbaseAPI();
      const products = await api.getProducts();
      
      setState(prev => ({ ...prev, products, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load products',
      }));
    }
  }, [state.isConnected]);

  // Load tickers for popular pairs
  const loadTickers = useCallback(async () => {
    if (!state.isConnected) return;
    
    try {
      const api = getCoinbaseAPI();
      const tickerPromises = POPULAR_PAIRS.map(async (pair) => {
        try {
          const ticker = await api.getTicker(pair);
          return { pair, ticker };
        } catch (error) {
          console.warn(`Failed to load ticker for ${pair}:`, error);
          return null;
        }
      });

      const results = await Promise.all(tickerPromises);
      const tickers: Record<string, CoinbaseTicker> = {};
      
      results.forEach(result => {
        if (result) {
          tickers[result.pair] = result.ticker;
        }
      });

      setState(prev => ({ ...prev, tickers }));
    } catch (error) {
      console.error('Failed to load tickers:', error);
    }
  }, [state.isConnected]);

  // Load orders
  const loadOrders = useCallback(async () => {
    if (!state.isConnected) return;
    
    try {
      const api = getCoinbaseAPI();
      const orders = await api.getOpenOrders();
      
      setState(prev => ({ ...prev, orders }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load orders',
      }));
    }
  }, [state.isConnected]);

  // Place buy order
  const placeBuyOrder = useCallback(async (
    productId: string,
    size: string,
    price?: string,
    type: 'limit' | 'market' = 'market'
  ) => {
    if (!state.isConnected) return null;
    
    try {
      const api = getCoinbaseAPI();
      const order = await api.placeBuyOrder(productId, size, price, type);
      
      // Reload orders and accounts
      await Promise.all([loadOrders(), loadAccounts()]);
      
      return order;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to place buy order',
      }));
      return null;
    }
  }, [state.isConnected]);

  // Place sell order
  const placeSellOrder = useCallback(async (
    productId: string,
    size: string,
    price?: string,
    type: 'limit' | 'market' = 'market'
  ) => {
    if (!state.isConnected) return null;
    
    try {
      const api = getCoinbaseAPI();
      const order = await api.placeSellOrder(productId, size, price, type);
      
      // Reload orders and accounts
      await Promise.all([loadOrders(), loadAccounts()]);
      
      return order;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to place sell order',
      }));
      return null;
    }
  }, [state.isConnected]);

  // Load accounts
  const loadAccounts = useCallback(async () => {
    if (!state.isConnected) return;
    
    try {
      const api = getCoinbaseAPI();
      const accounts = await api.getAccounts();
      
      setState(prev => ({ ...prev, accounts }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load accounts',
      }));
    }
  }, [state.isConnected]);

  // Get account balance for a specific currency
  const getAccountBalance = useCallback((currency: string): string => {
    const account = state.accounts.find(acc => acc.currency === currency);
    return account ? account.available : '0';
  }, [state.accounts]);

  // Get USD balance
  const getUSDBalance = useCallback((): string => {
    return getAccountBalance('USD');
  }, [getAccountBalance]);

  // Get crypto balance
  const getCryptoBalance = useCallback((currency: string): string => {
    return getAccountBalance(currency);
  }, [getAccountBalance]);

  // Initialize connection on mount if credentials exist
  useEffect(() => {
    if (credentials && !state.isConnected) {
      connect(credentials);
    }
  }, [credentials, state.isConnected, connect]);

  // Load data when connected
  useEffect(() => {
    if (state.isConnected) {
      loadProducts();
      loadTickers();
      loadOrders();
      loadAccounts();
    }
  }, [state.isConnected, loadProducts, loadTickers, loadOrders, loadAccounts]);

  // Auto-refresh tickers every 30 seconds
  useEffect(() => {
    if (!state.isConnected) return;
    
    const interval = setInterval(loadTickers, 30000);
    return () => clearInterval(interval);
  }, [state.isConnected, loadTickers]);

  return {
    ...state,
    credentials,
    connect,
    disconnect,
    placeBuyOrder,
    placeSellOrder,
    getAccountBalance,
    getUSDBalance,
    getCryptoBalance,
    loadProducts,
    loadTickers,
    loadOrders,
    loadAccounts,
  };
};

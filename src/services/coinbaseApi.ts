import crypto from 'crypto';

// Types for Coinbase API
export interface CoinbaseAccount {
  id: string;
  currency: string;
  balance: string;
  available: string;
  hold: string;
  profile_id: string;
  trading_enabled: boolean;
}

export interface CoinbaseProduct {
  id: string;
  display_name: string;
  base_currency: string;
  quote_currency: string;
  base_min_size: string;
  base_max_size: string;
  quote_increment: string;
  base_increment: string;
  display_increment: string;
  min_market_funds: string;
  max_market_funds: string;
  margin_enabled: boolean;
  post_only: boolean;
  limit_only: boolean;
  cancel_only: boolean;
  trading_disabled: boolean;
  status: string;
  status_message: string;
  auction_mode: boolean;
}

export interface CoinbaseOrder {
  id: string;
  price: string;
  size: string;
  product_id: string;
  side: 'buy' | 'sell';
  stp: string;
  type: 'limit' | 'market' | 'stop';
  time_in_force: 'GTC' | 'GTT' | 'IOC' | 'FOK';
  post_only: boolean;
  created_at: string;
  fill_fees: string;
  filled_size: string;
  executed_value: string;
  status: 'pending' | 'done' | 'active' | 'open' | 'rejected' | 'cancelled';
  settled: boolean;
}

export interface CoinbaseTicker {
  trade_id: number;
  price: string;
  size: string;
  time: string;
  bid: string;
  ask: string;
  volume: string;
}

export interface CoinbaseCandle {
  time: number;
  low: number;
  high: number;
  open: number;
  close: number;
  volume: number;
}

// Coinbase API Configuration
export class CoinbaseAPI {
  private apiKey: string;
  private apiSecret: string;
  private passphrase: string;
  private baseUrl: string;
  private sandbox: boolean;

  constructor(
    apiKey: string,
    apiSecret: string,
    passphrase: string,
    sandbox: boolean = true
  ) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.passphrase = passphrase;
    this.sandbox = sandbox;
    this.baseUrl = sandbox 
      ? 'https://api-public.sandbox.exchange.coinbase.com'
      : 'https://api.exchange.coinbase.com';
  }

  // Generate authentication signature
  private generateSignature(
    timestamp: string,
    method: string,
    path: string,
    body: string = ''
  ): string {
    const message = timestamp + method + path + body;
    const secret = Buffer.from(this.apiSecret, 'base64');
    return crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('base64');
  }

  // Make authenticated request
  private async makeRequest(
    method: string,
    path: string,
    body?: any
  ): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyString = body ? JSON.stringify(body) : '';
    const signature = this.generateSignature(timestamp, method, path, bodyString);

    const headers = {
      'CB-ACCESS-KEY': this.apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: bodyString || undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Coinbase API Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  // Get account information
  async getAccounts(): Promise<CoinbaseAccount[]> {
    return this.makeRequest('GET', '/accounts');
  }

  // Get account by currency
  async getAccount(currency: string): Promise<CoinbaseAccount> {
    const accounts = await this.getAccounts();
    const account = accounts.find(acc => acc.currency === currency);
    if (!account) {
      throw new Error(`Account not found for currency: ${currency}`);
    }
    return account;
  }

  // Get available products
  async getProducts(): Promise<CoinbaseProduct[]> {
    return this.makeRequest('GET', '/products');
  }

  // Get product by ID
  async getProduct(productId: string): Promise<CoinbaseProduct> {
    return this.makeRequest('GET', `/products/${productId}`);
  }

  // Get product ticker
  async getTicker(productId: string): Promise<CoinbaseTicker> {
    return this.makeRequest('GET', `/products/${productId}/ticker`);
  }

  // Get historical candles
  async getCandles(
    productId: string,
    start: string,
    end: string,
    granularity: number = 3600
  ): Promise<CoinbaseCandle[]> {
    const params = new URLSearchParams({
      start,
      end,
      granularity: granularity.toString(),
    });
    return this.makeRequest('GET', `/products/${productId}/candles?${params}`);
  }

  // Place a buy order
  async placeBuyOrder(
    productId: string,
    size: string,
    price?: string,
    type: 'limit' | 'market' = 'market'
  ): Promise<CoinbaseOrder> {
    const order: any = {
      product_id: productId,
      side: 'buy',
      type,
      size,
    };

    if (type === 'limit' && price) {
      order.price = price;
    }

    return this.makeRequest('POST', '/orders', order);
  }

  // Place a sell order
  async placeSellOrder(
    productId: string,
    size: string,
    price?: string,
    type: 'limit' | 'market' = 'market'
  ): Promise<CoinbaseOrder> {
    const order: any = {
      product_id: productId,
      side: 'sell',
      type,
      size,
    };

    if (type === 'limit' && price) {
      order.price = price;
    }

    return this.makeRequest('POST', '/orders', order);
  }

  // Get order by ID
  async getOrder(orderId: string): Promise<CoinbaseOrder> {
    return this.makeRequest('GET', `/orders/${orderId}`);
  }

  // Cancel order
  async cancelOrder(orderId: string): Promise<string[]> {
    return this.makeRequest('DELETE', `/orders/${orderId}`);
  }

  // Get open orders
  async getOpenOrders(productId?: string): Promise<CoinbaseOrder[]> {
    const path = productId ? `/orders?product_id=${productId}` : '/orders';
    return this.makeRequest('GET', path);
  }

  // Get order history
  async getOrderHistory(productId?: string): Promise<CoinbaseOrder[]> {
    const path = productId ? `/orders?status=done&product_id=${productId}` : '/orders?status=done';
    return this.makeRequest('GET', path);
  }
}

// Utility functions
export const formatCurrency = (amount: string, currency: string): string => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(num);
};

export const formatPrice = (price: string): string => {
  const num = parseFloat(price);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(num);
};

// Popular trading pairs for kids
export const POPULAR_PAIRS = [
  'BTC-USD',
  'ETH-USD',
  'ADA-USD',
  'DOT-USD',
  'LINK-USD',
  'UNI-USD',
  'MATIC-USD',
  'SOL-USD',
];

// Initialize API instance (will be set by user)
let coinbaseAPI: CoinbaseAPI | null = null;

export const initializeCoinbaseAPI = (
  apiKey: string,
  apiSecret: string,
  passphrase: string,
  sandbox: boolean = true
): CoinbaseAPI => {
  coinbaseAPI = new CoinbaseAPI(apiKey, apiSecret, passphrase, sandbox);
  return coinbaseAPI;
};

export const getCoinbaseAPI = (): CoinbaseAPI => {
  if (!coinbaseAPI) {
    throw new Error('Coinbase API not initialized. Please set up your API credentials first.');
  }
  return coinbaseAPI;
};

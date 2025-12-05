import { useState, useEffect } from 'react';

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  owned: number;
  avgPrice: number;
}

export const useMarketData = () => {
  const [stocks, setStocks] = useState<Stock[]>(() => {
    const saved = localStorage.getItem('marketStocks');
    return saved ? JSON.parse(saved) : [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 175.50, change: 2.3, owned: 0, avgPrice: 0 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.80, change: -1.2, owned: 0, avgPrice: 0 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.90, change: 1.8, owned: 0, avgPrice: 0 },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.30, change: -3.1, owned: 0, avgPrice: 0 },
      { symbol: 'BTC', name: 'Bitcoin', price: 42500, change: 5.7, owned: 0, avgPrice: 0 },
      { symbol: 'ETH', name: 'Ethereum', price: 2580, change: 3.2, owned: 0, avgPrice: 0 },
    ];
  });

  const [marketCash, setMarketCash] = useState(() => {
    const saved = localStorage.getItem('marketCash');
    return saved ? parseFloat(saved) : 10000; // Start with $10,000 virtual money
  });

  useEffect(() => {
    localStorage.setItem('marketStocks', JSON.stringify(stocks));
  }, [stocks]);

  useEffect(() => {
    localStorage.setItem('marketCash', marketCash.toString());
  }, [marketCash]);

  // Simulate market fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks => 
        prevStocks.map(stock => ({
          ...stock,
          price: stock.price * (1 + (Math.random() - 0.5) * 0.02), // ±1% random change
          change: (Math.random() - 0.5) * 10 // Random change between -5% and +5%
        }))
      );
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const buyStock = (symbol: string, shares: number) => {
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock || marketCash < stock.price * shares) return false;

    const totalCost = stock.price * shares;
    const newAvgPrice = stock.owned > 0 
      ? ((stock.avgPrice * stock.owned) + totalCost) / (stock.owned + shares)
      : stock.price;

    setStocks(prev => prev.map(s => 
      s.symbol === symbol 
        ? { ...s, owned: s.owned + shares, avgPrice: newAvgPrice }
        : s
    ));
    
    setMarketCash(prev => prev - totalCost);
    return true;
  };

  const sellStock = (symbol: string, shares: number) => {
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock || stock.owned < shares) return false;

    const totalValue = stock.price * shares;
    
    setStocks(prev => prev.map(s => 
      s.symbol === symbol 
        ? { ...s, owned: s.owned - shares }
        : s
    ));
    
    setMarketCash(prev => prev + totalValue);
    return true;
  };

  const portfolioValue = stocks.reduce((sum, stock) => 
    sum + (stock.owned * stock.price), 0
  );

  const totalPortfolioValue = marketCash + portfolioValue;

  const portfolioChange = stocks.reduce((sum, stock) => {
    if (stock.owned > 0) {
      const currentValue = stock.owned * stock.price;
      const originalValue = stock.owned * stock.avgPrice;
      return sum + (currentValue - originalValue);
    }
    return sum;
  }, 0);

  return {
    stocks,
    marketCash,
    buyStock,
    sellStock,
    portfolioValue,
    totalPortfolioValue,
    portfolioChange,
    setMarketCash
  };
};
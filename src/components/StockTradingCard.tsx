import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign } from 'lucide-react';

interface StockTradingCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  owned: number;
  logo?: string;
  onBuy: () => void;
  onSell: () => void;
  canSell: boolean;
}

export const StockTradingCard: React.FC<StockTradingCardProps> = ({
  symbol,
  name,
  price,
  change,
  owned,
  logo,
  onBuy,
  onSell,
  canSell
}) => {
  const isPositive = change >= 0;
  const isCrypto = symbol.includes('BTC') || symbol.includes('ETH');
  
  // Determine card rarity based on performance
  const getRarity = () => {
    if (Math.abs(change) > 10) return { label: '⭐ Legendary', color: 'from-purple-500 to-pink-500' };
    if (Math.abs(change) > 5) return { label: '💎 Rare', color: 'from-blue-500 to-cyan-500' };
    return { label: '✨ Common', color: 'from-green-500 to-emerald-500' };
  };
  
  const rarity = getRarity();

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.05, rotate: [0, 1, -1, 0] }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-card to-muted/30 border-2 hover:shadow-2xl transition-shadow duration-300 group">
        {/* Holographic shine effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent pointer-events-none"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Rarity banner */}
        <div className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-r ${rarity.color}`} />
        
        <div className="p-4 space-y-4 relative">
          {/* Header with logo and symbol */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {logo ? (
                <motion.div 
                  className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 p-2 shadow-lg ring-2 ring-primary/20"
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.5 }}
                >
                  <img src={logo} alt={symbol} className="w-full h-full object-contain" />
                </motion.div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {symbol.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg">{symbol}</h3>
                <p className="text-xs text-muted-foreground">{name}</p>
              </div>
            </div>
            
            <motion.div
              animate={{
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            >
              <Badge variant="secondary" className="text-xs">
                {rarity.label}
              </Badge>
            </motion.div>
          </div>

          {/* Price display with decorative elements */}
          <div className="relative bg-gradient-to-br from-muted/50 to-muted/20 rounded-lg p-3 border border-border/50">
            <motion.div 
              className="absolute -top-1 -right-1 text-2xl"
              animate={{
                y: [0, -5, 0],
                rotate: [0, 10, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            >
              {isCrypto ? '₿' : '💵'}
            </motion.div>
            
            <div className="flex items-baseline gap-2">
              <motion.span 
                className="text-2xl font-bold text-foreground"
                key={price}
                initial={{ scale: 1.2, color: isPositive ? '#22c55e' : '#ef4444' }}
                animate={{ scale: 1, color: 'inherit' }}
                transition={{ duration: 0.3 }}
              >
                ${price.toFixed(2)}
              </motion.span>
              <motion.div 
                className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                animate={isPositive ? {
                  y: [0, -3, 0]
                } : {
                  y: [0, 3, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity
                }}
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {isPositive ? '+' : ''}{change.toFixed(2)}%
                </span>
              </motion.div>
            </div>
          </div>

          {/* Ownership info */}
          {owned > 0 && (
            <motion.div 
              className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-2 border border-green-200 dark:border-green-800"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <p className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                <span className="text-lg">🎯</span>
                You own: <span className="font-bold">{owned.toFixed(4)} shares</span>
              </p>
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onBuy}
                className="w-full gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4" />
                Buy 🛒
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onSell}
                disabled={!canSell}
                variant="outline"
                className="w-full gap-2 border-2"
                size="sm"
              >
                <DollarSign className="h-4 w-4" />
                Sell 💸
              </Button>
            </motion.div>
          </div>

          {/* Fun fact or tip */}
          <motion.div 
            className="text-xs text-muted-foreground italic text-center pt-2 border-t border-border/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isCrypto ? '🪙 Digital money of the future!' : '📈 A piece of a real company!'}
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};
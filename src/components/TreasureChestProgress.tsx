import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface TreasureChestProgressProps {
  current: number;
  target: number;
  title: string;
}

export const TreasureChestProgress: React.FC<TreasureChestProgressProps> = ({
  current,
  target,
  title
}) => {
  const progress = Math.min((current / target) * 100, 100);
  const coinsCount = Math.floor(progress / 10);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950 dark:to-yellow-900 border-2 border-amber-300 dark:border-amber-700 overflow-hidden">
        <div className="p-6">
          <motion.h3 
            className="text-lg font-bold mb-4 text-center text-foreground flex items-center justify-center gap-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <motion.span
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              🏴‍☠️
            </motion.span>
            {title}
            <span>💎</span>
          </motion.h3>

          {/* Treasure Chest Visual */}
          <div className="relative mb-4 h-32 flex items-end justify-center">
            {/* Chest */}
            <div className="relative">
              <motion.div 
                className="text-7xl"
                animate={progress >= 100 ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                } : {
                  y: [0, -5, 0]
                }}
                transition={{
                  duration: progress >= 100 ? 0.5 : 2,
                  repeat: Infinity,
                  repeatDelay: progress >= 100 ? 0.5 : 1
                }}
              >
                {progress >= 100 ? '🎁' : '🎁'}
              </motion.div>
              
              {/* Coins flying out */}
              {coinsCount > 0 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex gap-1">
                    {[...Array(Math.min(coinsCount, 5))].map((_, i) => (
                      <motion.span 
                        key={i} 
                        className="text-2xl"
                        animate={{
                          y: [0, -20, 0],
                          rotate: [0, 360]
                        }}
                        transition={{
                          delay: i * 0.1,
                          duration: 1.5,
                          repeat: Infinity
                        }}
                      >
                        🪙
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <motion.span
                key={current}
                initial={{ scale: 1.2, color: '#22c55e' }}
                animate={{ scale: 1, color: 'inherit' }}
              >
                ${current.toFixed(2)}
              </motion.span>
              <span className="text-muted-foreground">${target.toFixed(2)}</span>
            </div>
            
            <Progress 
              value={progress} 
              className="h-4 bg-amber-200 dark:bg-amber-900"
            />
            
            <motion.p 
              className="text-center text-sm font-medium text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {progress >= 100 ? (
                <motion.span 
                  className="text-green-600 dark:text-green-400"
                  animate={{
                    scale: [1, 1.1, 1],
                    y: [0, -5, 0]
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 0.5
                  }}
                >
                  🎉 Treasure Complete! 🎉
                </motion.span>
              ) : (
                <span>{progress.toFixed(1)}% Full</span>
              )}
            </motion.p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
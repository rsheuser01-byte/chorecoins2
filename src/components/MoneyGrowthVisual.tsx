import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Sprout, TreeDeciduous, TreePine } from 'lucide-react';

interface MoneyGrowthVisualProps {
  totalValue: number;
  changePercent: number;
}

export const MoneyGrowthVisual: React.FC<MoneyGrowthVisualProps> = ({
  totalValue,
  changePercent
}) => {
  // Determine tree growth stage based on total value
  const getTreeStage = () => {
    if (totalValue < 100) return { icon: Sprout, label: '🌱 Seedling', color: 'text-green-400' };
    if (totalValue < 500) return { icon: TreeDeciduous, label: '🌳 Growing Tree', color: 'text-green-500' };
    return { icon: TreePine, label: '🌲 Money Forest', color: 'text-green-600' };
  };

  const treeStage = getTreeStage();
  const TreeIcon = treeStage.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <Card className="bg-gradient-to-b from-blue-50 via-green-50 to-emerald-100 dark:from-blue-950 dark:via-green-950 dark:to-emerald-900 border-2 border-green-200 dark:border-green-800 overflow-hidden">
        <div className="p-6 text-center">
          <h3 className="text-lg font-bold mb-4 text-foreground">Your Money Tree 🌳</h3>
          
          <div className="relative flex justify-center items-end h-40 mb-4">
            {/* Ground */}
            <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-amber-600 to-amber-500 dark:from-amber-900 dark:to-amber-800 rounded-t-3xl" />
            
            {/* Tree */}
            <motion.div 
              className="relative z-10"
              animate={{
                y: [0, -8, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity
              }}
            >
              <TreeIcon className={`h-24 w-24 ${treeStage.color} drop-shadow-lg`} />
            </motion.div>
            
            {/* Floating coins animation */}
            {changePercent > 0 && (
              <>
                <motion.div 
                  className="absolute top-4 left-1/4 text-2xl"
                  animate={{
                    y: [-20, -60],
                    x: [-10, -20],
                    opacity: [1, 0],
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                >
                  💰
                </motion.div>
                <motion.div 
                  className="absolute top-8 right-1/4 text-2xl"
                  animate={{
                    y: [-15, -50],
                    x: [10, 15],
                    opacity: [1, 0],
                    scale: [1, 0.5]
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    delay: 0.3
                  }}
                >
                  💵
                </motion.div>
                <motion.div 
                  className="absolute top-6 left-1/3 text-xl"
                  animate={{
                    y: [-10, -40],
                    opacity: [1, 0],
                    scale: [1, 1.5, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.6
                  }}
                >
                  ✨
                </motion.div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <div className="inline-block px-4 py-2 bg-white/80 dark:bg-black/20 rounded-full border-2 border-green-300 dark:border-green-700">
              <p className="text-sm font-medium text-muted-foreground">{treeStage.label}</p>
            </div>
            
            <motion.p 
              className="text-2xl font-bold text-foreground"
              key={totalValue}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              ${totalValue.toFixed(2)}
            </motion.p>
            
            {changePercent !== 0 && (
              <motion.p 
                className={`text-sm font-medium ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}
                animate={changePercent > 0 ? {
                  scale: [1, 1.05, 1]
                } : {}}
                transition={{
                  duration: 1.5,
                  repeat: changePercent > 0 ? Infinity : 0,
                  repeatDelay: 1
                }}
              >
                {changePercent >= 0 ? '🌱 Growing' : '🍂 Needs water'} {Math.abs(changePercent).toFixed(2)}%
              </motion.p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
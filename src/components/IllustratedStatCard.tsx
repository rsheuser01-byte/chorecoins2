import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface IllustratedStatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  emoji: string;
  illustration: 'coins' | 'treasure' | 'growth' | 'trophy';
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

export const IllustratedStatCard: React.FC<IllustratedStatCardProps> = ({
  title,
  value,
  subtitle,
  emoji,
  illustration,
  trend = 'neutral',
  onClick
}) => {
  const getIllustrationBg = () => {
    switch (illustration) {
      case 'coins':
        return 'from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800';
      case 'treasure':
        return 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800';
      case 'growth':
        return 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800';
      case 'trophy':
        return 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800';
      default:
        return 'from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getIllustrationEmojis = () => {
    switch (illustration) {
      case 'coins':
        return ['💰', '🪙', '💵'];
      case 'treasure':
        return ['💎', '👑', '🏆'];
      case 'growth':
        return ['🌱', '🌳', '🌟'];
      case 'trophy':
        return ['🏆', '🎯', '⭐'];
      default:
        return ['✨', '💫', '🌟'];
    }
  };

  const getTrendIndicator = () => {
    switch (trend) {
      case 'up':
        return { emoji: '📈', color: 'text-green-600' };
      case 'down':
        return { emoji: '📉', color: 'text-red-600' };
      default:
        return { emoji: '➡️', color: 'text-blue-600' };
    }
  };

  const illustrationEmojis = getIllustrationEmojis();
  const trendIndicator = getTrendIndicator();

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`relative overflow-hidden bg-gradient-to-br ${getIllustrationBg()} border-2 hover:shadow-2xl transition-shadow duration-300 ${onClick ? 'cursor-pointer' : ''} group`}
        onClick={onClick}
      >
        {/* Animated floating decoration emojis */}
        {illustrationEmojis.map((emoji, index) => {
          const sizeClasses = ['text-3xl', 'text-2xl', 'text-xl'];
          return (
          <motion.div
            key={index}
            className={`absolute ${sizeClasses[index] || 'text-xl'} opacity-20`}
            style={{
              top: index === 0 ? '0.5rem' : index === 1 ? 'auto' : '50%',
              right: index === 0 ? '0.5rem' : index === 1 ? 'auto' : '1rem',
              bottom: index === 1 ? '0.5rem' : 'auto',
              left: index === 1 ? '0.5rem' : 'auto'
            }}
            animate={{
              y: [0, -10, 0],
              rotate: [0, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 3 + index,
              repeat: Infinity,
              delay: index * 0.5
            }}
          >
            {emoji}
          </motion.div>
          );
        })}

        <div className="relative z-10 p-4 sm:p-6">
          {/* Header */}
          <motion.div 
            className="flex items-center gap-2 mb-3"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <motion.span 
              className="text-2xl"
              animate={{
                rotate: [0, -10, 10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              {emoji}
            </motion.span>
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
              {title}
            </h3>
          </motion.div>

          {/* Value display */}
          <div className="flex items-baseline gap-2 mb-2">
            <motion.p 
              className="text-2xl sm:text-3xl font-bold text-foreground"
              key={value}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {value}
            </motion.p>
            {trend !== 'neutral' && (
              <motion.span 
                className={`text-lg ${trendIndicator.color}`}
                animate={trend === 'up' ? {
                  y: [0, -5, 0],
                  scale: [1, 1.2, 1]
                } : {
                  y: [0, 5, 0],
                  scale: [1, 0.8, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity
                }}
              >
                {trendIndicator.emoji}
              </motion.span>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <motion.p 
              className="text-xs text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {subtitle}
            </motion.p>
          )}

          {/* Interactive hint */}
          {onClick && (
            <motion.div 
              className="mt-2 text-xs text-primary font-medium"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              Click to edit ✏️
            </motion.div>
          )}
        </div>

        {/* Sparkle effect on hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none"
          initial={{ x: '-100%', opacity: 0 }}
          whileHover={{ x: '100%', opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
      </Card>
    </motion.div>
  );
};
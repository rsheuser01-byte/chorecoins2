import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfettiExplosion from 'react-confetti-explosion';
import { Sparkles, Star, Trophy, Gift } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface CelebrationEffectProps {
  show: boolean;
  type: 'trade' | 'achievement' | 'milestone';
  message?: string;
}

export const CelebrationEffect: React.FC<CelebrationEffectProps> = ({
  show,
  type,
  message = 'Awesome!'
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const { playSuccess, playLevelUp } = useSoundEffects();

  useEffect(() => {
    if (show) {
      setShowConfetti(true);
      // Play appropriate sound based on celebration type
      if (type === 'achievement' || type === 'milestone') {
        playLevelUp();
      } else {
        playSuccess();
      }
      const timer = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [show, type, playSuccess, playLevelUp]);

  const getIcon = () => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-16 w-16 text-yellow-400" />;
      case 'milestone':
        return <Gift className="h-16 w-16 text-purple-400" />;
      default:
        return <Sparkles className="h-16 w-16 text-green-400" />;
    }
  };

  const getConfettiConfig = () => {
    switch (type) {
      case 'achievement':
        return {
          particleCount: 150,
          spread: 180,
          duration: 3000,
          colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#9370DB']
        };
      case 'milestone':
        return {
          particleCount: 200,
          spread: 360,
          duration: 3500,
          colors: ['#FF69B4', '#9370DB', '#4169E1', '#00CED1', '#FFD700']
        };
      default:
        return {
          particleCount: 100,
          spread: 160,
          duration: 2500,
          colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107']
        };
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Professional Confetti */}
          {showConfetti && (
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
              <ConfettiExplosion {...getConfettiConfig()} />
            </div>
          )}

          {/* Center celebration message with Framer Motion */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 20,
                duration: 0.5
              }
            }}
            exit={{ 
              scale: 0.8, 
              opacity: 0,
              transition: { duration: 0.3 }
            }}
            className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"
          >
            <motion.div 
              className="bg-gradient-to-br from-primary via-accent to-secondary text-white rounded-3xl p-10 shadow-2xl border-4 border-white/50 backdrop-blur-sm"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(255,255,255,0.3)",
                  "0 0 60px rgba(255,255,255,0.5)",
                  "0 0 20px rgba(255,255,255,0.3)"
                ]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="flex flex-col items-center gap-6">
                <motion.div
                  animate={{ 
                    y: [0, -20, 0],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {getIcon()}
                </motion.div>
                
                <motion.h2 
                  className="text-4xl font-bold text-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {message}
                </motion.h2>
                
                <div className="flex gap-3">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: [0, 1.2, 1],
                        rotate: [0, 360]
                      }}
                      transition={{
                        delay: 0.3 + i * 0.1,
                        duration: 0.5,
                        scale: { duration: 0.3 }
                      }}
                    >
                      <Star className="h-8 w-8 text-yellow-300 fill-yellow-300" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
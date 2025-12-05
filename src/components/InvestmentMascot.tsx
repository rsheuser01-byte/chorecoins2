import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import novaCartoon from '@/assets/nova-cartoon.png';

interface InvestmentMascotProps {
  message: string;
  mood?: 'happy' | 'excited' | 'encouraging' | 'celebrating';
}

export const InvestmentMascot: React.FC<InvestmentMascotProps> = ({ 
  message, 
  mood = 'happy' 
}) => {
  const getMoodEmoji = () => {
    switch (mood) {
      case 'excited': return '🎉';
      case 'celebrating': return '🏆';
      case 'encouraging': return '💪';
      default: return '😊';
    }
  };

  const getMoodAnimation = () => {
    switch (mood) {
      case 'excited':
        return { y: [0, -10, 0], rotate: [0, 5, -5, 0] };
      case 'celebrating':
        return { scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] };
      case 'encouraging':
        return { x: [0, 5, 0] };
      default:
        return { y: [0, -3, 0] };
    }
  };

  const getMoodTransition = () => {
    switch (mood) {
      case 'excited':
        return { duration: 0.5, repeat: Infinity, repeatDelay: 1 };
      case 'celebrating':
        return { duration: 0.6, repeat: Infinity, repeatDelay: 0.5 };
      case 'encouraging':
        return { duration: 0.4, repeat: Infinity, repeatDelay: 1 };
      default:
        return { duration: 2, repeat: Infinity };
    }
  };

  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-2 border-primary/20">
        <motion.div 
          className="flex items-center gap-4 p-4"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <motion.div 
            className="relative"
            animate={getMoodAnimation()}
            transition={getMoodTransition()}
          >
            <motion.img 
              src={novaCartoon} 
              alt="Nova" 
              className="w-16 h-16 rounded-full object-cover ring-4 ring-primary/20"
              whileHover={{ scale: 1.1, rotate: 5 }}
            />
            <motion.div 
              className="absolute -top-1 -right-1 text-2xl"
              animate={{
                y: [0, -5, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 0.5
              }}
            >
              {getMoodEmoji()}
            </motion.div>
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-primary">Nova says:</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.div>
            </div>
            <motion.p 
              className="text-sm text-foreground/90 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {message}
            </motion.p>
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
};
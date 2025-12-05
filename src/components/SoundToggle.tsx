import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export const SoundToggle: React.FC = () => {
  const { isMuted, toggleMute, playClick } = useSoundEffects();

  const handleToggle = () => {
    toggleMute();
    if (isMuted) {
      // Will play sound since we're unmuting
      setTimeout(() => playClick(), 50);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={handleToggle}
        className="rounded-full shadow-lg bg-background/80 backdrop-blur-sm border-2"
      >
        <motion.div
          animate={{
            scale: isMuted ? 1 : [1, 1.2, 1],
            rotate: isMuted ? 0 : [0, -10, 10, 0]
          }}
          transition={{
            duration: 0.5,
            repeat: isMuted ? 0 : Infinity,
            repeatDelay: 3
          }}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </motion.div>
      </Button>
    </motion.div>
  );
};

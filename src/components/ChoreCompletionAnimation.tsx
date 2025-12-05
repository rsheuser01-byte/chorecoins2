import React, { useEffect, useState } from 'react';
import { CheckCircle, Sparkles, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChoreCompletionAnimationProps {
  show: boolean;
  choreTitle: string;
  onComplete: () => void;
}

export const ChoreCompletionAnimation: React.FC<ChoreCompletionAnimationProps> = ({
  show,
  choreTitle,
  onComplete
}) => {
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (show) {
      setShowParticles(true);
      
      // Play success sound using Web Audio API
      const playSound = async () => {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) return;
          
          let audioContext = new AudioContextClass();
          
          // Resume audio context if it's suspended (required by some browsers)
          if (audioContext.state === 'suspended') {
            try {
              await audioContext.resume();
            } catch (e) {
              // If resume fails, try creating a new context
              audioContext = new AudioContextClass();
            }
          }
          
          // Wait a tiny bit to ensure context is ready
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // Create a pleasant two-tone success chime
          const playTone = (frequency: number, startTime: number, duration: number) => {
            try {
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              oscillator.frequency.value = frequency;
              oscillator.type = 'sine';
              
              gainNode.gain.setValueAtTime(0, startTime);
              gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
              gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
              
              oscillator.start(startTime);
              oscillator.stop(startTime + duration);
            } catch (e) {
              console.log('Tone play failed:', e);
            }
          };
          
          const now = audioContext.currentTime;
          // First tone (lower)
          playTone(523.25, now, 0.2); // C5
          // Second tone (higher) - slightly delayed
          playTone(659.25, now + 0.1, 0.2); // E5
          
          // Cleanup after sound finishes
          setTimeout(() => {
            audioContext.close().catch(() => {});
          }, 500);
        } catch (error) {
          // Silently fail if audio context is not available or user hasn't interacted
          console.log('Audio play failed:', error);
        }
      };
      
      // Play sound immediately (user interaction has already occurred via button click)
      playSound();
      
      const timer = setTimeout(() => {
        setShowParticles(false);
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
      />
      
      {/* Main Animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl border-2 border-money-green"
      >
        {/* Checkmark Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="flex justify-center mb-4"
        >
          <div className="relative">
            <CheckCircle className="h-20 w-20 text-money-green" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <Sparkles className="h-24 w-24 text-money-gold opacity-50" />
            </motion.div>
          </div>
        </motion.div>

        {/* Message */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2"
        >
          Great Job! 🎉
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-center text-gray-600 dark:text-gray-300"
        >
          {choreTitle} completed!
        </motion.p>

        {/* Particles */}
        {showParticles && (
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: '50%', 
                  y: '50%', 
                  scale: 0,
                  opacity: 1
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 200}%`,
                  y: `${50 + (Math.random() - 0.5) * 200}%`,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  delay: Math.random() * 0.5,
                  ease: "easeOut"
                }}
                className="absolute"
              >
                <Star className="h-4 w-4 text-money-gold" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};


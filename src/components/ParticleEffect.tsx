import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

interface ParticleEffectProps {
  type: 'coins' | 'stars' | 'sparkles' | 'money';
  count?: number;
  trigger?: boolean;
  sourceX?: number;
  sourceY?: number;
}

export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  type,
  count = 15,
  trigger = true,
  sourceX = 50,
  sourceY = 50
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const getEmoji = () => {
    switch (type) {
      case 'coins':
        return ['🪙', '💰', '💵'];
      case 'stars':
        return ['⭐', '✨', '🌟'];
      case 'sparkles':
        return ['✨', '💫', '⚡'];
      case 'money':
        return ['💵', '💰', '💎'];
      default:
        return ['✨'];
    }
  };

  useEffect(() => {
    if (trigger) {
      const emojis = getEmoji();
      const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        x: sourceX + (Math.random() - 0.5) * 30,
        y: sourceY + (Math.random() - 0.5) * 30,
        size: 20 + Math.random() * 20,
        duration: 1 + Math.random() * 1.5,
        delay: Math.random() * 0.3
      }));
      
      setParticles(newParticles);
      
      const timer = setTimeout(() => {
        setParticles([]);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, count, sourceX, sourceY, type]);

  if (particles.length === 0) return null;

  const emojis = getEmoji();

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {particles.map((particle, index) => (
          <motion.div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              fontSize: `${particle.size}px`
            }}
            initial={{
              opacity: 1,
              scale: 0,
              rotate: 0,
              y: 0
            }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0, 1.2, 0.5],
              rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
              y: [-100 - Math.random() * 100],
              x: [(Math.random() - 0.5) * 100]
            }}
            exit={{
              opacity: 0,
              scale: 0
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: "easeOut"
            }}
          >
            {emojis[index % emojis.length]}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

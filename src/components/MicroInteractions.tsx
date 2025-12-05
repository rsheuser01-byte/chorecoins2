import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonPressProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ButtonPress: React.FC<ButtonPressProps> = ({ children, className = '', onClick }) => {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({ children, className = '', delay = 0 }) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -10, 0],
        rotate: [0, 2, -2, 0]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        delay
      }}
    >
      {children}
    </motion.div>
  );
};

interface PulseGlowProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

export const PulseGlow: React.FC<PulseGlowProps> = ({ children, className = '', color = 'rgba(59, 130, 246, 0.5)' }) => {
  return (
    <motion.div
      className={className}
      animate={{
        boxShadow: [
          `0 0 0px ${color}`,
          `0 0 20px ${color}`,
          `0 0 0px ${color}`
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity
      }}
    >
      {children}
    </motion.div>
  );
};

interface ShakeProps {
  children: ReactNode;
  className?: string;
  trigger?: boolean;
}

export const Shake: React.FC<ShakeProps> = ({ children, className = '', trigger = false }) => {
  return (
    <motion.div
      className={className}
      animate={trigger ? {
        x: [0, -10, 10, -10, 10, 0],
        rotate: [0, -5, 5, -5, 5, 0]
      } : {}}
      transition={{
        duration: 0.5
      }}
    >
      {children}
    </motion.div>
  );
};

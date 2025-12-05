import React, { useEffect, useRef } from 'react';
import { useSpring, animated } from 'react-spring';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
  duration = 1000
}) => {
  const prevValue = useRef(value);

  const { number } = useSpring({
    from: { number: prevValue.current },
    to: { number: value },
    config: { duration, tension: 280, friction: 60 }
  });

  useEffect(() => {
    prevValue.current = value;
  }, [value]);

  return (
    <animated.span className={className}>
      {number.to(n => `${prefix}${n.toFixed(decimals)}${suffix}`)}
    </animated.span>
  );
};

import * as React from "react";
import { cn } from "@/lib/utils";

interface PressEffectProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  disabled?: boolean;
}

export function PressEffect({ children, className, disabled, ...props }: PressEffectProps) {
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <div
      className={cn(
        "transition-transform duration-150 ease-out cursor-pointer select-none",
        isPressed && !disabled && "scale-[0.97]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => !disabled && setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      {...props}
    >
      {children}
    </div>
  );
}

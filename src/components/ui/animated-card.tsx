import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  hoverEffect?: "lift" | "glow" | "scale" | "none";
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, children, delay = 0, hoverEffect = "lift", ...props }, ref) => {
    const hoverClasses = {
      lift: "hover:-translate-y-1 hover:shadow-lg",
      glow: "hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]",
      scale: "hover:scale-[1.02]",
      none: "",
    };

    return (
      <Card
        ref={ref}
        className={cn(
          "transition-all duration-300 ease-out animate-fade-in",
          hoverClasses[hoverEffect],
          className
        )}
        style={{ animationDelay: `${delay}ms` }}
        {...props}
      >
        {children}
      </Card>
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";

export { AnimatedCard, CardHeader, CardContent, CardDescription, CardFooter, CardTitle };

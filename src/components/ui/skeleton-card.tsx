import { cn } from "@/lib/utils";
import * as React from "react";

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function SkeletonCard({ className, lines = 3, style, ...props }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 animate-pulse", className)} style={style} {...props}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-full bg-muted" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/3 bg-muted rounded" />
          <div className="h-3 w-1/2 bg-muted rounded" />
        </div>
      </div>
      
      {/* Content lines */}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className="h-3 bg-muted rounded" 
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="animate-pulse" style={{ animationDelay: `${i * 100}ms` } as React.CSSProperties} />
      ))}
    </div>
  );
}

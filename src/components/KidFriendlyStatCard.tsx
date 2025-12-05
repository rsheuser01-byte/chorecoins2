import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface KidFriendlyStatCardProps {
  title: string;
  value: string;
  emoji: string;
  icon: LucideIcon;
  subtitle?: string;
  gradient?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const KidFriendlyStatCard: React.FC<KidFriendlyStatCardProps> = ({
  title,
  value,
  emoji,
  icon: Icon,
  subtitle,
  gradient = 'from-primary/20 to-accent/20',
  trend = 'neutral'
}) => {
  const getTrendEmoji = () => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${gradient} border-2 hover:scale-105 transition-all duration-300 hover:shadow-lg cursor-pointer`}>
      <div className="absolute top-0 right-0 text-6xl opacity-10 -mr-4 -mt-4">
        {emoji}
      </div>
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
        
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend !== 'neutral' && (
            <span className="text-lg">{getTrendEmoji()}</span>
          )}
        </div>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient?: 'primary' | 'gold' | 'crypto';
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ 
  title, 
  description, 
  icon: Icon,
  gradient = 'primary'
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (title.toLowerCase().includes('chore')) {
      navigate('/chores');
    } else if (title.toLowerCase().includes('investment') || title.toLowerCase().includes('bitcoin')) {
      navigate('/learn');
    } else if (title.toLowerCase().includes('saving') || title.toLowerCase().includes('goal')) {
      navigate('/invest');
    } else {
      navigate('/learn');
    }
  };
  const gradientClasses = {
    primary: 'from-money-green/10 to-success-green/10 border-money-green/20',
    gold: 'from-money-gold/10 to-yellow-100 border-money-gold/20',
    crypto: 'from-crypto-orange/10 to-money-gold/10 border-crypto-orange/20'
  };

  const iconClasses = {
    primary: 'text-money-green',
    gold: 'text-money-gold',
    crypto: 'text-crypto-orange'
  };

  return (
    <Card 
      className={`bg-gradient-to-br ${gradientClasses[gradient]} hover:shadow-subtle transition-all duration-300 hover:scale-105 border cursor-pointer`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className={`w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3`}>
          <Icon className={`w-6 h-6 ${iconClasses[gradient]}`} />
        </div>
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
};
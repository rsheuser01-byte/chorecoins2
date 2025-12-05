import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Volume2, Coins, Trophy, Star, Sparkles, DollarSign } from 'lucide-react';

/**
 * Sound Test Panel - Test all sound effects
 */
export const SoundTestPanel: React.FC = () => {
  const {
    playClick,
    playSuccess,
    playCoin,
    playLevelUp,
    playError,
    playAchievement,
    playMilestone,
    playDeposit,
    playTrade,
    playGoalComplete,
    playCoinCombo,
    playMascotHappy,
    playMascotExcited,
    playMascotThinking,
    isLoaded,
    isMuted
  } = useSoundEffects();

  if (isMuted) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Sounds are muted. Enable them in settings to test.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Sound Test Panel
        </CardTitle>
        <CardDescription>
          Test all sound effects {!isLoaded && '(Loading...)'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Sounds */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Basic Sounds</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button onClick={playClick} variant="outline" size="sm">
              Click
            </Button>
            <Button onClick={playSuccess} variant="outline" size="sm">
              Success
            </Button>
            <Button onClick={playCoin} variant="outline" size="sm">
              <Coins className="h-4 w-4 mr-1" />
              Coin
            </Button>
            <Button onClick={playLevelUp} variant="outline" size="sm">
              <Star className="h-4 w-4 mr-1" />
              Level Up
            </Button>
            <Button onClick={playError} variant="outline" size="sm">
              Error
            </Button>
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Achievements</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button onClick={playAchievement} variant="outline" size="sm">
              <Trophy className="h-4 w-4 mr-1" />
              Achievement
            </Button>
            <Button onClick={playMilestone} variant="outline" size="sm">
              Milestone
            </Button>
            <Button onClick={playGoalComplete} variant="outline" size="sm">
              Goal Complete
            </Button>
          </div>
        </div>

        {/* Financial */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Financial Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button onClick={playDeposit} variant="outline" size="sm">
              <DollarSign className="h-4 w-4 mr-1" />
              Deposit
            </Button>
            <Button onClick={playTrade} variant="outline" size="sm">
              Trade Stock
            </Button>
            <Button onClick={() => playCoinCombo(5)} variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-1" />
              Coin Combo
            </Button>
          </div>
        </div>

        {/* Mascot */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Nova Mascot</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button onClick={playMascotHappy} variant="outline" size="sm">
              😊 Happy
            </Button>
            <Button onClick={playMascotExcited} variant="outline" size="sm">
              🎉 Excited
            </Button>
            <Button onClick={playMascotThinking} variant="outline" size="sm">
              🤔 Thinking
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p>💡 Tip: Sounds without audio files use oscillator fallbacks automatically.</p>
        </div>
      </CardContent>
    </Card>
  );
};

import React, { createContext, useContext, ReactNode } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

/**
 * Sound Context Provider
 * Makes sound effects available throughout the app without prop drilling
 */

type SoundContextType = ReturnType<typeof useSoundEffects>;

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSoundContext = () => {
  const context = useContext(SoundContext);
  if (!context) {
    // Return a no-op version if not wrapped in provider
    return {
      isLoaded: false,
      isMuted: true,
      playClick: () => {},
      playSuccess: () => {},
      playCoin: () => {},
      playLevelUp: () => {},
      playError: () => {},
      playAchievement: () => {},
      playMilestone: () => {},
      playDeposit: () => {},
      playTrade: () => {},
      playGoalComplete: () => {},
      playCoinCombo: () => {},
      playMascotHappy: () => {},
      playMascotExcited: () => {},
      playMascotThinking: () => {},
      playHover: () => {},
      playModalOpen: () => {},
      playModalClose: () => {},
      playToggle: () => {},
      playWithReverb: () => {},
      setMasterVolume: () => {},
      setSFXVolume: () => {},
      toggleMute: () => {},
      mute: () => {},
      unmute: () => {},
      soundManager: null as any,
    };
  }
  return context;
};

interface SoundProviderProps {
  children: ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const soundEffects = useSoundEffects();

  return (
    <SoundContext.Provider value={soundEffects}>
      {children}
    </SoundContext.Provider>
  );
};

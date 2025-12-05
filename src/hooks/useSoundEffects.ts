import { useState, useEffect, useCallback } from 'react';
import { soundManager } from '@/lib/SoundManager';
import { SOUND_FILES, PRELOAD_SOUNDS } from '@/lib/soundConfig';
import { soundGroups, soundPresets } from '@/lib/soundPresets';

/**
 * Next-Level Sound Effects Hook
 * Uses professional sound system with real audio files
 */
export const useSoundEffects = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundManager.isSoundMuted());

  // Preload essential sounds on mount
  useEffect(() => {
    const preloadSounds = async () => {
      try {
        for (const soundId of PRELOAD_SOUNDS) {
          const soundFile = SOUND_FILES.find(s => s.id === soundId);
          if (soundFile) {
            await soundManager.preload(soundId, soundFile.path, soundFile.poolSize);
          }
        }
        setIsLoaded(true);
      } catch (error) {
        console.warn('Error preloading sounds:', error);
        setIsLoaded(true); // Still set loaded to use fallbacks if needed
      }
    };
    
    preloadSounds();
  }, []);

  // Basic sound effects with variations
  const playClick = useCallback(async () => {
    soundManager.playRandom(soundGroups.clicks, { volume: 0.6 });
  }, []);

  const playSuccess = useCallback(() => {
    soundManager.playPreset('success-celebration', soundPresets);
  }, []);

  const playCoin = useCallback(() => {
    soundManager.playRandom(soundGroups.coins, { 
      volume: 0.8,
      pitch: 0.9 + Math.random() * 0.3 // Random pitch variation
    });
  }, []);

  const playLevelUp = useCallback(() => {
    soundManager.playPreset('level-up', soundPresets);
  }, []);

  const playError = useCallback(() => {
    soundManager.play('error-gentle', { volume: 0.5 });
  }, []);

  // Advanced sound effects
  const playAchievement = useCallback(() => {
    soundManager.playPreset('achievement-unlock', soundPresets);
  }, []);

  const playMilestone = useCallback(() => {
    soundManager.playPreset('milestone-reached', soundPresets);
  }, []);

  const playDeposit = useCallback(() => {
    soundManager.playPreset('deposit-money', soundPresets);
  }, []);

  const playTrade = useCallback(() => {
    soundManager.playPreset('stock-purchase', soundPresets);
  }, []);

  const playGoalComplete = useCallback(() => {
    soundManager.playPreset('goal-complete', soundPresets);
  }, []);

  // Mascot sounds
  const playMascotHappy = useCallback(() => {
    soundManager.playRandom(soundGroups.mascotHappy, { volume: 0.7 });
  }, []);

  const playMascotExcited = useCallback(() => {
    soundManager.playRandom(soundGroups.mascotExcited, { volume: 0.8 });
  }, []);

  const playMascotThinking = useCallback(() => {
    soundManager.playRandom(soundGroups.mascotThinking, { volume: 0.6 });
  }, []);

  // Coin combo system
  const playCoinCombo = useCallback((comboCount: number) => {
    if (comboCount >= 5) {
      soundManager.playPreset('coin-collect-combo', soundPresets);
    } else {
      // Play coins with increasing pitch
      for (let i = 0; i < Math.min(comboCount, 3); i++) {
        soundManager.play('coin-1', {
          volume: 0.8,
          pitch: 1.0 + (i * 0.1),
          delay: i * 100
        });
      }
    }
  }, []);

  // UI sounds
  const playHover = useCallback(() => {
    soundManager.play('hover', { volume: 0.3 });
  }, []);

  const playModalOpen = useCallback(() => {
    soundManager.play('modal-open', { volume: 0.5 });
  }, []);

  const playModalClose = useCallback(() => {
    soundManager.play('modal-close', { volume: 0.5 });
  }, []);

  const playToggle = useCallback((isOn: boolean) => {
    soundManager.play(isOn ? 'toggle-on' : 'toggle-off', { volume: 0.6 });
  }, []);

  // Volume controls
  const setMasterVolume = useCallback((volume: number) => {
    soundManager.setMasterVolume(volume);
  }, []);

  const setSFXVolume = useCallback((volume: number) => {
    soundManager.setSFXVolume(volume);
  }, []);

  // Mute control
  const toggleMute = useCallback(() => {
    soundManager.toggleMute();
    setIsMuted(soundManager.isSoundMuted());
  }, []);

  const mute = useCallback(() => {
    soundManager.mute();
    setIsMuted(true);
  }, []);

  const unmute = useCallback(() => {
    soundManager.unmute();
    setIsMuted(false);
  }, []);

  // Play custom sound with effects
  const playWithReverb = useCallback((soundId: string, reverbAmount: number = 0.5) => {
    const instance = soundManager.play(soundId);
    if (instance) {
      soundManager.applyReverb(instance.audio, reverbAmount);
    }
  }, []);

  return {
    // State
    isLoaded,
    isMuted,
    
    // Basic sounds (backward compatible)
    playClick,
    playSuccess,
    playCoin,
    playLevelUp,
    playError,
    
    // Advanced sounds
    playAchievement,
    playMilestone,
    playDeposit,
    playTrade,
    playGoalComplete,
    playCoinCombo,
    
    // Mascot sounds
    playMascotHappy,
    playMascotExcited,
    playMascotThinking,
    
    // UI sounds
    playHover,
    playModalOpen,
    playModalClose,
    playToggle,
    
    // Effects
    playWithReverb,
    
    // Volume controls
    setMasterVolume,
    setSFXVolume,
    
    // Mute controls
    toggleMute,
    mute,
    unmute,
    
    // Direct access to manager for advanced usage
    soundManager,
  };
};

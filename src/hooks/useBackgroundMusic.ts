import { useEffect } from 'react';
import { soundManager } from '@/lib/SoundManager';
import { useLocation } from 'react-router-dom';

/**
 * Background music system that adapts to page context
 */

interface MusicConfig {
  soundId: string;
  fadeInDuration?: number;
}

const pageMusicMap: Record<string, MusicConfig | null> = {
  '/': { soundId: 'bg-home', fadeInDuration: 3 }, // Upbeat, inspiring
  '/learn': { soundId: 'bg-learn', fadeInDuration: 2 }, // Calm, focus-friendly
  '/invest': { soundId: 'bg-invest', fadeInDuration: 2 }, // Sophisticated
  '/chores': { soundId: 'bg-chores', fadeInDuration: 2 }, // Motivating
  '/achievements': { soundId: 'bg-achievements', fadeInDuration: 2 }, // Triumphant
  '/profile': null, // No music
};

export const useBackgroundMusic = (enabled: boolean = false) => {
  const location = useLocation();

  useEffect(() => {
    if (!enabled) {
      soundManager.stopMusic(1);
      return;
    }

    const musicConfig = pageMusicMap[location.pathname];

    if (musicConfig) {
      soundManager.playMusic(musicConfig.soundId, musicConfig.fadeInDuration);
    } else if (musicConfig === null) {
      soundManager.stopMusic(1);
    }

    // Cleanup on unmount
    return () => {
      if (enabled) {
        soundManager.stopMusic(1);
      }
    };
  }, [location.pathname, enabled]);

  return {
    enableMusic: () => {
      const musicConfig = pageMusicMap[location.pathname];
      if (musicConfig) {
        soundManager.playMusic(musicConfig.soundId, musicConfig.fadeInDuration);
      }
    },
    disableMusic: () => {
      soundManager.stopMusic(2);
    },
  };
};

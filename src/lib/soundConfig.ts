/**
 * Sound Configuration
 * Defines all sound files used in the app and their preload settings
 * Supports both local files and AI-generated sounds from storage
 */

export interface SoundFile {
  id: string;
  path: string;
  poolSize?: number; // Number of instances to preload for concurrent playback
  generationPrompt?: string; // AI generation prompt for regeneration
  category?: string;
}

/**
 * Helper to get storage URL for generated sounds
 */
export const getGeneratedSoundUrl = (soundId: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/sound-effects/${soundId}.mp3`;
};

/**
 * All sound files available in the app
 * Organized by category for clarity
 * Paths starting with 'generated:' will attempt to load from storage first
 */
export const SOUND_FILES: SoundFile[] = [
  // UI Sounds - Try generated first, fallback to local
  { 
    id: 'click-1', 
    path: 'generated:click',
    poolSize: 5,
    generationPrompt: 'Soft organic button click with subtle wooden resonance',
    category: 'UI'
  },
  { 
    id: 'click-2', 
    path: 'generated:click',
    poolSize: 5,
    generationPrompt: 'Soft organic button click with subtle wooden resonance',
    category: 'UI'
  },
  { 
    id: 'click-3', 
    path: 'generated:click',
    poolSize: 5,
    generationPrompt: 'Soft organic button click with subtle wooden resonance',
    category: 'UI'
  },
  { 
    id: 'hover', 
    path: 'generated:hover',
    poolSize: 3,
    generationPrompt: 'Gentle whoosh with organic air movement',
    category: 'UI'
  },
  { 
    id: 'success-chime', 
    path: 'generated:success',
    poolSize: 3,
    generationPrompt: 'Warm uplifting chime with natural harmonics and shimmer',
    category: 'UI'
  },
  { 
    id: 'success-subtle', 
    path: 'generated:success',
    poolSize: 2,
    generationPrompt: 'Warm uplifting chime with natural harmonics and shimmer',
    category: 'UI'
  },
  { 
    id: 'success-bright', 
    path: 'generated:success',
    poolSize: 2,
    generationPrompt: 'Warm uplifting chime with natural harmonics and shimmer',
    category: 'UI'
  },
  { id: 'error-gentle', path: '/sounds/ui/click-modern.mp3', poolSize: 2 },
  { id: 'toggle-on', path: '/sounds/ui/click-modern.mp3', poolSize: 2 },
  { id: 'toggle-off', path: '/sounds/ui/click-modern.mp3', poolSize: 2 },
  { id: 'modal-open', path: '/sounds/ui/click-modern.mp3', poolSize: 2 },
  { id: 'modal-close', path: '/sounds/ui/click-modern.mp3', poolSize: 2 },

  // Coin Sounds - Try generated first, fallback to local
  { 
    id: 'coin-1', 
    path: 'generated:coin',
    poolSize: 5,
    generationPrompt: 'Satisfying metallic coin clink with realistic weight and texture',
    category: 'Coins'
  },
  { 
    id: 'coin-2', 
    path: 'generated:coin',
    poolSize: 5,
    generationPrompt: 'Satisfying metallic coin clink with realistic weight and texture',
    category: 'Coins'
  },
  { 
    id: 'coin-3', 
    path: 'generated:coin',
    poolSize: 5,
    generationPrompt: 'Satisfying metallic coin clink with realistic weight and texture',
    category: 'Coins'
  },
  { 
    id: 'coin-collect', 
    path: 'generated:coin',
    poolSize: 3,
    generationPrompt: 'Satisfying metallic coin clink with realistic weight and texture',
    category: 'Coins'
  },
  { id: 'coin-shower', path: '/sounds/coins/coin-collect.mp3', poolSize: 2 },

  // Achievement Sounds - Try generated first, fallback to local
  { 
    id: 'achievement-fanfare', 
    path: 'generated:achievement',
    poolSize: 2,
    generationPrompt: 'Triumphant orchestral fanfare with organic instruments',
    category: 'Achievements'
  },
  { 
    id: 'level-up-bass', 
    path: 'generated:level-up',
    poolSize: 2,
    generationPrompt: 'Magical ascending sparkle with organic bell tones',
    category: 'Achievements'
  },
  { 
    id: 'level-up-arpeggio', 
    path: 'generated:level-up',
    poolSize: 2,
    generationPrompt: 'Magical ascending sparkle with organic bell tones',
    category: 'Achievements'
  },
  { 
    id: 'level-up-sparkle', 
    path: 'generated:level-up',
    poolSize: 2,
    generationPrompt: 'Magical ascending sparkle with organic bell tones',
    category: 'Achievements'
  },
  { 
    id: 'milestone-bell', 
    path: 'generated:milestone',
    poolSize: 2,
    generationPrompt: 'Epic celebration with rich orchestral crescendo',
    category: 'Achievements'
  },
  { id: 'trophy-shine', path: '/sounds/achievements/achievement-unlock.mp3', poolSize: 2 },
  { id: 'badge-earned', path: '/sounds/achievements/achievement-unlock.mp3', poolSize: 2 },
  { id: 'goal-fanfare', path: '/sounds/achievements/achievement-unlock.mp3', poolSize: 2 },

  // Mascot Sounds (Nova) - Will use fallback oscillators for now
  { id: 'nova-happy-1', path: '/sounds/mascot/happy-1.mp3', poolSize: 3 },
  { id: 'nova-happy-2', path: '/sounds/mascot/happy-2.mp3', poolSize: 3 },
  { id: 'nova-yay', path: '/sounds/mascot/yay.mp3', poolSize: 3 },
  { id: 'nova-excited', path: '/sounds/mascot/excited.mp3', poolSize: 2 },
  { id: 'nova-celebrate', path: '/sounds/mascot/celebrate.mp3', poolSize: 2 },
  { id: 'nova-woohoo', path: '/sounds/mascot/woohoo.mp3', poolSize: 2 },
  { id: 'nova-hmm', path: '/sounds/mascot/hmm.mp3', poolSize: 2 },
  { id: 'nova-thinking', path: '/sounds/mascot/thinking.mp3', poolSize: 2 },
  { id: 'nova-greeting', path: '/sounds/mascot/greeting.mp3', poolSize: 2 },

  // Particle / Effect Sounds - Will use fallback oscillators for now
  { id: 'sparkle-low', path: '/sounds/effects/sparkle-low.mp3', poolSize: 4 },
  { id: 'sparkle-mid', path: '/sounds/effects/sparkle-mid.mp3', poolSize: 4 },
  { id: 'sparkle-high', path: '/sounds/effects/sparkle-high.mp3', poolSize: 4 },
  { id: 'confetti-pop', path: '/sounds/effects/confetti.mp3', poolSize: 3 },
  { id: 'whoosh', path: '/sounds/effects/whoosh.mp3', poolSize: 3 },
  { id: 'cheer-crowd', path: '/sounds/effects/cheer.mp3', poolSize: 2 },

  // Financial Action Sounds - Try generated first, fallback to local
  { 
    id: 'cash-register', 
    path: 'generated:deposit',
    poolSize: 2,
    generationPrompt: 'Professional cash register with real paper and metal sounds',
    category: 'Financial'
  },
  { 
    id: 'deposit', 
    path: 'generated:deposit',
    poolSize: 2,
    generationPrompt: 'Professional cash register with real paper and metal sounds',
    category: 'Financial'
  },
  { id: 'trading-bell', path: '/sounds/financial/deposit.mp3', poolSize: 2 },
  { id: 'withdraw', path: '/sounds/financial/deposit.mp3', poolSize: 2 },
  { id: 'portfolio-up', path: '/sounds/financial/deposit.mp3', poolSize: 2 },
  { id: 'portfolio-down', path: '/sounds/financial/deposit.mp3', poolSize: 2 },
];

/**
 * Sounds to preload on app start for instant playback
 */
export const PRELOAD_SOUNDS: string[] = [
  'click-1',
  'success-chime',
  'coin-1',
  'achievement-fanfare',
  'level-up-bass',
  'milestone-bell',
  'deposit',
  'hover',
];

/**
 * Sound source recommendations
 */
export const SOUND_SOURCES = {
  free: [
    'https://freesound.org/ - Community sound library',
    'https://www.zapsplat.com/ - High quality, free for non-commercial',
    'https://pixabay.com/sound-effects/ - Royalty-free sounds',
    'https://mixkit.co/free-sound-effects/ - Free music and SFX',
  ],
  premium: [
    'https://elements.envato.com/ - $16.50/mo unlimited downloads',
    'https://audiojungle.net/ - Individual sound purchases $1-10',
    'https://www.epidemicsound.com/ - Music + SFX subscription',
  ],
  custom: [
    'Fiverr.com - Hire sound designers ($50-200 for complete pack)',
    'Upwork.com - Professional sound design services',
    'ElevenLabs.io - AI-generated sound effects (integrated)',
  ],
};

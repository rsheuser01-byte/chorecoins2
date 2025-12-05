/**
 * Sound Presets - Layered sound combinations for complex events
 */

export const soundPresets = {
  'achievement-unlock': [
    { sound: 'achievement-fanfare', volume: 0.8, delay: 0 },
    { sound: 'sparkle-high', volume: 0.6, delay: 200 },
    { sound: 'cheer-crowd', volume: 0.4, delay: 400 },
  ],
  
  'level-up': [
    { sound: 'level-up-bass', volume: 0.7, delay: 0 },
    { sound: 'level-up-arpeggio', volume: 0.8, delay: 100 },
    { sound: 'level-up-sparkle', volume: 0.6, delay: 300 },
    { sound: 'cheer-crowd', volume: 0.3, delay: 500 },
  ],
  
  'coin-collect-combo': [
    { sound: 'coin-1', volume: 1.0, delay: 0, pitch: 1.0 },
    { sound: 'coin-2', volume: 1.0, delay: 100, pitch: 1.1 },
    { sound: 'coin-3', volume: 1.0, delay: 200, pitch: 1.2 },
    { sound: 'sparkle-low', volume: 0.5, delay: 300 },
  ],
  
  'success-celebration': [
    { sound: 'success-chime', volume: 0.9, delay: 0 },
    { sound: 'confetti-pop', volume: 0.6, delay: 150 },
    { sound: 'sparkle-high', volume: 0.5, delay: 300 },
  ],
  
  'milestone-reached': [
    { sound: 'milestone-bell', volume: 0.8, delay: 0 },
    { sound: 'success-chime', volume: 0.7, delay: 200 },
    { sound: 'cheer-crowd', volume: 0.5, delay: 400 },
  ],
  
  'deposit-money': [
    { sound: 'cash-register', volume: 0.9, delay: 0 },
    { sound: 'coin-collect', volume: 0.6, delay: 200 },
  ],
  
  'stock-purchase': [
    { sound: 'trading-bell', volume: 0.8, delay: 0 },
    { sound: 'success-subtle', volume: 0.5, delay: 150 },
  ],

  'goal-complete': [
    { sound: 'goal-fanfare', volume: 0.9, delay: 0 },
    { sound: 'confetti-pop', volume: 0.7, delay: 200 },
    { sound: 'cheer-crowd', volume: 0.6, delay: 400 },
    { sound: 'sparkle-high', volume: 0.5, delay: 600 },
  ],
};

/**
 * Sound groups for random variation
 */
export const soundGroups = {
  coins: ['coin-1', 'coin-2', 'coin-3'],
  clicks: ['click-1', 'click-2', 'click-3'],
  sparkles: ['sparkle-low', 'sparkle-mid', 'sparkle-high'],
  success: ['success-chime', 'success-subtle', 'success-bright'],
  mascotHappy: ['nova-happy-1', 'nova-happy-2', 'nova-yay'],
  mascotThinking: ['nova-hmm', 'nova-thinking'],
  mascotExcited: ['nova-excited', 'nova-celebrate', 'nova-woohoo'],
};

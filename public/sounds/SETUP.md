# Sound Files Setup Guide

This app uses a professional sound system that requires actual audio files. Follow these steps to add sounds:

## 📁 Directory Structure

Create the following folder structure in `/public/sounds/`:

```
/public/sounds/
  ├── /ui/              - UI interaction sounds (clicks, hovers, success, error)
  ├── /coins/           - Coin collection sounds
  ├── /achievements/    - Level up, achievements, badges, milestones
  ├── /mascot/          - Nova's voice/personality sounds
  ├── /effects/         - Particles, sparkles, confetti, whooshes
  └── /financial/       - Trading, deposits, portfolio sounds
```

## 🎵 Required Sound Files

### Priority 1: Essential Sounds (Get these first)
These are preloaded on app start for instant playback:

**UI Sounds:**
- `click-1.mp3`, `click-2.mp3`, `click-3.mp3` - Button click variations
- `success.mp3` - Success chime

**Coin Sounds:**
- `coin-1.mp3`, `coin-2.mp3`, `coin-3.mp3` - Coin collection variations

**Mascot Sounds:**
- `happy-1.mp3` - Nova happy sound

**Effects:**
- `sparkle-mid.mp3` - Sparkle effect

### Priority 2: Enhanced Sounds
**UI Sounds:**
- `hover.mp3` - Hover sound
- `success-subtle.mp3`, `success-bright.mp3` - More success variations
- `error.mp3` - Error sound
- `toggle-on.mp3`, `toggle-off.mp3` - Toggle switch sounds
- `modal-open.mp3`, `modal-close.mp3` - Modal sounds

**Coin Sounds:**
- `coin-collect.mp3` - Multi-coin collection
- `coin-shower.mp3` - Large coin reward

**Achievement Sounds:**
- `level-up-bass.mp3` - Deep bass whoosh
- `level-up-arpeggio.mp3` - Ascending notes (C-E-G-C)
- `level-up-sparkle.mp3` - High sparkle layer
- `achievement-fanfare.mp3` - Achievement unlock fanfare
- `trophy.mp3` - Trophy earned
- `badge.mp3` - Badge earned
- `milestone.mp3` - Milestone bell
- `goal-complete.mp3` - Goal completion fanfare

**Mascot Sounds (Nova):**
- `happy-2.mp3`, `yay.mp3` - Happy variations
- `excited.mp3`, `celebrate.mp3`, `woohoo.mp3` - Excited celebrations
- `hmm.mp3`, `thinking.mp3` - Thinking sounds
- `greeting.mp3` - Nova greeting

**Effects:**
- `sparkle-low.mp3`, `sparkle-high.mp3` - Sparkle variations
- `confetti.mp3` - Confetti pop
- `whoosh.mp3` - Transition whoosh
- `cheer.mp3` - Crowd cheer

**Financial Sounds:**
- `cash-register.mp3` - Cash register "cha-ching"
- `trading-bell.mp3` - Stock trading bell
- `deposit.mp3` - Money deposit
- `withdraw.mp3` - Money withdrawal
- `portfolio-up.mp3` - Portfolio gains
- `portfolio-down.mp3` - Portfolio losses

## 🎼 Where to Get Sounds

### Free Sources (Good Quality)
1. **Freesound.org** - https://freesound.org/
   - Search terms: "coin", "click", "success", "level up", "cheer", "bell"
   - Filter by license: Creative Commons 0 (public domain)

2. **Mixkit** - https://mixkit.co/free-sound-effects/
   - Browse: UI sounds, game sounds, coins

3. **Pixabay** - https://pixabay.com/sound-effects/
   - Search: UI sounds, coins, success, celebration

4. **Zapsplat** - https://www.zapsplat.com/
   - Free for non-commercial use
   - High quality library

### Premium Sources (Best Quality)
1. **Envato Elements** - $16.50/month unlimited
   - Search for "UI sound pack" or "game sound effects"
   - Download entire packs for consistency

2. **AudioJungle** - Individual purchases ($1-10 each)
   - Buy specific sounds you need
   - Professional quality

### Custom Sounds
- **Fiverr** - Hire sound designer ($50-200 for complete pack)
- **Upwork** - Professional sound design services

## 📝 File Format Guidelines

**Recommended Formats:**
- **Primary**: `.mp3` (universally supported, good compression)
- **Alternative**: `.ogg` (better compression, use as fallback)

**Audio Specifications:**
- **Bit Rate**: 128-192 kbps (good balance of quality vs file size)
- **Sample Rate**: 44.1 kHz (CD quality)
- **Duration**: 
  - UI sounds: 0.1-0.3 seconds
  - Coins: 0.2-0.5 seconds
  - Achievements: 1-3 seconds
  - Mascot: 0.5-2 seconds

## 🚀 Quick Start (Minimal Setup)

If you want to test the system with minimal effort:

1. Download 5-10 free sounds from Mixkit or Freesound
2. Use the same sound file for similar categories (e.g., coin-1.mp3 = coin-2.mp3)
3. Focus on these first:
   - 1 click sound
   - 1 coin sound
   - 1 success sound
   - 1 level up sound
   - 1 sparkle sound

## ✅ Testing Your Sounds

Once you've added sound files:

1. Open the app
2. Check browser console for any loading errors
3. Test sounds by:
   - Clicking buttons (should hear clicks)
   - Earning coins (should hear coin sounds)
   - Completing achievements (should hear celebrations)
   - Interacting with Nova mascot

## 🔧 Fallback System

The sound system is fault-tolerant:
- If a sound file is missing, it will log a warning but won't crash
- The app will continue to function normally
- You can add sounds gradually over time

## 📊 Performance Notes

- Essential sounds (9 files) are preloaded on app start (~300KB total)
- Remaining sounds load in the background
- Sound pooling prevents audio glitches on rapid playback
- Mobile optimization reduces quality on low-end devices

## 🎯 Recommended Workflow

**Week 1**: Add essential sounds (Priority 1)
**Week 2**: Add UI and coin variations
**Week 3**: Add achievement and mascot sounds
**Week 4**: Polish with effects and financial sounds

---

## Need Help?

If you're unsure about sound selection or need recommendations, the current sound system will work as a placeholder until you add professional audio files.

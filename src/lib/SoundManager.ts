/**
 * Professional Sound Manager System
 * Handles audio preloading, playback, effects, and mixing
 */

export interface PlayOptions {
  volume?: number;
  loop?: boolean;
  pitch?: number;
  delay?: number;
  fadeIn?: number;
  fadeOut?: number;
  pan?: number; // -1 (left) to 1 (right)
}

export interface SoundInstance {
  audio: HTMLAudioElement;
  id: string;
  stop: () => void;
  fadeOut: (duration: number) => void;
}

interface SoundPreset {
  sound: string;
  volume?: number;
  delay?: number;
  pitch?: number;
}

export class SoundManager {
  private sounds: Map<string, HTMLAudioElement[]> = new Map();
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 1.0;
  private musicVolume: number = 0.7;
  private sfxVolume: number = 0.8;
  private activeSounds: Set<SoundInstance> = new Set();
  private maxConcurrentSounds: number = 10;
  private isMuted: boolean = false;
  private reverbNode: ConvolverNode | null = null;
  private delayNode: DelayNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private currentMusic: SoundInstance | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.loadMuteState();
      this.initializeAudioEffects();
    }
  }

  /**
   * Initialize Web Audio API effects
   */
  private initializeAudioEffects(): void {
    if (!this.audioContext) return;

    // Create reverb node
    this.reverbNode = this.audioContext.createConvolver();
    this.createReverbImpulse(2, 0.5); // 2 second reverb, 50% decay

    // Create delay node
    this.delayNode = this.audioContext.createDelay(5.0);
    this.delayNode.delayTime.value = 0.3; // 300ms delay

    // Create filter node
    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 20000; // No filtering by default
  }

  /**
   * Create reverb impulse response
   */
  private createReverbImpulse(duration: number, decay: number): void {
    if (!this.audioContext || !this.reverbNode) return;

    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }

    this.reverbNode.buffer = impulse;
  }

  /**
   * Fallback oscillator sound (when audio file not available)
   */
  private playFallbackTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3): void {
    if (!this.audioContext || this.isMuted) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      const adjustedVolume = volume * this.sfxVolume * this.masterVolume;
      gainNode.gain.setValueAtTime(adjustedVolume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.error('Error playing fallback tone:', error);
    }
  }

  private loadMuteState() {
    const saved = localStorage.getItem('soundMuted');
    this.isMuted = saved ? JSON.parse(saved) : false;
  }

  private saveMuteState() {
    localStorage.setItem('soundMuted', JSON.stringify(this.isMuted));
  }

  /**
   * Preload a sound file for instant playback
   */
  async preload(soundId: string, url: string, poolSize: number = 3): Promise<void> {
    const pool: HTMLAudioElement[] = [];
    
    // Handle generated sounds from storage
    let actualUrl = url;
    if (url.startsWith('generated:')) {
      const generatedId = url.replace('generated:', '');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      actualUrl = `${supabaseUrl}/storage/v1/object/public/sound-effects/${generatedId}.mp3`;
      
      // Test if the generated sound exists
      try {
        const response = await fetch(actualUrl, { method: 'HEAD' });
        if (!response.ok) {
          // Silently skip - will use fallback oscillator
          return;
        }
      } catch (error) {
        // Silently skip - will use fallback oscillator
        return;
      }
    }
    
    for (let i = 0; i < poolSize; i++) {
      const audio = new Audio(actualUrl);
      audio.preload = 'auto';
      
      try {
        await audio.load();
        pool.push(audio);
      } catch (error) {
        console.warn(`Failed to preload sound: ${soundId}`, error);
      }
    }
    
    this.sounds.set(soundId, pool);
  }

  /**
   * Preload multiple sounds at once
   */
  async preloadBatch(sounds: { id: string; url: string; poolSize?: number }[]): Promise<void> {
    await Promise.all(
      sounds.map(({ id, url, poolSize }) => this.preload(id, url, poolSize))
    );
  }

  /**
   * Get an available audio instance from the pool
   */
  private getAudioInstance(soundId: string): HTMLAudioElement | null {
    const pool = this.sounds.get(soundId);
    if (!pool || pool.length === 0) {
      console.warn(`Sound not found: ${soundId}`);
      return null;
    }

    // Find a sound that's not currently playing
    const available = pool.find(audio => audio.paused);
    if (available) return available;

    // If all are playing, clone the first one
    const clone = pool[0].cloneNode(true) as HTMLAudioElement;
    pool.push(clone);
    return clone;
  }

  /**
   * Play a sound with options
   */
  play(soundId: string, options: PlayOptions = {}): SoundInstance | null {
    if (this.isMuted) return null;

    // Limit concurrent sounds
    if (this.activeSounds.size >= this.maxConcurrentSounds) {
      const oldest = Array.from(this.activeSounds)[0];
      oldest.stop();
    }

    const audio = this.getAudioInstance(soundId);
    
    // Fallback to oscillator if audio not available
    if (!audio) {
      setTimeout(() => this.playFallbackSound(soundId, options), options.delay || 0);
      return null;
    }

    const {
      volume = 1.0,
      loop = false,
      pitch = 1.0,
      delay = 0,
      fadeIn = 0,
      pan = 0
    } = options;

    // Apply volume (sfx volume * master volume * individual volume)
    audio.volume = Math.max(0, Math.min(1, volume * this.sfxVolume * this.masterVolume));
    audio.loop = loop;

    // Apply pitch shift
    if (pitch !== 1.0) {
      audio.playbackRate = pitch;
    }

    // Create sound instance
    const instance: SoundInstance = {
      audio,
      id: soundId,
      stop: () => {
        audio.pause();
        audio.currentTime = 0;
        this.activeSounds.delete(instance);
      },
      fadeOut: (duration: number) => {
        const startVolume = audio.volume;
        const startTime = Date.now();
        
        const fadeInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = elapsed / (duration * 1000);
          
          if (progress >= 1) {
            clearInterval(fadeInterval);
            instance.stop();
          } else {
            audio.volume = startVolume * (1 - progress);
          }
        }, 50);
      }
    };

    this.activeSounds.add(instance);

    // Handle fade in
    if (fadeIn > 0) {
      const targetVolume = audio.volume;
      audio.volume = 0;
      
      const fadeInInterval = setInterval(() => {
        if (audio.volume < targetVolume) {
          audio.volume = Math.min(targetVolume, audio.volume + 0.05);
        } else {
          clearInterval(fadeInInterval);
        }
      }, fadeIn * 10);
    }

    // Play with delay
    setTimeout(() => {
      audio.play().catch(err => {
        console.warn('Audio playback failed:', err);
        this.activeSounds.delete(instance);
      });
    }, delay);

    // Auto-cleanup when finished
    audio.onended = () => {
      if (!audio.loop) {
        this.activeSounds.delete(instance);
      }
    };

    return instance;
  }

  /**
   * Play a random sound from a group
   */
  playRandom(soundIds: string[], options?: PlayOptions): SoundInstance | null {
    const randomId = soundIds[Math.floor(Math.random() * soundIds.length)];
    return this.play(randomId, options);
  }

  /**
   * Play a sequence of sounds with delays
   */
  async playSequence(sounds: Array<{ id: string; options?: PlayOptions; delay?: number }>): Promise<void> {
    for (const { id, options = {}, delay = 0 } of sounds) {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      this.play(id, options);
    }
  }

  /**
   * Play a preset (multiple layered sounds)
   */
  playPreset(presetName: string, presets: Record<string, SoundPreset[]>): void {
    const preset = presets[presetName];
    if (!preset) {
      console.warn(`Preset not found: ${presetName}`);
      return;
    }

    preset.forEach(({ sound, volume = 1.0, delay = 0, pitch = 1.0 }) => {
      this.play(sound, { volume, delay, pitch });
    });
  }

  /**
   * Stop all currently playing sounds
   */
  stopAll(): void {
    this.activeSounds.forEach(instance => instance.stop());
    this.activeSounds.clear();
  }

  /**
   * Pause all sounds
   */
  pauseAll(): void {
    this.activeSounds.forEach(instance => instance.audio.pause());
  }

  /**
   * Resume all paused sounds
   */
  resumeAll(): void {
    this.activeSounds.forEach(instance => {
      if (instance.audio.paused) {
        instance.audio.play().catch(console.warn);
      }
    });
  }

  /**
   * Volume controls
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }

  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getSFXVolume(): number {
    return this.sfxVolume;
  }

  /**
   * Mute/unmute
   */
  mute(): void {
    this.isMuted = true;
    this.saveMuteState();
    this.pauseAll();
  }

  unmute(): void {
    this.isMuted = false;
    this.saveMuteState();
  }

  toggleMute(): void {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  isSoundMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Performance controls
   */
  setMaxConcurrentSounds(max: number): void {
    this.maxConcurrentSounds = max;
  }

  /**
   * Fallback sounds using oscillators (when audio files not available)
   */
  private playFallbackSound(soundId: string, options: PlayOptions = {}): void {
    const fallbackMap: Record<string, () => void> = {
      // Clicks
      'click-1': () => this.playFallbackTone(800, 0.03, 'square', 0.3),
      'click-2': () => this.playFallbackTone(900, 0.03, 'square', 0.3),
      'click-3': () => this.playFallbackTone(1000, 0.03, 'square', 0.3),
      
      // Success sounds
      'success-chime': () => {
        this.playFallbackTone(523.25, 0.1, 'sine', 0.4);
        setTimeout(() => this.playFallbackTone(659.25, 0.1, 'sine', 0.4), 100);
        setTimeout(() => this.playFallbackTone(783.99, 0.2, 'sine', 0.4), 200);
      },
      'success-subtle': () => this.playFallbackTone(600, 0.15, 'sine', 0.3),
      'success-bright': () => this.playFallbackTone(800, 0.15, 'sine', 0.4),
      
      // Coins
      'coin-1': () => {
        this.playFallbackTone(880, 0.05, 'square', 0.4);
        setTimeout(() => this.playFallbackTone(1046.5, 0.08, 'square', 0.4), 50);
      },
      'coin-2': () => {
        this.playFallbackTone(900, 0.05, 'square', 0.4);
        setTimeout(() => this.playFallbackTone(1100, 0.08, 'square', 0.4), 50);
      },
      'coin-3': () => {
        this.playFallbackTone(920, 0.05, 'square', 0.4);
        setTimeout(() => this.playFallbackTone(1150, 0.08, 'square', 0.4), 50);
      },
      'coin-collect': () => {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => this.playFallbackTone(900 + (i * 100), 0.05, 'square', 0.3), i * 50);
        }
      },
      
      // Achievements
      'level-up-bass': () => this.playFallbackTone(100, 0.3, 'sine', 0.5),
      'level-up-arpeggio': () => {
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((note, i) => {
          setTimeout(() => this.playFallbackTone(note, 0.15, 'sine', 0.4), i * 80);
        });
      },
      'level-up-sparkle': () => {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => this.playFallbackTone(1200 + (i * 200), 0.08, 'sine', 0.3), i * 60);
        }
      },
      'achievement-fanfare': () => {
        const melody = [523.25, 659.25, 783.99, 1046.50];
        melody.forEach((note, i) => {
          setTimeout(() => this.playFallbackTone(note, 0.2, 'sine', 0.4), i * 150);
        });
      },
      'trophy-shine': () => this.playFallbackTone(1500, 0.3, 'sine', 0.3),
      'milestone-bell': () => {
        this.playFallbackTone(800, 0.15, 'sine', 0.4);
        setTimeout(() => this.playFallbackTone(900, 0.15, 'sine', 0.4), 150);
      },
      'goal-fanfare': () => {
        const celebration = [523, 659, 784, 1047, 1319];
        celebration.forEach((note, i) => {
          setTimeout(() => this.playFallbackTone(note, 0.15, 'sine', 0.4), i * 100);
        });
      },
      
      // Mascot sounds
      'nova-happy-1': () => {
        this.playFallbackTone(600, 0.1, 'sine', 0.4);
        setTimeout(() => this.playFallbackTone(800, 0.15, 'sine', 0.4), 100);
      },
      'nova-happy-2': () => {
        this.playFallbackTone(650, 0.1, 'sine', 0.4);
        setTimeout(() => this.playFallbackTone(850, 0.15, 'sine', 0.4), 100);
      },
      'nova-yay': () => {
        this.playFallbackTone(700, 0.08, 'sine', 0.4);
        setTimeout(() => this.playFallbackTone(900, 0.12, 'sine', 0.4), 80);
      },
      'nova-excited': () => {
        for (let i = 0; i < 4; i++) {
          setTimeout(() => this.playFallbackTone(600 + (i * 100), 0.08, 'sine', 0.4), i * 70);
        }
      },
      'nova-celebrate': () => {
        const notes = [523, 659, 784];
        notes.forEach((note, i) => {
          setTimeout(() => this.playFallbackTone(note, 0.12, 'sine', 0.4), i * 100);
        });
      },
      'nova-woohoo': () => {
        this.playFallbackTone(500, 0.1, 'sine', 0.4);
        setTimeout(() => this.playFallbackTone(800, 0.2, 'sine', 0.4), 100);
      },
      'nova-hmm': () => this.playFallbackTone(400, 0.3, 'sine', 0.3),
      'nova-thinking': () => this.playFallbackTone(350, 0.25, 'sine', 0.3),
      
      // Effects
      'sparkle-low': () => this.playFallbackTone(1000, 0.1, 'sine', 0.3),
      'sparkle-mid': () => this.playFallbackTone(1500, 0.1, 'sine', 0.3),
      'sparkle-high': () => this.playFallbackTone(2000, 0.1, 'sine', 0.3),
      'confetti-pop': () => this.playFallbackTone(600, 0.08, 'square', 0.4),
      'cheer-crowd': () => {
        // Simulate crowd cheer with multiple tones
        for (let i = 0; i < 8; i++) {
          setTimeout(() => this.playFallbackTone(400 + Math.random() * 400, 0.3, 'sawtooth', 0.2), i * 50);
        }
      },
      
      // Financial
      'cash-register': () => {
        this.playFallbackTone(800, 0.05, 'square', 0.4);
        setTimeout(() => this.playFallbackTone(600, 0.1, 'square', 0.4), 50);
      },
      'trading-bell': () => {
        this.playFallbackTone(1000, 0.2, 'sine', 0.4);
        setTimeout(() => this.playFallbackTone(1000, 0.2, 'sine', 0.4), 250);
      },
      'deposit': () => {
        this.playFallbackTone(700, 0.1, 'square', 0.4);
        setTimeout(() => this.playFallbackTone(900, 0.15, 'square', 0.4), 100);
      },
      
      // UI
      'hover': () => this.playFallbackTone(600, 0.02, 'sine', 0.2),
      'modal-open': () => this.playFallbackTone(400, 0.15, 'sine', 0.3),
      'modal-close': () => this.playFallbackTone(300, 0.15, 'sine', 0.3),
      'toggle-on': () => this.playFallbackTone(800, 0.05, 'square', 0.3),
      'toggle-off': () => this.playFallbackTone(600, 0.05, 'square', 0.3),
      
      // Error
      'error-gentle': () => this.playFallbackTone(200, 0.2, 'sawtooth', 0.3),
    };

    const fallbackFn = fallbackMap[soundId] || fallbackMap['click-1'];
    if (fallbackFn) {
      fallbackFn();
    }
  }

  /**
   * Background music system
   */
  playMusic(soundId: string, fadeInDuration: number = 2): SoundInstance | null {
    // Stop current music with fade out
    if (this.currentMusic) {
      this.currentMusic.fadeOut(1);
    }

    const instance = this.play(soundId, {
      volume: this.musicVolume,
      loop: true,
      fadeIn: fadeInDuration
    });

    if (instance) {
      this.currentMusic = instance;
    }

    return instance;
  }

  stopMusic(fadeOutDuration: number = 2): void {
    if (this.currentMusic) {
      this.currentMusic.fadeOut(fadeOutDuration);
      this.currentMusic = null;
    }
  }

  /**
   * Apply reverb effect to a sound
   */
  applyReverb(audio: HTMLAudioElement, amount: number = 0.5): void {
    if (!this.audioContext || !this.reverbNode) return;

    try {
      const source = this.audioContext.createMediaElementSource(audio);
      const dry = this.audioContext.createGain();
      const wet = this.audioContext.createGain();

      dry.gain.value = 1 - amount;
      wet.gain.value = amount;

      source.connect(dry);
      source.connect(this.reverbNode);
      this.reverbNode.connect(wet);

      dry.connect(this.audioContext.destination);
      wet.connect(this.audioContext.destination);
    } catch (error) {
      // Source might already be connected
      console.warn('Could not apply reverb:', error);
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stopAll();
    this.stopMusic(0);
    this.sounds.clear();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Global singleton instance
export const soundManager = new SoundManager();

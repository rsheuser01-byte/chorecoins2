import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';

export const SoundSettings: React.FC = () => {
  const { 
    isMuted, 
    toggleMute, 
    setMasterVolume, 
    setSFXVolume,
    soundManager,
    playClick 
  } = useSoundEffects();

  const [masterVolume, setMasterVolumeState] = useState(100);
  const [sfxVolume, setSFXVolumeState] = useState(80);
  const [musicEnabled, setMusicEnabled] = useState(false);

  const { enableMusic, disableMusic } = useBackgroundMusic(musicEnabled);

  // Load saved preferences
  useEffect(() => {
    const savedMaster = localStorage.getItem('masterVolume');
    const savedSFX = localStorage.getItem('sfxVolume');
    const savedMusic = localStorage.getItem('musicEnabled');

    if (savedMaster) {
      const volume = parseInt(savedMaster);
      setMasterVolumeState(volume);
      setMasterVolume(volume / 100);
    }

    if (savedSFX) {
      const volume = parseInt(savedSFX);
      setSFXVolumeState(volume);
      setSFXVolume(volume / 100);
    }

    if (savedMusic) {
      setMusicEnabled(JSON.parse(savedMusic));
    }
  }, [setMasterVolume, setSFXVolume]);

  const handleMasterVolumeChange = (value: number[]) => {
    const volume = value[0];
    setMasterVolumeState(volume);
    setMasterVolume(volume / 100);
    localStorage.setItem('masterVolume', volume.toString());
    playClick();
  };

  const handleSFXVolumeChange = (value: number[]) => {
    const volume = value[0];
    setSFXVolumeState(volume);
    setSFXVolume(volume / 100);
    localStorage.setItem('sfxVolume', volume.toString());
    playClick();
  };

  const handleMusicToggle = (enabled: boolean) => {
    setMusicEnabled(enabled);
    localStorage.setItem('musicEnabled', JSON.stringify(enabled));
    
    if (enabled) {
      enableMusic();
    } else {
      disableMusic();
    }
    
    playClick();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Sound Settings
        </CardTitle>
        <CardDescription>
          Customize your audio experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mute Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Sound Effects</Label>
            <p className="text-sm text-muted-foreground">
              Enable or disable all sounds
            </p>
          </div>
          <Switch
            checked={!isMuted}
            onCheckedChange={() => toggleMute()}
          />
        </div>

        {/* Master Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Master Volume</Label>
            <span className="text-sm text-muted-foreground">{masterVolume}%</span>
          </div>
          <Slider
            value={[masterVolume]}
            onValueChange={handleMasterVolumeChange}
            max={100}
            step={1}
            disabled={isMuted}
            className="w-full"
          />
        </div>

        {/* SFX Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Sound Effects Volume</Label>
            <span className="text-sm text-muted-foreground">{sfxVolume}%</span>
          </div>
          <Slider
            value={[sfxVolume]}
            onValueChange={handleSFXVolumeChange}
            max={100}
            step={1}
            disabled={isMuted}
            className="w-full"
          />
        </div>

        {/* Background Music */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-0.5">
            <Label className="text-base flex items-center gap-2">
              <Music className="h-4 w-4" />
              Background Music
            </Label>
            <p className="text-sm text-muted-foreground">
              Play ambient music while using the app
            </p>
          </div>
          <Switch
            checked={musicEnabled}
            onCheckedChange={handleMusicToggle}
            disabled={isMuted}
          />
        </div>

        {/* Sound Info */}
        <div className="pt-4 border-t">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            {isMuted ? (
              <>
                <VolumeX className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Sounds are currently muted. Toggle sound effects to enable audio.</p>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Professional sound system with reverb, layering, and dynamic variations.</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

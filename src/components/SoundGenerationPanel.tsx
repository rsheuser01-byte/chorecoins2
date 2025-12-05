import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Download, Play, Loader2, CheckCircle2 } from 'lucide-react';

interface SoundDefinition {
  id: string;
  name: string;
  defaultPrompt: string;
  category: string;
}

const SOUND_DEFINITIONS: SoundDefinition[] = [
  { id: 'click', name: 'Button Click', defaultPrompt: 'Soft organic button click with subtle wooden resonance', category: 'UI' },
  { id: 'hover', name: 'Hover', defaultPrompt: 'Gentle whoosh with organic air movement', category: 'UI' },
  { id: 'success', name: 'Success', defaultPrompt: 'Warm uplifting chime with natural harmonics and shimmer', category: 'UI' },
  { id: 'coin', name: 'Coin Collect', defaultPrompt: 'Satisfying metallic coin clink with realistic weight and texture', category: 'Coins' },
  { id: 'achievement', name: 'Achievement', defaultPrompt: 'Triumphant orchestral fanfare with organic instruments', category: 'Achievements' },
  { id: 'level-up', name: 'Level Up', defaultPrompt: 'Magical ascending sparkle with organic bell tones', category: 'Achievements' },
  { id: 'milestone', name: 'Milestone', defaultPrompt: 'Epic celebration with rich orchestral crescendo', category: 'Achievements' },
  { id: 'deposit', name: 'Deposit', defaultPrompt: 'Professional cash register with real paper and metal sounds', category: 'Financial' },
];

export const SoundGenerationPanel: React.FC = () => {
  const [generating, setGenerating] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<Record<string, string>>({});
  const [duration, setDuration] = useState(3);
  const [generatedSounds, setGeneratedSounds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const generateSound = async (sound: SoundDefinition) => {
    setGenerating(sound.id);
    try {
      const prompt = customPrompt[sound.id] || sound.defaultPrompt;
      
      const { data, error } = await supabase.functions.invoke('generate-sound-effect', {
        body: { 
          text: prompt, 
          duration_seconds: duration,
          sound_id: sound.id 
        }
      });

      if (error) throw error;
      if (data.error) {
        if (data.needsUpgrade) {
          toast({
            title: "ElevenLabs Account Upgrade Required",
            description: data.error + " Update your API key in Settings or switch to pre-recorded sounds.",
            variant: "destructive",
            duration: 8000
          });
          return;
        }
        throw new Error(data.error);
      }

      setGeneratedSounds(prev => new Set([...prev, sound.id]));
      
      toast({
        title: data.cached ? "Sound Loaded" : "Sound Generated!",
        description: data.cached 
          ? `${sound.name} loaded from cache` 
          : `${sound.name} generated and cached successfully`,
        duration: 3000,
      });

      // Play the sound
      const audio = new Audio(data.url);
      audio.play();

    } catch (error) {
      console.error('Error generating sound:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate sound",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const generateAllSounds = async () => {
    for (const sound of SOUND_DEFINITIONS) {
      await generateSound(sound);
      // Small delay between generations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const categories = [...new Set(SOUND_DEFINITIONS.map(s => s.category))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Sound Generation
        </CardTitle>
        <CardDescription>
          Generate professional sound effects using ElevenLabs AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Controls */}
        <div className="space-y-4 pb-4 border-b">
          <div className="space-y-2">
            <Label>Duration: {duration}s</Label>
            <Slider
              value={[duration]}
              onValueChange={(v) => setDuration(v[0])}
              min={1}
              max={10}
              step={0.5}
              className="w-full"
            />
          </div>
          <Button 
            onClick={generateAllSounds} 
            disabled={generating !== null}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate All Sounds
              </>
            )}
          </Button>
        </div>

        {/* Sound Categories */}
        {categories.map(category => (
          <div key={category} className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">{category}</h3>
            <div className="space-y-3">
              {SOUND_DEFINITIONS.filter(s => s.category === category).map(sound => (
                <div key={sound.id} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">{sound.name}</Label>
                    {generatedSounds.has(sound.id) && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <Input
                    placeholder={sound.defaultPrompt}
                    value={customPrompt[sound.id] || ''}
                    onChange={(e) => setCustomPrompt(prev => ({ ...prev, [sound.id]: e.target.value }))}
                    className="text-sm"
                  />
                  <Button
                    onClick={() => generateSound(sound)}
                    disabled={generating !== null}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    {generating === sound.id ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-2" />
                        Generate & Preview
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
          <p>💡 Tip: Describe sounds with organic, natural qualities for best results</p>
          <p>🎵 Generated sounds are cached and reused across sessions</p>
          <p>⚡ First generation may take 5-10 seconds, cached sounds load instantly</p>
        </div>
      </CardContent>
    </Card>
  );
};

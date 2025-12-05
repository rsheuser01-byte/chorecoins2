import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, duration_seconds = 3, sound_id } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text description is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ error: 'ElevenLabs API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if sound already exists in storage
    const fileName = `${sound_id || text.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp3`;
    const { data: existingFile } = await supabase.storage
      .from('sound-effects')
      .list('', { search: fileName });

    if (existingFile && existingFile.length > 0) {
      const { data } = supabase.storage
        .from('sound-effects')
        .getPublicUrl(fileName);
      
      return new Response(JSON.stringify({ 
        url: data.publicUrl,
        cached: true,
        sound_id: fileName.replace('.mp3', '')
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating sound with ElevenLabs:', { text, duration_seconds });

    // Generate sound with ElevenLabs Sound Effects API v2
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        duration_seconds,
        prompt_influence: 0.8, // Balance between text and audio quality
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to generate sound effect';
      if (response.status === 401) {
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.detail?.status === 'detected_unusual_activity') {
            userMessage = 'ElevenLabs free tier limit reached. Please upgrade your ElevenLabs account or use a different API key.';
          }
        } catch {
          userMessage = 'ElevenLabs API authentication failed. Please check your API key.';
        }
      } else if (response.status === 429) {
        userMessage = 'ElevenLabs rate limit exceeded. Please try again later.';
      }
      
      return new Response(JSON.stringify({ 
        error: userMessage,
        details: errorText,
        needsUpgrade: response.status === 401
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('sound-effects')
      .upload(fileName, audioBlob, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to cache sound' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get public URL
    const { data } = supabase.storage
      .from('sound-effects')
      .getPublicUrl(fileName);

    console.log('Sound generated and cached successfully:', fileName);

    return new Response(JSON.stringify({ 
      url: data.publicUrl,
      cached: false,
      sound_id: fileName.replace('.mp3', '')
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-sound-effect:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

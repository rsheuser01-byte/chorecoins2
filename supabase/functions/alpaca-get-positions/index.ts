import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const ALPACA_API_KEY_ID = Deno.env.get('ALPACA_API_KEY_ID');
    const ALPACA_API_SECRET = Deno.env.get('ALPACA_API_SECRET');

    if (!ALPACA_API_KEY_ID || !ALPACA_API_SECRET) {
      throw new Error('Alpaca credentials not configured');
    }

    const alpacaBaseUrl = 'https://paper-api.alpaca.markets';

    // Get positions
    const positionsResponse = await fetch(`${alpacaBaseUrl}/v2/positions`, {
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY_ID,
        'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
      },
    });

    if (!positionsResponse.ok) {
      const errorText = await positionsResponse.text();
      console.error('Alpaca positions error:', positionsResponse.status, errorText);
      throw new Error(`Failed to get positions: ${positionsResponse.statusText}`);
    }

    const positions = await positionsResponse.json();

    return new Response(
      JSON.stringify({ success: true, positions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in alpaca-get-positions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

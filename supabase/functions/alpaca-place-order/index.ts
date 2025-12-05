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

    const { symbol, qty, side, type = 'market', time_in_force = 'gtc' } = await req.json();

    if (!symbol || !qty || !side) {
      throw new Error('Missing required parameters: symbol, qty, side');
    }

    const ALPACA_API_KEY_ID = Deno.env.get('ALPACA_API_KEY_ID');
    const ALPACA_API_SECRET = Deno.env.get('ALPACA_API_SECRET');

    if (!ALPACA_API_KEY_ID || !ALPACA_API_SECRET) {
      throw new Error('Alpaca credentials not configured');
    }

    const alpacaBaseUrl = 'https://paper-api.alpaca.markets';

    // Place order
    const orderResponse = await fetch(`${alpacaBaseUrl}/v2/orders`, {
      method: 'POST',
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY_ID,
        'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol,
        qty,
        side,
        type,
        time_in_force,
      }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Alpaca order error:', orderResponse.status, errorText);
      throw new Error(`Failed to place order: ${errorText}`);
    }

    const order = await orderResponse.json();

    return new Response(
      JSON.stringify({ success: true, order }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in alpaca-place-order:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

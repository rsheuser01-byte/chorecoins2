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

    const { symbols } = await req.json();

    if (!symbols || !Array.isArray(symbols)) {
      throw new Error('Missing required parameter: symbols (array)');
    }

    const ALPACA_API_KEY_ID = Deno.env.get('ALPACA_API_KEY_ID');
    const ALPACA_API_SECRET = Deno.env.get('ALPACA_API_SECRET');

    if (!ALPACA_API_KEY_ID || !ALPACA_API_SECRET) {
      throw new Error('Alpaca credentials not configured');
    }

    const alpacaBaseUrl = 'https://data.alpaca.markets';
    const symbolsParam = symbols.join(',');

    // Get latest quotes
    const quotesResponse = await fetch(
      `${alpacaBaseUrl}/v2/stocks/quotes/latest?symbols=${symbolsParam}`,
      {
        headers: {
          'APCA-API-KEY-ID': ALPACA_API_KEY_ID,
          'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
        },
      }
    );

    if (!quotesResponse.ok) {
      const errorText = await quotesResponse.text();
      console.error('Alpaca quotes error:', quotesResponse.status, errorText);
      throw new Error(`Failed to get quotes: ${quotesResponse.statusText}`);
    }

    const quotes = await quotesResponse.json();

    return new Response(
      JSON.stringify({ success: true, quotes: quotes.quotes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in alpaca-get-quotes:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

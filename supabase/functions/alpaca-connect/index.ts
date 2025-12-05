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

    // Use Alpaca Paper Trading API
    const alpacaBaseUrl = 'https://paper-api.alpaca.markets';

    // Get account information
    const accountResponse = await fetch(`${alpacaBaseUrl}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY_ID,
        'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
      },
    });

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error('Alpaca API error:', accountResponse.status, errorText);
      throw new Error(`Failed to connect to Alpaca: ${accountResponse.statusText}`);
    }

    const accountData = await accountResponse.json();

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('alpaca_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (existingConnection) {
      // Update existing connection
      const { data, error } = await supabase
        .from('alpaca_connections')
        .update({
          account_id: accountData.id,
          account_number: accountData.account_number,
          status: accountData.status,
          portfolio_value: parseFloat(accountData.portfolio_value),
          buying_power: parseFloat(accountData.buying_power),
          cash: parseFloat(accountData.cash),
          last_synced: new Date().toISOString(),
        })
        .eq('id', existingConnection.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, connection: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Create new connection
      const { data, error } = await supabase
        .from('alpaca_connections')
        .insert({
          user_id: user.id,
          account_id: accountData.id,
          account_number: accountData.account_number,
          status: accountData.status,
          portfolio_value: parseFloat(accountData.portfolio_value),
          buying_power: parseFloat(accountData.buying_power),
          cash: parseFloat(accountData.cash),
          last_synced: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, connection: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in alpaca-connect:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
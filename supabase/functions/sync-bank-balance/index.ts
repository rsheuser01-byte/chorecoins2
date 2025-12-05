import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Configuration, PlaidApi, PlaidEnvironments } from 'npm:plaid@25.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, bankAccountId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Syncing bank balance for user:', userId, 'account:', bankAccountId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get bank account(s) for user
    let query = supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (bankAccountId) {
      query = query.eq('id', bankAccountId);
    }

    const { data: accounts, error: accountError } = await query;

    if (accountError) {
      throw new Error(`Failed to fetch bank accounts: ${accountError.message}`);
    }

    if (!accounts || accounts.length === 0) {
      throw new Error('No active bank accounts found for user');
    }

    // Initialize Plaid client
    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SANDBOX_SECRET');
    const PLAID_ENV = 'sandbox';

    const configuration = new Configuration({
      basePath: PlaidEnvironments[PLAID_ENV],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
          'PLAID-SECRET': PLAID_SECRET,
        },
      },
    });

    const plaidClient = new PlaidApi(configuration);

    // Fetch balances for all accounts
    let totalBalance = 0;
    const accountBalances = [];

    for (const account of accounts) {
      try {
        const balanceResponse = await plaidClient.accountsBalanceGet({
          access_token: account.access_token,
        });

        const plaidAccount = balanceResponse.data.accounts.find(
          (acc) => acc.account_id === account.plaid_account_id
        );

        if (plaidAccount && plaidAccount.balances.available !== null) {
          const balance = plaidAccount.balances.available;
          totalBalance += balance;
          accountBalances.push({
            account_id: account.id,
            balance: balance,
            account_name: account.account_name,
          });
          console.log(`Account ${account.account_name}: $${balance}`);
        }
      } catch (error) {
        console.error(`Error fetching balance for account ${account.id}:`, error);
      }
    }

    console.log('Total balance:', totalBalance);

    // Update or insert user_balances record
    const { data: existingBalance } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    const balanceData = {
      user_id: userId,
      real_bank_balance: totalBalance,
      available_to_invest: totalBalance,
      last_synced: new Date().toISOString(),
    };

    let balanceResult;
    if (existingBalance) {
      balanceResult = await supabase
        .from('user_balances')
        .update(balanceData)
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      balanceResult = await supabase
        .from('user_balances')
        .insert(balanceData)
        .select()
        .single();
    }

    if (balanceResult.error) {
      throw new Error(`Failed to update balance: ${balanceResult.error.message}`);
    }

    console.log('Balance updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        balance: balanceResult.data,
        accounts: accountBalances,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error syncing bank balance:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to sync bank balance',
        details: error,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, TrendingUp, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface AlpacaConnection {
  id: string;
  account_number: string;
  status: string;
  portfolio_value: number;
  buying_power: number;
  cash: number;
  last_synced: string;
}
export const AlpacaConnection = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connection, setConnection] = useState<AlpacaConnection | null>(null);
  const {
    toast
  } = useToast();
  useEffect(() => {
    checkConnection();
  }, []);
  const checkConnection = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('alpaca_connections').select('*').eq('user_id', user.id).eq('is_active', true).maybeSingle();
      if (error) throw error;
      if (data) {
        setConnection(data);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };
  const handleAuthorize = async () => {
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('alpaca-connect');
      if (error) throw error;
      if (data.success) {
        setConnection(data.connection);
        setIsConnected(true);
        setShowAuthDialog(false);
        toast({
          title: "Connected!",
          description: "Your Alpaca paper trading account is now connected."
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Alpaca",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('alpaca-sync-account');
      if (error) throw error;
      if (data.success) {
        setConnection(data.connection);
        toast({
          title: "Synced!",
          description: "Account data updated successfully."
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync account",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  return <div className="space-y-6">
      {/* Connection Status Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">Investment Account</h3>
            <p className="text-muted-foreground mb-4">
              Connect your Alpaca account to start investing with real money. Practice what you've learned with actual trades!
            </p>
            
            {isConnected && connection ? <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Connected to Alpaca Paper Trading</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Account</p>
                    <p className="text-sm font-medium">****{connection.account_number?.slice(-4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Portfolio Value</p>
                    <p className="text-sm font-medium">${Number(connection.portfolio_value).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Buying Power</p>
                    <p className="text-sm font-medium">${Number(connection.buying_power).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cash</p>
                    <p className="text-sm font-medium">${Number(connection.cash).toFixed(2)}</p>
                  </div>
                </div>

                <Button onClick={handleSync} disabled={isSyncing} variant="outline" size="sm">
                  {isSyncing ? <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </> : <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Account
                    </>}
                </Button>
              </div> : <Button onClick={() => setShowAuthDialog(true)} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                {isLoading ? <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </> : 'Connect Alpaca Account'}
              </Button>}
          </div>
        </div>
      </div>

      {/* Authorization Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Authorize Chore Coins
            </DialogTitle>
            <DialogDescription className="text-base pt-4">
              Please review the following before connecting your account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Main Disclosure */}
            <Alert className="border-primary/20 bg-primary/5">
              <AlertCircle className="h-5 w-5 text-primary" />
              <AlertDescription className="text-sm leading-relaxed ml-2">
                <strong className="block mb-2 text-base">Authorization Disclosure</strong>
                By allowing <strong>Chore Coins</strong> to access your Alpaca account, you are granting{' '}
                <strong>Chore Coins</strong> access to your account information and authorization to place 
                transactions in your account at your direction.
                <br /><br />
                Alpaca does not warrant or guarantee that <strong>Chore Coins</strong> will work as advertised 
                or expected. Before authorizing, learn more about <strong>Chore Coins</strong>.
              </AlertDescription>
            </Alert>

            {/* Additional Information */}
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p>You maintain full control and can revoke access at any time</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p>All transactions require your explicit approval</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p>Your personal and financial data is encrypted and secure</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAuthDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAuthorize} disabled={isLoading} className="bg-primary hover:bg-primary/90">
              {isLoading ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </> : 'I Understand, Authorize Connection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
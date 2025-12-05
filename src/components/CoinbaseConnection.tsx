import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  ExternalLink,
  Zap,
  DollarSign,
  TrendingUp,
  Lock
} from 'lucide-react';
import { useCoinbase } from '@/hooks/useCoinbase';

export const CoinbaseConnection: React.FC = () => {
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [credentials, setCredentials] = useState({
    apiKey: '',
    apiSecret: '',
    passphrase: '',
    sandbox: true,
  });

  const { 
    isConnected, 
    isLoading, 
    error, 
    connect, 
    disconnect, 
    accounts,
    getUSDBalance 
  } = useCoinbase();

  const handleConnect = async () => {
    const success = await connect(credentials);
    if (success) {
      setIsSetupOpen(false);
      setCredentials({ apiKey: '', apiSecret: '', passphrase: '', sandbox: true });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const usdBalance = getUSDBalance();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Connection Status Card */}
      <Card className={`transition-all duration-300 ${
        isConnected 
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800' 
          : 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            {isConnected ? (
              <>
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                <span className="text-green-700 dark:text-green-300">Connected to Coinbase</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                <span className="text-orange-700 dark:text-orange-300">Not Connected</span>
              </>
            )}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {isConnected 
              ? 'Your app is connected to Coinbase and ready for trading!'
              : 'Connect your Coinbase account to enable real trading features.'
            }
          </CardDescription>
        </CardHeader>
        
        {isConnected && (
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">USD Balance</span>
                </div>
                <Badge className="bg-green-600 text-white">
                  ${parseFloat(usdBalance).toFixed(2)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Accounts</span>
                </div>
                <Badge className="bg-blue-600 text-white">
                  {accounts.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!isConnected ? (
          <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Key className="h-4 w-4 mr-2" />
                Connect to Coinbase
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Connect to Coinbase
                </DialogTitle>
                <DialogDescription>
                  Enter your Coinbase API credentials to enable real trading features.
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="setup" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="setup">Setup</TabsTrigger>
                  <TabsTrigger value="help">Help</TabsTrigger>
                </TabsList>

                <TabsContent value="setup" className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> We recommend starting with the sandbox environment for testing.
                      Your API credentials are stored locally and never shared.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sandbox"
                        checked={credentials.sandbox}
                        onCheckedChange={(checked) => 
                          setCredentials(prev => ({ ...prev, sandbox: checked }))
                        }
                      />
                      <Label htmlFor="sandbox" className="text-sm font-medium">
                        Use Sandbox Environment (Recommended)
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type={showSecrets ? 'text' : 'password'}
                        value={credentials.apiKey}
                        onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Enter your Coinbase API Key"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apiSecret">API Secret</Label>
                      <div className="relative">
                        <Input
                          id="apiSecret"
                          type={showSecrets ? 'text' : 'password'}
                          value={credentials.apiSecret}
                          onChange={(e) => setCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
                          placeholder="Enter your Coinbase API Secret"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowSecrets(!showSecrets)}
                        >
                          {showSecrets ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passphrase">Passphrase</Label>
                      <Input
                        id="passphrase"
                        type={showSecrets ? 'text' : 'password'}
                        value={credentials.passphrase}
                        onChange={(e) => setCredentials(prev => ({ ...prev, passphrase: e.target.value }))}
                        placeholder="Enter your Coinbase Passphrase"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsSetupOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleConnect}
                        disabled={isLoading || !credentials.apiKey || !credentials.apiSecret || !credentials.passphrase}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? (
                          <>
                            <Zap className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="help" className="space-y-4">
                  <div className="space-y-4">
                    <Alert>
                      <Lock className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Security Note:</strong> Your API credentials are encrypted and stored locally on your device only.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">How to get your Coinbase API credentials:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Log in to your Coinbase account</li>
                        <li>Go to Settings → API</li>
                        <li>Click "Create API Key"</li>
                        <li>Set permissions to "Trade" and "View"</li>
                        <li>Copy your API Key, Secret, and Passphrase</li>
                      </ol>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Sandbox vs Live Trading:</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-100 text-green-800">Sandbox</Badge>
                          <span>Safe testing environment with fake money</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-red-100 text-red-800">Live</Badge>
                          <span>Real trading with actual money (use with caution)</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open('https://www.coinbase.com/developer-platform/products/exchange-api', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Coinbase API Documentation
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        ) : (
          <Button 
            variant="outline" 
            onClick={handleDisconnect}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  ExternalLink,
  Zap,
  Cloud,
  CloudOff,
  RefreshCw,
  Settings,
  Shield,
  Clock
} from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';

export const DatabaseConnection: React.FC = () => {
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [connectionString, setConnectionString] = useState('');
  const [apiKey, setApiKey] = useState('');

  const { 
    isConnected, 
    isLoading, 
    error, 
    lastSync, 
    pendingChanges,
    initialize,
    syncData 
  } = useDatabase();

  const handleConnect = async () => {
    const success = await initialize({ connectionString, apiKey });
    if (success) {
      setIsSetupOpen(false);
      setConnectionString('');
      setApiKey('');
    }
  };

  const handleSync = async () => {
    await syncData();
  };

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
                <span className="text-green-700 dark:text-green-300">Connected to Neon Database</span>
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
              ? 'Your data is safely stored in the cloud and synced across devices!'
              : 'Connect to Neon database to save your progress and sync across devices.'
            }
          </CardDescription>
        </CardHeader>
        
        {isConnected && (
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <Badge className="bg-green-600 text-white">
                  Online
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Last Sync</span>
                </div>
                <Badge className="bg-purple-600 text-white">
                  {lastSync}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <Badge className="bg-orange-600 text-white">
                  {pendingChanges}
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
                <Database className="h-4 w-4 mr-2" />
                Connect to Database
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Connect to Neon Database
                </DialogTitle>
                <DialogDescription>
                  Enter your Neon database connection details to enable cloud storage and sync.
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
                      <strong>Important:</strong> Your database credentials are stored locally and never shared.
                      All data is encrypted and stored securely in your Neon database.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="connectionString">Neon Connection String</Label>
                      <Input
                        id="connectionString"
                        type="password"
                        value={connectionString}
                        onChange={(e) => setConnectionString(e.target.value)}
                        placeholder="postgresql://username:password@host:port/database"
                      />
                      <p className="text-xs text-muted-foreground">
                        Get this from your Neon dashboard under "Connection Details"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key (Optional)</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Your API key for additional security"
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional: Add an API key for additional security
                      </p>
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
                        disabled={isLoading || !connectionString}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? (
                          <>
                            <Zap className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Database className="h-4 w-4 mr-2" />
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
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Security Note:</strong> Your database credentials are encrypted and stored locally on your device only.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">How to get your Neon connection string:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Sign up for a free account at Neon.tech</li>
                        <li>Create a new project</li>
                        <li>Go to your project dashboard</li>
                        <li>Click on "Connection Details"</li>
                        <li>Copy the connection string</li>
                        <li>Paste it in the setup form above</li>
                      </ol>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">What you get with Neon:</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Free tier with 0.5GB storage</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Automatic backups</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Cross-device sync</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Real-time collaboration</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open('https://neon.tech', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Neon.tech
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleSync}
              disabled={isLoading}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsSetupOpen(true)}
              className="flex-1"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        )}
      </div>

      {/* Benefits Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            Why Use Cloud Storage?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Never Lose Progress</h4>
                <p className="text-xs text-muted-foreground">Your achievements, chores, and investments are safely backed up</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Sync Across Devices</h4>
                <p className="text-xs text-muted-foreground">Access your data from phone, tablet, or computer</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Family Sharing</h4>
                <p className="text-xs text-muted-foreground">Parents can monitor progress and set up family accounts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Offline Support</h4>
                <p className="text-xs text-muted-foreground">Works offline and syncs when connection is restored</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

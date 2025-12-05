import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Info,
  Loader2,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';

export const DatabaseConfig = () => {
  const { initialize, isConnected, error } = useDatabase();
  const [connectionString, setConnectionString] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load saved connection string
  React.useEffect(() => {
    const saved = localStorage.getItem('dbConfig');
    if (saved) {
      const config = JSON.parse(saved);
      setConnectionString(config.connectionString || '');
    }
  }, []);

  const handleTestConnection = async () => {
    if (!connectionString.trim()) {
      setTestResult({ success: false, message: 'Please enter a connection string' });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const config = { connectionString: connectionString.trim() };
      const success = await initialize(config);
      
      if (success) {
        setTestResult({ 
          success: true, 
          message: 'Connection successful! Database is ready to use.' 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: 'Connection failed. Please check your connection string.' 
        });
      }
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: error.message || 'Connection test failed' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConnection = async () => {
    if (!connectionString.trim()) {
      setTestResult({ success: false, message: 'Please enter a connection string' });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const config = { connectionString: connectionString.trim() };
      await initialize(config);
      
      setTestResult({ 
        success: true, 
        message: 'Database connected and saved successfully!' 
      });
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: error.message || 'Failed to connect to database' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyConnectionString = () => {
    navigator.clipboard.writeText(connectionString);
    setTestResult({ success: true, message: 'Connection string copied to clipboard!' });
  };

  const maskConnectionString = (str: string) => {
    if (!str) return '';
    return str.replace(/:[^:@]+@/, ':****@');
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 dark:from-blue-950/20 dark:to-purple-950/20 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Database className="h-5 w-5 text-blue-600" />
          Database Configuration
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Connect your ChoreCoins app to Neon PostgreSQL database for data persistence.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isConnected ? (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              ✅ Database is connected and ready! Your data will be saved to Neon PostgreSQL.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800 dark:text-blue-200">Setup Instructions:</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                1. Create a Neon account at <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">neon.tech</a><br />
                2. Create a new project<br />
                3. Copy your connection string from the dashboard<br />
                4. Paste it below and click "Connect"
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="connectionString">Neon Connection String</Label>
              <div className="relative">
                <Input
                  id="connectionString"
                  type={showPassword ? "text" : "password"}
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  placeholder="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
                  className="pr-20"
                />
                <div className="absolute right-2 top-2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-6 w-6 p-0"
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyConnectionString}
                    className="h-6 w-6 p-0"
                    disabled={!connectionString}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {connectionString && (
                <p className="text-xs text-muted-foreground">
                  Masked: {maskConnectionString(connectionString)}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleTestConnection}
                disabled={isLoading || !connectionString.trim()}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleSaveConnection}
                disabled={isLoading || !connectionString.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <Alert className={testResult.success ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-red-200 bg-red-50 dark:bg-red-950/20"}>
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={testResult.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                  {testResult.message}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                🔒 Security Note
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Your connection string contains sensitive information. It's stored locally in your browser 
                and never sent to external servers. Keep your Neon database credentials secure!
              </p>
            </div>

            <div className="text-center">
              <a 
                href="https://neon.tech" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm flex items-center justify-center gap-1"
              >
                Create Neon Account <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

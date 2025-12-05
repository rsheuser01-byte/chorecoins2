import React, { useCallback, useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Banknote, Plus, Calendar, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { plaidService, BankAccount, DepositSchedule } from '@/services/plaidService';
import { DepositScheduleDialog } from '@/components/DepositScheduleDialog';

interface PlaidLinkProps {
  onSuccess?: (bankAccount: BankAccount) => void;
  onError?: (error: string) => void;
}

export const PlaidLink: React.FC<PlaidLinkProps> = ({ onSuccess, onError }) => {
  const { user } = useAuth();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPlaidSuccess = useCallback(async (publicToken: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const bankAccount = await plaidService.exchangePublicToken(publicToken, user.id);
      onSuccess?.(bankAccount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect bank account';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, onSuccess, onError]);

  const onPlaidExit = useCallback((error: any) => {
    if (error) {
      console.error('Plaid Link error:', error);
      const errorMessage = error.error_message || 'Failed to connect bank account';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onError]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: onPlaidExit,
  });

  // Automatically open Plaid Link when ready
  useEffect(() => {
    if (linkToken && ready) {
      console.log('🔧 Plaid Link is ready, opening...');
      open();
      setIsLoading(false);
    }
  }, [linkToken, ready, open]);

  const handleConnectBank = async () => {
    console.log('🔧 handleConnectBank called', { user });
    
    if (!user) {
      console.error('🔧 No user found');
      setError('No user found. Please log in first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔧 Creating Plaid link token...');
      const token = await plaidService.createLinkToken(user.id);
      console.log('🔧 Link token received:', token);
      setLinkToken(token);
      // The useEffect will handle opening when ready
    } catch (err) {
      console.error('🔧 Error in handleConnectBank:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create link token';
      setError(errorMessage);
      onError?.(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      <Button 
        onClick={handleConnectBank} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating Link...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Connect Bank Account
          </>
        )}
      </Button>
    </div>
  );
};

interface BankAccountManagerProps {
  bankAccounts: BankAccount[];
  depositSchedules: DepositSchedule[];
  onBankAccountAdded: (account: BankAccount) => void;
  onDepositScheduleCreated: (schedule: Omit<DepositSchedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const BankAccountManager: React.FC<BankAccountManagerProps> = ({
  bankAccounts,
  depositSchedules,
  onBankAccountAdded,
  onDepositScheduleCreated
}) => {
  const [showPlaidLink, setShowPlaidLink] = useState(false);

  const handlePlaidSuccess = (bankAccount: BankAccount) => {
    console.log('🔧 BankAccountManager: handlePlaidSuccess called', bankAccount);
    onBankAccountAdded(bankAccount);
    setShowPlaidLink(false);
  };

  const handlePlaidError = (error: string) => {
    console.error('🔧 BankAccountManager: Plaid error:', error);
    setShowPlaidLink(false);
  };

  const handleShowPlaidLink = () => {
    console.log('🔧 BankAccountManager: handleShowPlaidLink called');
    setShowPlaidLink(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Bank Account
          </CardTitle>
          <CardDescription>
            Connect your bank account to receive weekly chore payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8">
              <Banknote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bank Account Connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect your bank account to start receiving weekly payments for completed chores.
              </p>
              {showPlaidLink ? (
                <PlaidLink onSuccess={handlePlaidSuccess} onError={handlePlaidError} />
              ) : (
                <Button onClick={handleShowPlaidLink} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Bank Account
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Banknote className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{account.accountName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {account.bankName} •••• {account.lastFourDigits}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {account.accountType}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={account.isActive ? "default" : "secondary"}>
                    {account.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {bankAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Deposit Schedule
            </CardTitle>
            <CardDescription>
              Your weekly chore payments will be deposited automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            {depositSchedules.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Deposit Schedule Set</h3>
                <p className="text-muted-foreground mb-4">
                  Set up automatic weekly deposits for completed chores.
                </p>
                <DepositScheduleDialog
                  bankAccounts={bankAccounts}
                  onCreateSchedule={onDepositScheduleCreated}
                  trigger={
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Set Up Weekly Deposits
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-4">
                {depositSchedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">${schedule.amount} {schedule.frequency}</h4>
                        <p className="text-sm text-muted-foreground">
                          Next deposit: {new Date(schedule.nextDepositDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={schedule.isActive ? "default" : "secondary"}>
                      {schedule.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

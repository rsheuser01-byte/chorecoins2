import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, DollarSign, Clock } from 'lucide-react';
import { BankAccount, DepositSchedule } from '@/services/plaidService';

interface DepositScheduleDialogProps {
  bankAccounts: BankAccount[];
  onCreateSchedule: (schedule: Omit<DepositSchedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  trigger?: React.ReactNode;
}

export const DepositScheduleDialog: React.FC<DepositScheduleDialogProps> = ({
  bankAccounts,
  onCreateSchedule,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    bankAccountId: '',
    amount: '',
    frequency: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    dayOfWeek: 0,
    dayOfMonth: 1,
  });

  // Check if we're in mock mode
  const isMockMode = process.env.REACT_APP_PLAID_CLIENT_ID === 'your_plaid_client_id' || 
                    !process.env.REACT_APP_PLAID_CLIENT_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔧 DepositScheduleDialog: handleSubmit called', formData);
    
    if (!formData.bankAccountId || !formData.amount) {
      console.log('🔧 DepositScheduleDialog: Missing required fields', { 
        bankAccountId: formData.bankAccountId, 
        amount: formData.amount 
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Calculate next deposit date
      const nextDepositDate = calculateNextDepositDate(
        formData.frequency,
        formData.dayOfWeek,
        formData.dayOfMonth
      );

      console.log('🔧 DepositScheduleDialog: Creating schedule with data', {
        bankAccountId: formData.bankAccountId,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        nextDepositDate
      });

      await onCreateSchedule({
        userId: '', // Will be set by the hook
        bankAccountId: formData.bankAccountId,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        dayOfWeek: formData.frequency === 'weekly' ? formData.dayOfWeek : (formData.frequency === 'monthly' ? formData.dayOfMonth : undefined),
        isActive: true,
        nextDepositDate,
      });

      console.log('🔧 DepositScheduleDialog: Schedule created successfully');
      setOpen(false);
      setFormData({
        bankAccountId: '',
        amount: '',
        frequency: 'weekly',
        dayOfWeek: 0,
        dayOfMonth: 1,
      });
    } catch (error) {
      console.error('🔧 DepositScheduleDialog: Error creating deposit schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNextDepositDate = (frequency: string, dayOfWeek: number, dayOfMonth: number): string => {
    const today = new Date();
    const nextDate = new Date(today);

    switch (frequency) {
      case 'weekly':
        const daysUntilNext = (dayOfWeek - today.getDay() + 7) % 7;
        nextDate.setDate(today.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
        break;
      case 'biweekly':
        nextDate.setDate(today.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(today.getMonth() + 1);
        nextDate.setDate(dayOfMonth);
        break;
    }

    return nextDate.toISOString().split('T')[0];
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Set Up Weekly Deposits
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Set Up Deposit Schedule
          </DialogTitle>
          <DialogDescription>
            Configure automatic deposits for completed chores
            {isMockMode && (
              <span className="block text-xs text-muted-foreground mt-1">
                🔧 Mock Mode: Using simulated data
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankAccount">Bank Account</Label>
            <Select
              value={formData.bankAccountId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, bankAccountId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a bank account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.accountName} •••• {account.lastFourDigits}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Deposit Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value: 'weekly' | 'biweekly' | 'monthly') => 
                setFormData(prev => ({ ...prev, frequency: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.frequency === 'weekly' && (
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Day of Week</Label>
              <Select
                value={formData.dayOfWeek.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {getDayName(day)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.frequency === 'monthly' && (
            <div className="space-y-2">
              <Label htmlFor="dayOfMonth">Day of Month</Label>
              <Select
                value={formData.dayOfMonth.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfMonth: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Create Schedule
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

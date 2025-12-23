import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Clock, Calendar } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { TestNotification } from '@/components/TestNotification';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

export default function Notifications() {
  const { permission, isSupported, requestPermission, unsubscribe } = usePushNotifications();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    chore_reminders_enabled: true,
    reminder_time: '09:00',
    reminder_days: [1, 2, 3, 4, 5, 6, 7],
    push_enabled: false,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          chore_reminders_enabled: data.chore_reminders_enabled,
          reminder_time: data.reminder_time.substring(0, 5),
          reminder_days: data.reminder_days || [1, 2, 3, 4, 5, 6, 7],
          push_enabled: data.push_enabled,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async () => {
    if (!supabase) {
      toast({
        title: "Error",
        description: "Database connection not available.",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Not authenticated. Please log in.');
      }
      
      if (!user) {
        throw new Error('No user found. Please log in.');
      }

      // Format reminder_time to include seconds (HH:MM:SS format for TIME type)
      const reminderTimeFormatted = preferences.reminder_time.includes(':') 
        ? `${preferences.reminder_time}:00` 
        : `${preferences.reminder_time}:00:00`;

      const { error, data } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          chore_reminders_enabled: preferences.chore_reminders_enabled,
          reminder_time: reminderTimeFormatted,
          reminder_days: preferences.reminder_days,
          push_enabled: preferences.push_enabled,
        }, {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      const errorMessage = error?.message || error?.details || 'Failed to save preferences.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermission();
      if (granted) {
        setPreferences({ ...preferences, push_enabled: true });
      }
    } else {
      await unsubscribe();
      setPreferences({ ...preferences, push_enabled: false });
    }
  };

  const toggleDay = (day: number) => {
    const newDays = preferences.reminder_days.includes(day)
      ? preferences.reminder_days.filter(d => d !== day)
      : [...preferences.reminder_days, day].sort();
    setPreferences({ ...preferences, reminder_days: newDays });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gradient">Notification Settings</h1>
          <p className="text-muted-foreground">
            Configure how and when you want to receive chore reminders
          </p>
        </div>

        <div className="space-y-6">
          {/* Push Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Push Notifications
              </CardTitle>
              <CardDescription>
                Receive browser notifications even when the app is closed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isSupported && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Push notifications are not supported in your browser. Try using Chrome, Firefox, or Edge.
                  </p>
                </div>
              )}

              {isSupported && permission === 'denied' && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Notifications are blocked. Please enable them in your browser settings.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="push-enabled">Enable Push Notifications</Label>
                <Switch
                  id="push-enabled"
                  checked={preferences.push_enabled}
                  onCheckedChange={handlePushToggle}
                  disabled={!isSupported || permission === 'denied'}
                />
              </div>

              {preferences.push_enabled && permission === 'granted' && (
                <div className="pt-4 border-t">
                  <TestNotification />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chore Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Chore Reminders
              </CardTitle>
              <CardDescription>
                Set when you want to be reminded about your chores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="chore-reminders">Enable Chore Reminders</Label>
                <Switch
                  id="chore-reminders"
                  checked={preferences.chore_reminders_enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, chore_reminders_enabled: checked })
                  }
                />
              </div>

              {preferences.chore_reminders_enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reminder-time">Reminder Time</Label>
                    <Input
                      id="reminder-time"
                      type="time"
                      value={preferences.reminder_time}
                      onChange={(e) =>
                        setPreferences({ ...preferences, reminder_time: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Reminder Days
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {DAYS.map((day) => (
                        <Button
                          key={day.value}
                          variant={preferences.reminder_days.includes(day.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleDay(day.value)}
                          className="w-full"
                        >
                          {day.label.substring(0, 3)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Button onClick={savePreferences} disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
    </div>
  );
}

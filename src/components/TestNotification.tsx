import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const TestNotification = () => {
  const { toast } = useToast();

  const sendTestNotification = async () => {
    // Basic support checks
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      toast({
        title: "Not Supported",
        description: "Notifications are not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    if (Notification.permission === 'denied') {
      toast({
        title: "Notifications Blocked",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      });
      return;
    }

    if (Notification.permission !== 'granted') {
      toast({
        title: "Enable Notifications First",
        description: "Please enable push notifications above before sending a test.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the service worker registration API, which is required in many environments
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification('🎉 Test Notification', {
        body: 'Your notifications are working perfectly!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: false,
        data: {
          url: '/',
        },
      });

      toast({
        title: "Test Notification Sent",
        description: "Check your notifications!",
      });
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification. " + (error?.message || ''),
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={sendTestNotification}
      className="w-full"
    >
      <Bell className="h-4 w-4 mr-2" />
      Send Test Notification
    </Button>
  );
};

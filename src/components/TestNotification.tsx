import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const TestNotification = () => {
  const { toast } = useToast();

  const sendTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification('🎉 Test Notification', {
          body: 'Your notifications are working perfectly!',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test-notification',
          requireInteraction: false,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        toast({
          title: "Test Notification Sent",
          description: "Check your notifications!",
        });
      } catch (error) {
        console.error('Error sending test notification:', error);
        toast({
          title: "Error",
          description: "Failed to send test notification. " + error.message,
          variant: "destructive",
        });
      }
    } else if (Notification.permission === 'denied') {
      toast({
        title: "Notifications Blocked",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Enable Notifications First",
        description: "Please enable push notifications above.",
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

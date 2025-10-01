import { useEffect, useRef } from 'react';
import { AlarmSettings } from '../types/alarm';

export const useServiceWorker = () => {
  const swRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    // Check if we're in StackBlitz or other environments that don't support Service Workers
    const isStackBlitz = window.location.hostname.includes('stackblitz') || 
                        window.location.hostname.includes('webcontainer');
    
    if ('serviceWorker' in navigator && !isStackBlitz) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          swRef.current = registration.active;
          
          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, alarm, action, alarmId } = event.data;
            
            switch (type) {
              case 'ALARM_TRIGGERED':
                // This will be handled by the main alarm component
                window.dispatchEvent(new CustomEvent('alarmTriggered', { detail: alarm }));
                break;
              case 'NOTIFICATION_ACTION':
                window.dispatchEvent(new CustomEvent('notificationAction', { 
                  detail: { action, alarmId } 
                }));
                break;
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    } else if (isStackBlitz) {
      console.log('Service Worker not available in StackBlitz environment - background functionality will be limited');
    } else {
      console.log('Service Worker not supported in this browser');
    }
  }, []);

  const updateAlarms = (alarms: AlarmSettings[]) => {
    if (swRef.current && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'UPDATE_ALARMS',
        data: alarms
      });
    } else {
      console.log('Service Worker not available - alarms will only work while app is active');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  return {
    updateAlarms,
    requestNotificationPermission
  };
};
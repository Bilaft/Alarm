// Service Worker for background alarm functionality
let alarms = [];
let alarmTimeouts = new Map();

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'UPDATE_ALARMS':
      alarms = data;
      scheduleAllAlarms();
      break;
    case 'STOP_ALARM':
      // Handle alarm stop from main thread
      break;
  }
});

function scheduleAllAlarms() {
  // Clear existing timeouts
  alarmTimeouts.forEach(timeout => clearTimeout(timeout));
  alarmTimeouts.clear();
  
  alarms.forEach(alarm => {
    if (alarm.isActive && alarm.nextAlarmTime) {
      scheduleAlarm(alarm);
    }
  });
}

function scheduleAlarm(alarm) {
  const now = Date.now();
  const alarmTime = new Date(alarm.nextAlarmTime).getTime();
  const timeUntilAlarm = alarmTime - now;
  
  if (timeUntilAlarm > 0) {
    const timeout = setTimeout(() => {
      // Show notification
      self.registration.showNotification('Alarm Ringing!', {
        body: `${alarm.name} - Time to wake up!`,
        icon: '/vite.svg',
        badge: '/vite.svg',
        tag: `alarm-${alarm.id}`,
        requireInteraction: true,
        actions: [
          { action: 'snooze', title: 'Snooze 5min' },
          { action: 'stop', title: 'Stop' }
        ],
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        silent: false
      });
      
      // Send message to main thread to play sound
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'ALARM_TRIGGERED',
            alarm: alarm
          });
        });
      });
    }, timeUntilAlarm);
    
    alarmTimeouts.set(alarm.id, timeout);
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const alarmId = event.notification.tag.replace('alarm-', '');
  
  // Focus or open the app
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
        clients[0].postMessage({
          type: 'NOTIFICATION_ACTION',
          action: action,
          alarmId: alarmId
        });
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});

// Keep the service worker alive
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
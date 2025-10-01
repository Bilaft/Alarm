import React, { useState, useEffect } from 'react';
import { Bell, Shield, Smartphone } from 'lucide-react';

interface PermissionManagerProps {
  onPermissionsGranted: () => void;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  onPermissionsGranted
}) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [wakeLockSupported, setWakeLockSupported] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    // Check current permissions
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    if ('wakeLock' in navigator) {
      setWakeLockSupported(true);
    }

    // Show permissions dialog if not granted
    if (Notification.permission !== 'granted') {
      setShowPermissions(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        setShowPermissions(false);
        onPermissionsGranted();
      }
    }
  };

  const handleDismiss = () => {
    setShowPermissions(false);
    onPermissionsGranted();
  };

  if (!showPermissions || notificationPermission === 'granted') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 rounded-2xl p-6 max-w-md w-full border border-gray-700/50">
        <div className="text-center mb-6">
          <div className="bg-purple-500/20 p-3 rounded-xl w-fit mx-auto mb-4">
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Enable Background Alarms</h2>
          <p className="text-gray-300 text-sm">
            To ensure your alarms work even when your device is asleep or the browser is in the background, 
            we need a few permissions.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
            <Bell className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-white text-sm">Notifications</h3>
              <p className="text-gray-400 text-xs">
                Show alarm notifications even when the app is closed
              </p>
            </div>
          </div>

          {wakeLockSupported && (
            <div className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
              <Smartphone className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-white text-sm">Screen Wake Lock</h3>
                <p className="text-gray-400 text-xs">
                  Keep the screen active when alarms are set (automatic)
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleDismiss}
            className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            Skip
          </button>
          <button
            onClick={requestNotificationPermission}
            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-all"
          >
            Enable
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          You can change these permissions later in your browser settings
        </p>
      </div>
    </div>
  );
};
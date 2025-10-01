import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { AlarmSettings, Sound } from '../types/alarm';
import { AlarmList } from './AlarmList';
import { AlarmEditor } from './AlarmEditor';
import { PermissionManager } from './PermissionManager';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { useWakeLock } from '../hooks/useWakeLock';

const DEFAULT_ALARM_SOUNDS: Sound[] = [
  { name: 'Classic Bell', file: 'https://www.soundjay.com/phone/sounds/telephone-ring-03b.mp3' },
  { name: 'Digital Beep', file: 'https://www.soundjay.com/phone/sounds/phone-off-hook-1.mp3' },
  { name: 'Gentle Chime', file: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
  { name: 'Nature Sounds', file: 'https://www.soundjay.com/ambient/sounds/spring-weather-1.mp3' }
];

export const AlarmClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alarms, setAlarms] = useState<AlarmSettings[]>([]);
  const [customSounds, setCustomSounds] = useState<Sound[]>([]);
  const [editingAlarm, setEditingAlarm] = useState<AlarmSettings | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'list' | 'editor'>('list');
  const [ringingAlarm, setRingingAlarm] = useState<AlarmSettings | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const alarmTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const { updateAlarms, requestNotificationPermission } = useServiceWorker();
  const hasActiveAlarms = alarms.some(alarm => alarm.isActive);
  useWakeLock(hasActiveAlarms);

  const allSounds = [...DEFAULT_ALARM_SOUNDS, ...customSounds];

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load saved data from localStorage
  useEffect(() => {
    const savedAlarms = localStorage.getItem('alarms');
    const savedCustomSounds = localStorage.getItem('customAlarmSounds');
    
    if (savedAlarms) {
      try {
        const parsed = JSON.parse(savedAlarms);
        setAlarms(parsed);
      } catch (error) {
        console.error('Failed to load alarms:', error);
      }
    }
    
    if (savedCustomSounds) {
      try {
        const parsed = JSON.parse(savedCustomSounds);
        setCustomSounds(parsed);
      } catch (error) {
        console.error('Failed to load custom sounds:', error);
      }
    }
  }, []);

  // Check for permissions on first load
  useEffect(() => {
    const checkPermissions = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        setShowPermissions(true);
      }
    };
    checkPermissions();
  }, []);

  // Save alarms to localStorage
  useEffect(() => {
    localStorage.setItem('alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Save custom sounds to localStorage
  useEffect(() => {
    localStorage.setItem('customAlarmSounds', JSON.stringify(customSounds));
  }, [customSounds]);

  // Update service worker with current alarms
  useEffect(() => {
    updateAlarms(alarms);
  }, [alarms, updateAlarms]);

  // Listen for service worker events
  useEffect(() => {
    const handleAlarmTriggered = (event: CustomEvent) => {
      const alarm = event.detail;
      setRingingAlarm(alarm);
      if (audioRef.current) {
        audioRef.current.src = alarm.soundFile;
        audioRef.current.loop = true;
        audioRef.current.play().catch(console.error);
      }
    };

    const handleNotificationAction = (event: CustomEvent) => {
      const { action, alarmId } = event.detail;
      if (action === 'stop') {
        stopRingingAlarm();
      } else if (action === 'snooze') {
        snoozeAlarm();
      }
    };

    window.addEventListener('alarmTriggered', handleAlarmTriggered as EventListener);
    window.addEventListener('notificationAction', handleNotificationAction as EventListener);

    return () => {
      window.removeEventListener('alarmTriggered', handleAlarmTriggered as EventListener);
      window.removeEventListener('notificationAction', handleNotificationAction as EventListener);
    };
  }, []);

  const generateRandomAlarmTime = (alarm: AlarmSettings) => {
    const now = new Date();
    
    // If no days are selected, return a time far in the future (effectively disabled)
    if (alarm.daysOfWeek.length === 0) {
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    }
    
    // Find the next valid day for this alarm
    const nextValidDay = findNextValidDay(now, alarm.daysOfWeek);
    
    const startTime = new Date(nextValidDay);
    const endTime = new Date(nextValidDay);
    
    const [startHour, startMinute] = alarm.startTime.split(':').map(Number);
    const [endHour, endMinute] = alarm.endTime.split(':').map(Number);
    
    startTime.setHours(startHour, startMinute, 0, 0);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    // If end time is before start time, assume it's the next day
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1);
      // Make sure the end day is still a valid day
      const endDayName = endTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    }
    // Dynamic start time adjustment
    let effectiveStartTime = startTime;
    
    // If both times are in the past, set them for tomorrow
    if (endTime <= now) {
      effectiveStartTime.setDate(effectiveStartTime.getDate() + 1);
      endTime.setDate(endTime.getDate() + 1);
    } else if (startTime <= now && endTime > now) {
      // If start time is in the past but end time is in the future,
      // use current time as the effective start time
      effectiveStartTime = new Date(now.getTime() + 60000); // Add 1 minute buffer
    } else if (startTime <= now) {
      // If start time is in the past, move to tomorrow
      effectiveStartTime.setDate(effectiveStartTime.getDate() + 1);
    }
    
    // If we're already past the end time for today, move to the next valid day
    if (nextValidDay.toDateString() === now.toDateString() && endTime <= now) {
      const nextDay = findNextValidDay(new Date(now.getTime() + 24 * 60 * 60 * 1000), alarm.daysOfWeek);
      startTime.setTime(nextDay.getTime());
      startTime.setHours(startHour, startMinute, 0, 0);
      endTime.setTime(nextDay.getTime());
      endTime.setHours(endHour, endMinute, 0, 0);
      if (endTime < startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }
    }
    
    // Dynamic start time adjustment for same-day alarms
    effectiveStartTime = startTime;
    if (nextValidDay.toDateString() === now.toDateString() && startTime <= now && endTime > now) {
      // If start time is in the past but end time is in the future,
      // use current time as the effective start time
      effectiveStartTime = new Date(now.getTime() + 60000); // Add 1 minute buffer
    }
    
    const timeRange = endTime.getTime() - effectiveStartTime.getTime();
    const randomOffset = Math.random() * timeRange;
    const randomTime = new Date(effectiveStartTime.getTime() + randomOffset);
    
    return randomTime;
  };

  const findNextValidDay = (fromDate: Date, validDays: string[]): Date => {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let checkDate = new Date(fromDate);
    
    // Check up to 7 days to find the next valid day
    for (let i = 0; i < 7; i++) {
      const dayName = daysOfWeek[checkDate.getDay()];
      if (validDays.includes(dayName)) {
        return checkDate;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    // Fallback to tomorrow if no valid days found (shouldn't happen)
    return new Date(fromDate.getTime() + 24 * 60 * 60 * 1000);
  };
  const scheduleAlarm = (alarm: AlarmSettings) => {
    // Clear existing timeout for this alarm
    const existingTimeout = alarmTimeouts.current.get(alarm.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const nextAlarmTime = generateRandomAlarmTime(alarm);
    const timeUntilAlarm = nextAlarmTime.getTime() - Date.now();

    // Update alarm with next alarm time
    setAlarms(prev => prev.map(a => 
      a.id === alarm.id 
        ? { ...a, nextAlarmTime }
        : a
    ));

    // Schedule the alarm
    const timeout = setTimeout(() => {
      setRingingAlarm(alarm);
      if (audioRef.current) {
        audioRef.current.src = alarm.soundFile;
        audioRef.current.loop = true;
        audioRef.current.play().catch(console.error);
      }
      
      // After alarm rings, schedule the next occurrence
      setTimeout(() => {
        if (alarm.isActive) {
          scheduleAlarm(alarm);
        }
      }, 1000); // Schedule next alarm 1 second after current one rings
    }, timeUntilAlarm);

    alarmTimeouts.current.set(alarm.id, timeout);
  };

  const toggleAlarm = (id: string) => {
    setAlarms(prev => prev.map(alarm => {
      if (alarm.id === id) {
        const updatedAlarm = { ...alarm, isActive: !alarm.isActive };
        
        if (updatedAlarm.isActive) {
          // Schedule the alarm
          setTimeout(() => scheduleAlarm(updatedAlarm), 0);
        } else {
          // Clear the alarm
          const timeout = alarmTimeouts.current.get(id);
          if (timeout) {
            clearTimeout(timeout);
            alarmTimeouts.current.delete(id);
          }
          updatedAlarm.nextAlarmTime = undefined;
        }
        
        return updatedAlarm;
      }
      return alarm;
    }));
  };

  const createAlarm = () => {
    setEditingAlarm(null);
    setCurrentScreen('editor');
  };

  const editAlarm = (id: string) => {
    const alarm = alarms.find(a => a.id === id);
    if (alarm) {
      setEditingAlarm(alarm);
      setCurrentScreen('editor');
    }
  };

  const deleteAlarm = (id: string) => {
    // Clear any scheduled timeout
    const timeout = alarmTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      alarmTimeouts.current.delete(id);
    }

    setAlarms(prev => prev.filter(alarm => alarm.id !== id));
  };

  const saveAlarm = (alarmData: Omit<AlarmSettings, 'id'>) => {
    if (editingAlarm) {
      // Update existing alarm
      setAlarms(prev => prev.map(alarm => 
        alarm.id === editingAlarm.id 
          ? { ...alarm, ...alarmData, nextAlarmTime: undefined, isActive: true }
          : alarm
      ));
      
      // Clear any existing timeout for this alarm
      const timeout = alarmTimeouts.current.get(editingAlarm.id);
      if (timeout) {
        clearTimeout(timeout);
        alarmTimeouts.current.delete(editingAlarm.id);
      }
      
      // Schedule the updated alarm
      const updatedAlarm = { ...editingAlarm, ...alarmData, isActive: true };
      setTimeout(() => scheduleAlarm(updatedAlarm), 0);
    } else {
      // Create new alarm
      const newAlarm: AlarmSettings = {
        ...alarmData,
        id: Date.now().toString(),
        isActive: true,
      };
      setAlarms(prev => [...prev, newAlarm]);
      
      // Automatically schedule the new alarm
      setTimeout(() => scheduleAlarm(newAlarm), 0);
    }
    
    setCurrentScreen('list');
    setEditingAlarm(null);
  };

  const cancelEdit = () => {
    setCurrentScreen('list');
    setEditingAlarm(null);
  };

  const addCustomSound = (sound: Sound) => {
    setCustomSounds(prev => [...prev, sound]);
  };

  const removeCustomSound = (soundFile: string) => {
    setCustomSounds(prev => prev.filter(sound => sound.file !== soundFile));
    
    // If any alarm was using the removed sound, switch to default
    setAlarms(prev => prev.map(alarm => 
      alarm.soundFile === soundFile 
        ? { ...alarm, soundFile: DEFAULT_ALARM_SOUNDS[0].file }
        : alarm
    ));
    
    // Clean up the object URL to prevent memory leaks
    URL.revokeObjectURL(soundFile);
  };

  const handlePermissionsGranted = async () => {
    setShowPermissions(false);
    await requestNotificationPermission();
  };

  const stopRingingAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setRingingAlarm(null);
  };

  const snoozeAlarm = () => {
    if (!ringingAlarm) return;
    
    stopRingingAlarm();
    
    // Snooze for 5 minutes
    const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);
    setAlarms(prev => prev.map(alarm => 
      alarm.id === ringingAlarm.id 
        ? { ...alarm, nextAlarmTime: snoozeTime }
        : alarm
    ));

    const timeout = setTimeout(() => {
      setRingingAlarm(ringingAlarm);
      if (audioRef.current) {
        audioRef.current.src = ringingAlarm.soundFile;
        audioRef.current.loop = true;
        audioRef.current.play().catch(console.error);
      }
    }, 5 * 60 * 1000);

    alarmTimeouts.current.set(ringingAlarm.id, timeout);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatAlarmTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeUntilAlarm = (nextAlarmTime?: Date) => {
    if (!nextAlarmTime) return '';
    
    const now = Date.now();
    const alarmTime = nextAlarmTime.getTime();
    const diff = alarmTime - now;
    
    if (diff <= 0) return 'Alarm time!';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-6 border-b border-gray-700/50">
            <div className="flex items-center justify-center space-x-3">
              <div className="bg-purple-500/20 p-3 rounded-xl">
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">Random Alarm Clock</h1>
                <div className="text-3xl font-mono font-bold text-white mt-2">
                  {formatTime(currentTime)}
                </div>
                <div className="text-sm text-gray-400">
                  {currentTime.toLocaleDateString([], { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="p-6">
            {currentScreen === 'list' ? (
              <AlarmList
                alarms={alarms}
                onToggleAlarm={toggleAlarm}
                onEditAlarm={editAlarm}
                onDeleteAlarm={deleteAlarm}
                onCreateAlarm={createAlarm}
                formatAlarmTime={formatAlarmTime}
                getTimeUntilAlarm={getTimeUntilAlarm}
              />
            ) : (
              <AlarmEditor
                alarm={editingAlarm || undefined}
                sounds={allSounds}
                onSave={saveAlarm}
                onCancel={cancelEdit}
                onAddCustomSound={addCustomSound}
                onRemoveCustomSound={removeCustomSound}
              />
            )}
          </div>

          {/* Alarm Ringing Overlay */}
          {ringingAlarm && (
            <div className="fixed inset-0 bg-red-500/20 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gray-900/95 p-8 rounded-2xl text-center border border-red-500/50 max-w-sm mx-4">
                <div className="animate-pulse mb-4">
                  <Clock className="w-16 h-16 text-red-400 mx-auto" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{formatTime(currentTime)}</h2>
                <p className="text-red-400 mb-6">Alarm is ringing!</p>
                <div className="flex space-x-4">
                  <button
                    onClick={snoozeAlarm}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                  >
                    Snooze 5min
                  </button>
                  <button
                    onClick={stopRingingAlarm}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                  >
                    Stop
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Hidden audio element */}
        <audio ref={audioRef} preload="auto" />
        
        {/* Permission Manager */}
        {showPermissions && (
          <PermissionManager onPermissionsGranted={handlePermissionsGranted} />
        )}
      </div>
    </div>
  );
};
import React from 'react';
import { Clock, Timer } from 'lucide-react';

interface AlarmDisplayProps {
  isActive: boolean;
  nextAlarmTime?: Date;
  timeUntilAlarm: string;
  formatAlarmTime: (date: Date) => string;
}

export const AlarmDisplay: React.FC<AlarmDisplayProps> = ({
  isActive,
  nextAlarmTime,
  timeUntilAlarm,
  formatAlarmTime
}) => {
  if (!isActive || !nextAlarmTime) {
    return (
      <div className="px-6 pb-6">
        <div className="bg-gray-700/30 rounded-2xl p-4 text-center">
          <Timer className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400">No alarm set</p>
          <p className="text-sm text-gray-500">Configure your time range and start the alarm</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6">
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl p-6 border border-purple-500/30">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-medium">Alarm Active</span>
          </div>
          
          <div>
            <p className="text-gray-300 text-sm">Next alarm at</p>
            <p className="text-2xl font-mono font-bold text-white">
              {formatAlarmTime(nextAlarmTime)}
            </p>
          </div>
          
          <div>
            <p className="text-gray-300 text-sm">Time remaining</p>
            <p className="text-xl font-mono font-bold text-purple-400">
              {timeUntilAlarm}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
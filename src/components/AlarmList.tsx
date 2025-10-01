import React from 'react';
import { Clock, Edit2, Trash2, Plus } from 'lucide-react';
import { AlarmSettings } from '../types/alarm';

interface AlarmListProps {
  alarms: AlarmSettings[];
  onToggleAlarm: (id: string) => void;
  onEditAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
  onCreateAlarm: () => void;
  formatAlarmTime: (date: Date) => string;
  getTimeUntilAlarm: (nextAlarmTime?: Date) => string;
}

export const AlarmList: React.FC<AlarmListProps> = ({
  alarms,
  onToggleAlarm,
  onEditAlarm,
  onDeleteAlarm,
  onCreateAlarm,
  formatAlarmTime,
  getTimeUntilAlarm
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Your Alarms</h2>
        <button
          onClick={onCreateAlarm}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Alarm</span>
        </button>
      </div>

      {alarms.length === 0 ? (
        <div className="bg-gray-700/30 rounded-2xl p-6 text-center">
          <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No alarms set</p>
          <p className="text-sm text-gray-500">Create your first random alarm</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alarms.map((alarm) => (
            <div
              key={alarm.id}
              className={`bg-gray-700/30 rounded-2xl p-4 border transition-all ${
                alarm.isActive 
                  ? 'border-purple-500/50 bg-purple-500/10' 
                  : 'border-gray-600/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-white">{alarm.name}</h3>
                    {alarm.isActive && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400">Active</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>Range: {alarm.startTime} - {alarm.endTime}</p>
                    <p>Days: {alarm.daysOfWeek.length === 7 ? 'Every day' : 
                      alarm.daysOfWeek.length === 0 ? 'No days' :
                      alarm.daysOfWeek.map(day => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(', ')}</p>
                    {alarm.isActive && alarm.nextAlarmTime && (
                      <div className="space-y-1">
                        <p>Next: {formatAlarmTime(alarm.nextAlarmTime)}</p>
                        <p className="text-purple-400 font-mono">
                          {getTimeUntilAlarm(alarm.nextAlarmTime)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alarm.isActive}
                      onChange={() => onToggleAlarm(alarm.id)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                      alarm.isActive 
                        ? 'bg-green-500' 
                        : 'bg-gray-600'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                        alarm.isActive 
                          ? 'translate-x-5' 
                          : 'translate-x-0.5'
                      } mt-0.5`}>
                      </div>
                    </div>
                  </label>
                  
                  <button
                    onClick={() => onToggleAlarm(alarm.id)}
                    onClick={() => onEditAlarm(alarm.id)}
                    className="p-2 rounded-lg bg-gray-600/50 hover:bg-gray-500/50 text-gray-300 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => onDeleteAlarm(alarm.id)}
                    className="p-2 rounded-lg bg-red-600/20 hover:bg-red-500/30 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
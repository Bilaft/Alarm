import React, { useState, useEffect } from 'react';
import { Save, X, Calendar } from 'lucide-react';
import { AlarmSettings, Sound } from '../types/alarm';
import { TimeSelector } from './TimeSelector';
import { SoundSelector } from './SoundSelector';
import { DaySelector } from './DaySelector';

interface AlarmEditorProps {
  alarm?: AlarmSettings;
  sounds: Sound[];
  onSave: (alarm: Omit<AlarmSettings, 'id'>) => void;
  onCancel: () => void;
  onAddCustomSound: (sound: Sound) => void;
  onRemoveCustomSound: (soundFile: string) => void;
}

export const AlarmEditor: React.FC<AlarmEditorProps> = ({
  alarm,
  sounds,
  onSave,
  onCancel,
  onAddCustomSound,
  onRemoveCustomSound
}) => {
  const [name, setName] = useState(alarm?.name || '');
  const [startTime, setStartTime] = useState(alarm?.startTime || '07:00');
  const [endTime, setEndTime] = useState(alarm?.endTime || '09:00');
  const [soundFile, setSoundFile] = useState(alarm?.soundFile || sounds[0]?.file || '');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(alarm?.daysOfWeek || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);

  useEffect(() => {
    if (alarm) {
      setName(alarm.name);
      setStartTime(alarm.startTime);
      setEndTime(alarm.endTime);
      setSoundFile(alarm.soundFile);
      setDaysOfWeek(alarm.daysOfWeek);
    }
  }, [alarm]);

  const handleSave = () => {
    const alarmName = name.trim() || `Alarm ${startTime}-${endTime}`;
    
    onSave({
      name: alarmName,
      startTime,
      endTime,
      soundFile,
      isActive: false,
      daysOfWeek
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-800/50 rounded-2xl shadow-xl border border-gray-700/50 overflow-y-auto">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {alarm ? 'Edit Alarm' : 'New Alarm'}
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Alarm Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Alarm, Weekend Sleep-in (optional)"
              className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          <TimeSelector
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
          />

          <SoundSelector
            sounds={sounds}
            selectedSound={soundFile}
            onSoundChange={setSoundFile}
            onAddCustomSound={onAddCustomSound}
            onRemoveCustomSound={onRemoveCustomSound}
          />

          <DaySelector
            selectedDays={daysOfWeek}
            onDaysChange={setDaysOfWeek}
          />
        </div>

        <div className="p-6 border-t border-gray-700/50 flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Back to List</span>
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Alarm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
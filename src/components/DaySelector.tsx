import React from 'react';
import { Calendar } from 'lucide-react';

interface DaySelectorProps {
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon', fullName: 'Monday' },
  { key: 'tuesday', label: 'Tue', fullName: 'Tuesday' },
  { key: 'wednesday', label: 'Wed', fullName: 'Wednesday' },
  { key: 'thursday', label: 'Thu', fullName: 'Thursday' },
  { key: 'friday', label: 'Fri', fullName: 'Friday' },
  { key: 'saturday', label: 'Sat', fullName: 'Saturday' },
  { key: 'sunday', label: 'Sun', fullName: 'Sunday' }
];

export const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDays,
  onDaysChange
}) => {
  const toggleDay = (dayKey: string) => {
    if (selectedDays.includes(dayKey)) {
      onDaysChange(selectedDays.filter(day => day !== dayKey));
    } else {
      onDaysChange([...selectedDays, dayKey]);
    }
  };

  const selectAllDays = () => {
    onDaysChange(DAYS_OF_WEEK.map(day => day.key));
  };

  const selectWeekdays = () => {
    onDaysChange(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  };

  const selectWeekends = () => {
    onDaysChange(['saturday', 'sunday']);
  };

  const clearAll = () => {
    onDaysChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Recurring Days</h3>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={selectWeekdays}
          className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1 rounded-full transition-colors"
        >
          Weekdays
        </button>
        <button
          onClick={selectWeekends}
          className="text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1 rounded-full transition-colors"
        >
          Weekends
        </button>
        <button
          onClick={selectAllDays}
          className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-1 rounded-full transition-colors"
        >
          All Days
        </button>
        <button
          onClick={clearAll}
          className="text-xs bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-3 py-1 rounded-full transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Day Selection Grid */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS_OF_WEEK.map((day) => (
          <button
            key={day.key}
            onClick={() => toggleDay(day.key)}
            className={`p-3 rounded-xl text-sm font-medium transition-all ${
              selectedDays.includes(day.key)
                ? 'bg-purple-500/30 border-purple-500/50 text-purple-200'
                : 'bg-gray-700/30 border-gray-600/50 text-gray-300 hover:bg-gray-600/30'
            } border`}
            title={day.fullName}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Selected Days Summary */}
      <div className="text-sm text-gray-400 bg-gray-700/30 rounded-lg p-3">
        {selectedDays.length === 0 ? (
          <p>No days selected - alarm will not repeat</p>
        ) : selectedDays.length === 7 ? (
          <p>Alarm will repeat every day</p>
        ) : (
          <p>
            Alarm will repeat on: {' '}
            {selectedDays
              .map(day => DAYS_OF_WEEK.find(d => d.key === day)?.fullName)
              .join(', ')}
          </p>
        )}
      </div>
    </div>
  );
};
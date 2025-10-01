export interface AlarmSettings {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  soundFile: string;
  isActive: boolean;
  nextAlarmTime?: Date;
  daysOfWeek: string[]; // Days when alarm should be active
}

export interface Sound {
  name: string;
  file: string;
  isCustom?: boolean;
}
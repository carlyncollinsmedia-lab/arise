export type AlarmPermission = 'authorized' | 'denied' | 'notDetermined' | 'unknown';

/** A scheduled alarm as the phone reports it. days: 0 = Sunday ... 6 = Saturday. */
export type ScheduledAlarm = {
  id: string;
  hour?: number;
  minute?: number;
  days?: number[];
  fireDate?: number;
};

import { NativeModule, requireNativeModule } from 'expo';

import { AlarmPermission, ScheduledAlarm } from './AriseAlarm.types';

declare class AriseAlarmModule extends NativeModule<{}> {
  authorizationState(): AlarmPermission;
  requestAuthorization(): Promise<AlarmPermission>;
  scheduleWeekly(hour: number, minute: number, days: number[]): Promise<string>;
  scheduleOnceIn(seconds: number): Promise<string>;
  cancelAll(): number;
  list(): ScheduledAlarm[];
}

export default requireNativeModule<AriseAlarmModule>('AriseAlarm');

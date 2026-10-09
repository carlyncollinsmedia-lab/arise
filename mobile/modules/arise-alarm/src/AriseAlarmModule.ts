import { NativeModule, requireNativeModule } from 'expo';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { AlarmPermission, ScheduledAlarm } from './AriseAlarm.types';

declare class AriseAlarmNative extends NativeModule<{}> {
  authorizationState(): AlarmPermission;
  requestAuthorization(): Promise<AlarmPermission>;
  scheduleWeekly(hour: number, minute: number, days: number[]): Promise<string>;
  scheduleOnceIn(seconds: number): Promise<string>;
  cancelAll(): number;
  list(): ScheduledAlarm[];
  /** Android only: opens the settings page for exact alarms / full-screen alarms if switched off. */
  openAlarmSettingsIfNeeded?(): boolean;
}

const native = requireNativeModule<AriseAlarmNative>('AriseAlarm');

// iPhone: AlarmKit asks for permission itself. Android: an alarm needs notifications on
// (asked here), plus exact alarms and the full-screen alarm page, which are on by default.
async function requestAuthorization(): Promise<AlarmPermission> {
  if (Platform.OS !== 'android') return native.requestAuthorization();
  await Notifications.requestPermissionsAsync();
  native.openAlarmSettingsIfNeeded?.();
  return native.authorizationState();
}

const AriseAlarm = {
  authorizationState: () => native.authorizationState(),
  requestAuthorization,
  scheduleWeekly: (hour: number, minute: number, days: number[]) => native.scheduleWeekly(hour, minute, days),
  scheduleOnceIn: (seconds: number) => native.scheduleOnceIn(seconds),
  cancelAll: () => native.cancelAll(),
  list: () => native.list(),
};

export default AriseAlarm;

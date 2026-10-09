package expo.modules.arisealarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

/** Android wakes this when an alarm is due. It books the next ring, then starts the ringing. */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getStringExtra(AlarmStore.EXTRA_ID) ?: return
    if (!AlarmStore.rang(context, id)) return
    val ring = Intent(context, AlarmService::class.java).setAction(AlarmService.ACTION_RING)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(ring) else context.startService(ring)
  }
}

/** Puts the alarms back after a restart, an app update, or a clock / time-zone change. */
class RescheduleReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    AlarmStore.rearmAll(context)
  }
}

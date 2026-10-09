// Arise alarms on Android. Each alarm is saved on the phone (no internet, no sign-in)
// and handed to Android's AlarmManager as an "alarm clock", the most reliable kind:
// it rings in Doze and battery-saver, and shows the next alarm in the status bar.
// Android only remembers one ring at a time per alarm, so after each ring (and after
// a restart) we hand it the next one.

package expo.modules.arisealarm

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar
import java.util.UUID

data class AriseAlarmEntry(
  val id: String,
  val hour: Int = 0,
  val minute: Int = 0,
  val days: List<Int> = emptyList(), // 0 = Sunday ... 6 = Saturday
  val fireAt: Long? = null           // set for one-off alarms (test alarm, snooze)
)

object AlarmStore {
  private const val PREFS = "arise_alarms"
  private const val KEY = "alarms"
  const val EXTRA_ID = "arise_alarm_id"

  private fun prefs(context: Context) =
    context.createDeviceProtectedStorageContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun load(context: Context): MutableList<AriseAlarmEntry> {
    val raw = prefs(context).getString(KEY, null) ?: return mutableListOf()
    val arr = JSONArray(raw)
    return (0 until arr.length()).map { i ->
      val o = arr.getJSONObject(i)
      val d = o.optJSONArray("days") ?: JSONArray()
      AriseAlarmEntry(
        id = o.getString("id"),
        hour = o.optInt("hour"),
        minute = o.optInt("minute"),
        days = (0 until d.length()).map { d.getInt(it) },
        fireAt = if (o.has("fireAt")) o.getLong("fireAt") else null
      )
    }.toMutableList()
  }

  private fun save(context: Context, list: List<AriseAlarmEntry>) {
    val arr = JSONArray()
    list.forEach { e ->
      val o = JSONObject().put("id", e.id).put("hour", e.hour).put("minute", e.minute)
        .put("days", JSONArray(e.days))
      if (e.fireAt != null) o.put("fireAt", e.fireAt)
      arr.put(o)
    }
    prefs(context).edit().putString(KEY, arr.toString()).commit()
  }

  /** When this alarm should next ring, after [from]. */
  fun nextTrigger(e: AriseAlarmEntry, from: Long = System.currentTimeMillis()): Long {
    e.fireAt?.let { return it }
    val cal = Calendar.getInstance().apply {
      timeInMillis = from
      set(Calendar.HOUR_OF_DAY, e.hour); set(Calendar.MINUTE, e.minute)
      set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
    }
    for (i in 0..7) {
      val weekday = cal.get(Calendar.DAY_OF_WEEK) - 1 // Calendar.SUNDAY = 1
      if (cal.timeInMillis > from && (e.days.isEmpty() || weekday in e.days)) return cal.timeInMillis
      cal.add(Calendar.DAY_OF_YEAR, 1)
    }
    return cal.timeInMillis
  }

  private fun ringIntent(context: Context, id: String): PendingIntent =
    PendingIntent.getBroadcast(
      context, id.hashCode(),
      Intent(context, AlarmReceiver::class.java).putExtra(EXTRA_ID, id).setAction("arise.alarm.$id"),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

  private fun showIntent(context: Context): PendingIntent? =
    context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
      PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

  fun canScheduleExact(context: Context): Boolean {
    val am = context.getSystemService(AlarmManager::class.java)
    return Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
  }

  fun arm(context: Context, e: AriseAlarmEntry) {
    val am = context.getSystemService(AlarmManager::class.java)
    val at = nextTrigger(e)
    val op = ringIntent(context, e.id)
    if (canScheduleExact(context)) {
      am.setAlarmClock(AlarmManager.AlarmClockInfo(at, showIntent(context)), op)
    } else {
      // Exact alarms switched off by the person: still ring, Android may be a few minutes late.
      am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, op)
    }
  }

  private fun disarm(context: Context, id: String) {
    context.getSystemService(AlarmManager::class.java).cancel(ringIntent(context, id))
  }

  fun add(context: Context, e: AriseAlarmEntry): AriseAlarmEntry {
    save(context, load(context).apply { add(e) })
    arm(context, e)
    return e
  }

  fun weekly(context: Context, hour: Int, minute: Int, days: List<Int>) =
    add(context, AriseAlarmEntry(UUID.randomUUID().toString(), hour, minute, days.filter { it in 0..6 }.distinct().sorted()))

  fun onceAt(context: Context, at: Long) =
    add(context, AriseAlarmEntry(UUID.randomUUID().toString(), fireAt = at))

  fun cancelAll(context: Context): Int {
    val list = load(context)
    list.forEach { disarm(context, it.id) }
    save(context, emptyList())
    return list.size
  }

  /** Called when an alarm rings: one-off alarms are done; weekly ones get their next ring. */
  fun rang(context: Context, id: String): Boolean {
    val list = load(context)
    val e = list.find { it.id == id } ?: return false
    if (e.fireAt != null || e.days.isEmpty()) {
      list.remove(e); save(context, list)
    } else {
      val am = context.getSystemService(AlarmManager::class.java)
      val next = nextTrigger(e, System.currentTimeMillis() + 60_000)
      val op = ringIntent(context, e.id)
      if (canScheduleExact(context)) am.setAlarmClock(AlarmManager.AlarmClockInfo(next, showIntent(context)), op)
      else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, op)
    }
    return true
  }

  /** After a restart or clock change: put every alarm back; drop one-offs that were missed. */
  fun rearmAll(context: Context) {
    val now = System.currentTimeMillis()
    val list = load(context)
    val keep = list.filter { it.fireAt == null || it.fireAt > now - 60_000 }
    if (keep.size != list.size) save(context, keep)
    keep.forEach { arm(context, it) }
  }

  fun list(context: Context): List<Map<String, Any>> = load(context).map { e ->
    if (e.fireAt != null) mapOf("id" to e.id, "fireDate" to e.fireAt.toDouble())
    else mapOf("id" to e.id, "hour" to e.hour, "minute" to e.minute, "days" to e.days)
  }

  fun authorization(context: Context): String {
    val notificationsOn = context.getSystemService(NotificationManager::class.java).areNotificationsEnabled()
    return if (notificationsOn && canScheduleExact(context)) "authorized" else "denied"
  }
}

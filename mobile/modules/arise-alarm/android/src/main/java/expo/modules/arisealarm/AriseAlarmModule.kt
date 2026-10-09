// Arise alarm module, Android side. Same functions as the iPhone version
// (ios/AriseAlarmModule.swift) so the app code is shared.

package expo.modules.arisealarm

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AriseAlarmModule : Module() {
  private val context get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("AriseAlarm")

    Function("authorizationState") { AlarmStore.authorization(context) }

    // Notification permission is asked from JavaScript (expo-notifications). This opens the
    // Android settings page for anything else an alarm needs, if it is switched off.
    Function("openAlarmSettingsIfNeeded") {
      val ctx = context
      val pkg = Uri.parse("package:${ctx.packageName}")
      val nm = ctx.getSystemService(android.app.NotificationManager::class.java)
      val intent = when {
        !AlarmStore.canScheduleExact(ctx) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
          Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, pkg)
        Build.VERSION.SDK_INT >= 34 && !nm.canUseFullScreenIntent() ->
          Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, pkg)
        else -> null
      }
      intent?.let { ctx.startActivity(it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
      intent != null
    }

    AsyncFunction("requestAuthorization") { AlarmStore.authorization(context) }

    // days: 0 = Sunday ... 6 = Saturday, matching the iPhone version and the database.
    AsyncFunction("scheduleWeekly") { hour: Int, minute: Int, days: List<Int> ->
      AlarmStore.weekly(context, hour, minute, days).id
    }

    // For testing on a phone: ring once, a number of seconds from now.
    AsyncFunction("scheduleOnceIn") { seconds: Double ->
      AlarmStore.onceAt(context, System.currentTimeMillis() + (seconds * 1000).toLong()).id
    }

    Function("cancelAll") { AlarmStore.cancelAll(context) }

    Function("list") { AlarmStore.list(context) }
  }
}

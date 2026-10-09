// The full-screen "Time to rise" page that shows over the lock screen while the alarm rings.
// "I'm up" stops the alarm and opens Arise for the morning check-in; "Snooze" rings again in 9 minutes.

package expo.modules.arisealarm

import android.app.Activity
import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import java.text.DateFormat
import java.util.Date

class AlarmActivity : Activity() {
  companion object {
    const val EXTRA_IM_UP = "arise_im_up"
    const val ACTION_CLOSE = "arise.alarm.CLOSE_SCREEN"
    private val NAVY = Color.parseColor("#0B1530")
    private val GOLD = Color.parseColor("#FAC459")
  }

  private val closer = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) { finish() }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true); setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    if (intent?.getBooleanExtra(EXTRA_IM_UP, false) == true) { imUp(); return }

    val dp = resources.displayMetrics.density
    fun button(label: String, filled: Boolean, onTap: () -> Unit) = Button(this).apply {
      text = label; isAllCaps = false; textSize = 20f
      setTextColor(if (filled) NAVY else GOLD)
      background = GradientDrawable().apply {
        cornerRadius = 28 * dp
        if (filled) setColor(GOLD) else { setColor(Color.TRANSPARENT); setStroke((2 * dp).toInt(), GOLD) }
      }
      setPadding(0, (16 * dp).toInt(), 0, (16 * dp).toInt())
      layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
        .apply { topMargin = (14 * dp).toInt() }
      setOnClickListener { onTap() }
    }

    setContentView(LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setBackgroundColor(NAVY)
      setPadding((32 * dp).toInt(), 0, (32 * dp).toInt(), 0)
      addView(TextView(context).apply {
        text = "☀"; textSize = 56f; setTextColor(GOLD); gravity = Gravity.CENTER
      })
      addView(TextView(context).apply {
        text = DateFormat.getTimeInstance(DateFormat.SHORT).format(Date())
        textSize = 64f; setTextColor(Color.WHITE); gravity = Gravity.CENTER; typeface = Typeface.DEFAULT_BOLD
      })
      addView(TextView(context).apply {
        text = "Good morning. Time to rise."; textSize = 22f; setTextColor(GOLD); gravity = Gravity.CENTER
        setPadding(0, (8 * dp).toInt(), 0, (32 * dp).toInt())
      })
      addView(button("I'm up", true) { imUp() })
      addView(button("Snooze ${AlarmService.SNOOZE_MINUTES} minutes", false) { AlarmService.snooze(this@AlarmActivity); finish() })
    })

    val filter = IntentFilter(ACTION_CLOSE)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) registerReceiver(closer, filter, Context.RECEIVER_NOT_EXPORTED)
    else registerReceiver(closer, filter)
  }

  /** Stop the alarm and open Arise (asks to unlock the phone first if it is locked). */
  private fun imUp() {
    AlarmService.stop(this)
    val open = packageManager.getLaunchIntentForPackage(packageName)?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    val km = getSystemService(KeyguardManager::class.java)
    if (open != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && km.isKeyguardLocked) {
      km.requestDismissKeyguard(this, object : KeyguardManager.KeyguardDismissCallback() {
        override fun onDismissSucceeded() { startActivity(open); finish() }
        override fun onDismissCancelled() { finish() }
        override fun onDismissError() { finish() }
      })
    } else {
      open?.let { startActivity(it) }
      finish()
    }
  }

  // Back button does not silence the alarm by accident; use "I'm up" or "Snooze".
  @Deprecated("Deprecated in Java")
  override fun onBackPressed() {}

  override fun onDestroy() {
    try { unregisterReceiver(closer) } catch (_: Exception) {}
    super.onDestroy()
  }
}

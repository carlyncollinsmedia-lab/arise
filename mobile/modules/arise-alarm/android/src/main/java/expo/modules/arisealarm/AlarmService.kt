// The ringing. A foreground service so Android keeps it alive: plays the phone's alarm
// sound on the alarm volume (which Do Not Disturb lets through), vibrates, and shows a
// full-screen "Time to rise" page over the lock screen. Stops by itself after 10 minutes.

package expo.modules.arisealarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

class AlarmService : Service() {
  companion object {
    const val ACTION_RING = "arise.alarm.RING"
    const val ACTION_STOP = "arise.alarm.STOP"
    const val ACTION_SNOOZE = "arise.alarm.SNOOZE"
    const val SNOOZE_MINUTES = 9
    private const val CHANNEL = "arise_wake_up"
    private const val NOTIFICATION_ID = 7001
    private const val MAX_RING_MS = 10 * 60 * 1000L

    fun stop(context: Context) = context.startService(Intent(context, AlarmService::class.java).setAction(ACTION_STOP))
    fun snooze(context: Context) = context.startService(Intent(context, AlarmService::class.java).setAction(ACTION_SNOOZE))
  }

  private var player: MediaPlayer? = null
  private var vibrator: Vibrator? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private val handler = Handler(Looper.getMainLooper())
  private val autoStop = Runnable { stopRinging() }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> stopRinging()
      ACTION_SNOOZE -> {
        AlarmStore.onceAt(this, System.currentTimeMillis() + SNOOZE_MINUTES * 60_000L)
        stopRinging()
      }
      else -> startRinging()
    }
    return START_NOT_STICKY
  }

  private fun startRinging() {
    val notification = buildNotification()
    // "System exempted" is the foreground-service type Android and Google Play set aside
    // for alarm-clock apps that hold the exact-alarm permission.
    try {
      if (Build.VERSION.SDK_INT >= 34) {
        startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED)
      } else {
        startForeground(NOTIFICATION_ID, notification)
      }
    } catch (_: Exception) {
      // Exact alarms switched off by the person: still ring and show the notification.
      getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, notification)
    }
    if (player != null) return // already ringing
    wakeLock = getSystemService(PowerManager::class.java)
      .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "arise:alarm").apply { acquire(MAX_RING_MS + 5_000) }
    playSound()
    vibrate()
    // Some phones only show the full-screen page from the notification; others allow opening it straight away.
    try {
      startActivity(Intent(this, AlarmActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_USER_ACTION))
    } catch (_: Exception) {}
    handler.postDelayed(autoStop, MAX_RING_MS)
  }

  private fun playSound() {
    val uri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
    try {
      player = MediaPlayer().apply {
        setAudioAttributes(AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
        setDataSource(this@AlarmService, uri)
        isLooping = true
        prepare()
        start()
      }
    } catch (_: Exception) {
      // Fall back to the system ringtone player if the chosen sound can't be opened.
      try {
        RingtoneManager.getRingtone(this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))?.apply {
          audioAttributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build()
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) isLooping = true
          play()
        }
      } catch (_: Exception) {}
    }
  }

  private fun vibrate() {
    val v = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
      getSystemService(VibratorManager::class.java).defaultVibrator
    else @Suppress("DEPRECATION") getSystemService(Vibrator::class.java)
    vibrator = v
    val pattern = longArrayOf(0, 800, 600)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      v?.vibrate(VibrationEffect.createWaveform(pattern, 0),
        AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build())
    } else {
      @Suppress("DEPRECATION") v?.vibrate(pattern, 0)
    }
  }

  private fun buildNotification(): Notification {
    val nm = getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(CHANNEL, "Wake-up alarm", NotificationManager.IMPORTANCE_HIGH).apply {
        description = "The alarm that wakes you up"
        setSound(null, null) // the service plays the alarm sound itself, on the alarm volume
        enableVibration(false)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        setBypassDnd(true)
      }
      nm.createNotificationChannel(channel)
    }
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    val fullScreen = PendingIntent.getActivity(this, 1, Intent(this, AlarmActivity::class.java)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_USER_ACTION), flags)
    val imUp = PendingIntent.getActivity(this, 2, Intent(this, AlarmActivity::class.java)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK).putExtra(AlarmActivity.EXTRA_IM_UP, true), flags)
    val snooze = PendingIntent.getService(this, 3, Intent(this, AlarmService::class.java).setAction(ACTION_SNOOZE), flags)

    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Notification.Builder(this, CHANNEL)
      else @Suppress("DEPRECATION") Notification.Builder(this).setPriority(Notification.PRIORITY_MAX)
    return builder
      .setSmallIcon(applicationInfo.icon)
      .setContentTitle("Good morning. Time to rise.")
      .setContentText("Tap to open Arise")
      .setCategory(Notification.CATEGORY_ALARM)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setContentIntent(fullScreen)
      .setFullScreenIntent(fullScreen, true)
      .addAction(Notification.Action.Builder(null, "I'm up", imUp).build())
      .addAction(Notification.Action.Builder(null, "Snooze $SNOOZE_MINUTES min", snooze).build())
      .build()
  }

  private fun stopRinging() {
    handler.removeCallbacks(autoStop)
    try { player?.stop() } catch (_: Exception) {}
    player?.release(); player = null
    vibrator?.cancel(); vibrator = null
    wakeLock?.let { if (it.isHeld) it.release() }; wakeLock = null
    sendBroadcast(Intent(AlarmActivity.ACTION_CLOSE).setPackage(packageName))
    getSystemService(NotificationManager::class.java).cancel(NOTIFICATION_ID)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(STOP_FOREGROUND_REMOVE)
    else @Suppress("DEPRECATION") stopForeground(true)
    stopSelf()
  }

  override fun onDestroy() {
    handler.removeCallbacks(autoStop)
    player?.release(); player = null
    vibrator?.cancel()
    wakeLock?.let { if (it.isHeld) it.release() }
    super.onDestroy()
  }
}

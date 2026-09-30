// Arise alarm module (build step 2). Wraps only what Arise needs from Apple's
// AlarmKit: permission, a repeating weekly wake-up alarm, cancel, and list.
// The alarm is scheduled on the phone itself, so it rings with no internet,
// no sign-in, after a restart and through Do Not Disturb (spike report,
// docs/TECHNICAL-NOTES.md). Snooze needs a Live Activity widget; not yet built.

import ExpoModulesCore
import AlarmKit
import SwiftUI

struct AriseAlarmMetadata: AlarmMetadata {}

public class AriseAlarmModule: Module {
  private let weekdays: [Locale.Weekday] = [.sunday, .monday, .tuesday, .wednesday, .thursday, .friday, .saturday]

  public func definition() -> ModuleDefinition {
    Name("AriseAlarm")

    Function("authorizationState") { () -> String in
      Self.describe(AlarmManager.shared.authorizationState)
    }

    AsyncFunction("requestAuthorization") { () async throws -> String in
      Self.describe(try await AlarmManager.shared.requestAuthorization())
    }

    // days: 0 = Sunday ... 6 = Saturday, matching the prototype and the database.
    AsyncFunction("scheduleWeekly") { (hour: Int, minute: Int, days: [Int]) async throws -> String in
      let repeatDays = days.filter { (0...6).contains($0) }.map { self.weekdays[$0] }
      let schedule = Alarm.Schedule.relative(.init(
        time: .init(hour: hour, minute: minute),
        repeats: repeatDays.isEmpty ? .never : .weekly(repeatDays)))
      let alarm = try await AlarmManager.shared.schedule(
        id: UUID(), configuration: .alarm(schedule: schedule, attributes: Self.attributes()))
      return alarm.id.uuidString
    }

    // For testing on a phone: ring once, a number of seconds from now.
    AsyncFunction("scheduleOnceIn") { (seconds: Double) async throws -> String in
      let alarm = try await AlarmManager.shared.schedule(
        id: UUID(),
        configuration: .alarm(schedule: .fixed(Date().addingTimeInterval(seconds)), attributes: Self.attributes()))
      return alarm.id.uuidString
    }

    Function("cancelAll") { () -> Int in
      let alarms = (try? AlarmManager.shared.alarms) ?? []
      for alarm in alarms { try? AlarmManager.shared.cancel(id: alarm.id) }
      return alarms.count
    }

    Function("list") { () -> [[String: Any]] in
      ((try? AlarmManager.shared.alarms) ?? []).map { alarm in
        var item: [String: Any] = ["id": alarm.id.uuidString]
        switch alarm.schedule {
        case .relative(let rel):
          item["hour"] = rel.time.hour
          item["minute"] = rel.time.minute
          if case .weekly(let days) = rel.repeats {
            item["days"] = days.compactMap { self.weekdays.firstIndex(of: $0) }
          } else {
            item["days"] = [Int]()
          }
        case .fixed(let date):
          item["fireDate"] = date.timeIntervalSince1970 * 1000
        default:
          break
        }
        return item
      }
    }
  }

  private static func attributes() -> AlarmAttributes<AriseAlarmMetadata> {
    AlarmAttributes<AriseAlarmMetadata>(
      presentation: AlarmPresentation(alert: .init(title: "Good morning. Time to rise.")),
      tintColor: Color(red: 0.98, green: 0.77, blue: 0.35))
  }

  private static func describe(_ state: AlarmManager.AuthorizationState) -> String {
    switch state {
    case .authorized: return "authorized"
    case .denied: return "denied"
    case .notDetermined: return "notDetermined"
    @unknown default: return "unknown"
    }
  }
}

// Arise alarm spike (build step 0). Throwaway: proves Apple AlarmKit rings a
// locked iPhone, after a restart, in airplane mode and with Focus on.
// Not part of the real app. See docs/TECHNICAL-NOTES.md for the test report.

import SwiftUI
import AlarmKit

struct SpikeMetadata: AlarmMetadata {}

@main
struct AlarmTestApp: App {
    var body: some Scene {
        WindowGroup { ContentView() }
    }
}

@MainActor
final class AlarmModel: ObservableObject {
    @Published var status = "Checking permission…"
    @Published var scheduled: [String] = []
    private let manager = AlarmManager.shared

    func refresh() {
        switch manager.authorizationState {
        case .authorized: status = "Alarms allowed ✅"
        case .denied: status = "Alarms blocked ❌ Turn on in Settings → Alarm Test"
        case .notDetermined: status = "Not asked yet"
        @unknown default: status = "Unknown permission state"
        }
        let fmt = DateFormatter()
        fmt.timeStyle = .short
        scheduled = ((try? manager.alarms) ?? []).map { alarm in
            if case .fixed(let date) = alarm.schedule { return "Rings at \(fmt.string(from: date))" }
            return "Alarm \(alarm.id.uuidString.prefix(4))"
        }
    }

    func ring(inMinutes minutes: Double) async {
        do {
            if manager.authorizationState != .authorized {
                _ = try await manager.requestAuthorization()
            }
            guard manager.authorizationState == .authorized else { refresh(); return }
            let alert = AlarmPresentation.Alert(title: "Good morning. Time to rise.")
            let attributes = AlarmAttributes<SpikeMetadata>(
                presentation: AlarmPresentation(alert: alert),
                tintColor: Color(red: 0.98, green: 0.77, blue: 0.35))
            let fireDate = Date().addingTimeInterval(minutes * 60)
            _ = try await manager.schedule(
                id: UUID(),
                configuration: .alarm(schedule: .fixed(fireDate), attributes: attributes))
        } catch {
            status = "Could not set alarm: \(error.localizedDescription)"
        }
        refresh()
    }

    func cancelAll() {
        for alarm in (try? manager.alarms) ?? [] { try? manager.cancel(id: alarm.id) }
        refresh()
    }
}

struct ContentView: View {
    @StateObject private var model = AlarmModel()

    var body: some View {
        VStack(spacing: 18) {
            Text("Arise alarm test").font(.largeTitle.bold())
            Text(model.status).font(.headline)
            Button("Ring in 2 minutes") { Task { await model.ring(inMinutes: 2) } }
                .buttonStyle(.borderedProminent).controlSize(.large)
            Button("Ring in 10 minutes (for the restart test)") { Task { await model.ring(inMinutes: 10) } }
                .buttonStyle(.bordered).controlSize(.large)
            VStack(alignment: .leading, spacing: 6) {
                Text("Waiting to ring:").font(.subheadline.bold())
                if model.scheduled.isEmpty { Text("Nothing set").foregroundStyle(.secondary) }
                ForEach(model.scheduled, id: \.self) { Text($0) }
            }
            Button("Cancel all test alarms", role: .destructive) { model.cancelAll() }
            Spacer()
        }
        .padding(24)
        .task { model.refresh() }
    }
}

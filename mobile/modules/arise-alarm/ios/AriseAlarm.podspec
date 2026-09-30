Pod::Spec.new do |s|
  s.name           = 'AriseAlarm'
  s.version        = '1.0.0'
  s.summary        = 'Arise wake-up alarm'
  s.description    = 'Schedules the Arise morning alarm with Apple AlarmKit (iOS 26.1+).'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '26.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AlarmKit'
  s.swift_version = '5.0'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end

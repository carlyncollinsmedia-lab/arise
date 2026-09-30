// Arise only uses local notifications (reminders, evening check-in). expo-notifications
// adds the push entitlement, which free Apple developer accounts cannot sign. Remove it.
// Drop this plugin if remote push is ever added (needs the paid Apple account).
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};

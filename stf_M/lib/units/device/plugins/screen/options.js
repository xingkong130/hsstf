var syrup = require('stf-syrup')
var _ = require('lodash')

module.exports = syrup.serial()
  .define(function(options) {
    var plugin = Object.create(null)

    plugin.devicePort = 9002
    plugin.publicPort = options.screenPort
    plugin.audioPort = options.audioPort
    plugin.publicUrl = _.template(options.screenWsUrlPattern)({
      publicIp: options.publicIp
    , publicPort: plugin.publicPort
    , serial: options.serial
    })
    plugin.audioUrl = _.template(options.audioWsUrlPattern)({
      publicIp: options.publicIp
    , publicPort: plugin.audioPort
    , serial: options.serial
    })

    return plugin
  })

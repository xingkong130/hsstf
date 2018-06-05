var syrup = require('stf-syrup')
var _ = require('lodash')
var logger = require('../../../../util/logger')

module.exports = syrup.serial()
  .define(function(options) {
    var log = logger.createLogger('device:plugins:audio:options')
    log.info(options.audioPort + '++++' + options.audioWsUrlPattern + '++++' + options.publicIp + '+++' + options.audioPort + '++++' + options.serial)
    var plugin = Object.create(null)
    plugin.devicePort = 9002
    plugin.publicPort = options.audioPort
    plugin.publicUrl = _.template(options.audioWsUrlPattern)({
      publicIp: options.publicIp
    , publicPort: plugin.publicPort
    , serial: options.serial
    })
    log.info(plugin.devicePort + '----' + plugin.publicPort + '----' + plugin.publicUrl)
    return plugin
  })

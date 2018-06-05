var util = require('util')
var events = require('events')

var syrup = require('stf-syrup')
var Promise = require('bluebird')

var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var devutil = require('../../../util/devutil')
var keyutil = require('../../../util/keyutil')
var streamutil = require('../../../util/streamutil')
var logger = require('../../../util/logger')
var ms = require('../../../wire/messagestream')
var lifecycle = require('../../../util/lifecycle')

function MessageResolver() {
  this.resolvers = Object.create(null)

  this.await = function(id, resolver) {
    this.resolvers[id] = resolver
    return resolver.promise
  }

  this.resolve = function(id, value) {
    var resolver = this.resolvers[id]
    delete this.resolvers[id]
    resolver.resolve(value)
    return resolver.promise
  }
}

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../resources/audioservice'))
  .define(function(options, adb, router, push, apk) {
    var log = logger.createLogger('device:plugins:audioservice')
    var messageResolver = new MessageResolver()
    var plugin = new events.EventEmitter()

    function stopAgent() {
      return devutil.killProcsByComm(
        adb
        , options.serial
        , 'stf.agent'
        , 'stf.agent'
      )
    }

    function callService(intent) {
      return adb.shell(options.serial, util.format(
        'am start --user 0 %s'
        , intent
        ))
        .timeout(15000)
        .then(function(out) {
          return streamutil.findLine(out, /^Error/)
            .finally(function() {
              out.end()
            })
            .timeout(10000)
            .then(function(line) {
              if (line.indexOf('--user') !== -1) {
                return adb.shell(options.serial, util.format(
                  'am start %s'
                  , intent
                  ))
                  .timeout(15000)
                  .then(function() {
                    return streamutil.findLine(out, /^Error/)
                      .finally(function() {
                        out.end()
                      })
                      .timeout(10000)
                      .then(function(line) {
                        throw new Error(util.format(
                          'Service audio 1 had an error: "%s"'
                          , line
                        ))
                      })
                      .catch(streamutil.NoSuchLineError, function() {
                        return true
                      })
                  })
              }
              else {
                throw new Error(util.format(
                  'Service audio 2 had an error: "%s"'
                  , line
                ))
              }
            })
            .catch(streamutil.NoSuchLineError, function() {
              return true
            })
        })
    }

    // The APK should be up to date at this point. If it was reinstalled, the
    // service should have been automatically stopped while it was happening.
    // So, we should be good to go.
    function openService() {
      log.info('Launching audio service')
      return callService(util.format(
        "-a '%s' -n '%s'"
        , apk.startIntent.action
        , apk.startIntent.component
      ))
    }

    return openService()
  })

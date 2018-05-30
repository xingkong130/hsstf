var util = require('util')

var syrup = require('stf-syrup')
var ProtoBuf = require('protobufjs')
var semver = require('semver')

var pathutil = require('../../../util/pathutil')
var streamutil = require('../../../util/streamutil')
var promiseutil = require('../../../util/promiseutil')
var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/abi'))
  .define(function(options, adb, abi) {
    var log = logger.createLogger('device:resources:audioservice')

    var resource = {
      pkg: 'com.example.xiao.mymr',
      apk: pathutil.requiredMatch(abi.all.map(function(supportedAbi) {
        return pathutil.module(util.format(
          'miniaudio-prebuilt/prebuilt/AudioService.apk'
        ))
      }))
      ,startIntent: {
        action: 'com.example.xiao.mymr.MAIN',
      component: 'com.example.xiao.mymr/com.example.xiao.mymr.MainActivity'
      }
    }

    function getPath() {
      return adb.shell(options.serial, ['pm', 'path', resource.pkg])
        .timeout(10000)
        .then(function(out) {
          return streamutil.findLine(out, (/^package:/))
            .timeout(15000)
            .then(function(line) {
              return line.substr(8)
            })
        })
    }

    function install() {
      log.info('Checking whether we need to install AudioService')
      return getPath()
        .then(function(installedPath) {
          log.info('Running version check')
          log.info('checking----------------------------------------------- : %s', util.format("export CLASSPATH='%s';" +" exec app_process /system/bin '%s' --version 2>/dev/null", installedPath, resource.main))
          return adb.shell(options.serial, util.format(
            "export CLASSPATH='%s';" +
            " exec app_process /system/bin '%s' --version 2>/dev/null"
          , installedPath
          , resource.main
          ))
          .timeout(10000)
          .then(function(out) {
            return streamutil.readAll(out)
              .timeout(10000)
              .then(function(buffer) {
                var version = buffer.toString()
                log.info('version ---------------------------: ', version)
                if (semver.satisfies(version, resource.requiredVersion)) {
                  return installedPath
                }
                else {
                  throw new Error(util.format(
                    'Incompatible version %s'
                  , version
                  ))
                }
              })
          })
        })
        .catch(function() {
          log.info('Installing AudioService')
          // Uninstall first to make sure we don't have any certificate
          // issues.
          return adb.uninstall(options.serial, resource.pkg)
            .timeout(15000)
            .then(function() {
              return promiseutil.periodicNotify(
                  adb.install(options.serial, resource.apk)
                , 20000
                )
                .timeout(65000)
            })
            .progressed(function() {
              log.warn(
                'AudioService installation is taking a long time; ' +
                'perhaps you have to accept 3rd party app installation ' +
                'on the device?'
              )
            })
            .then(function() {
              return getPath()
            })
        })
    }

    return install()
      .then(function(path) {
        log.info('AudioService up to date')
        resource.path = path
        return resource
      })
  })

var util = require('util')

var _ = require('lodash')
var Promise = require('bluebird')
var crypto = require('crypto')
var uuid = require('uuid')
var url = require('url')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')
var deviceutil = require('../../../util/deviceutil')
var jwtutil = require('../../../util/jwtutil')
var urlutil = require('../../../util/urlutil')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var wirerouter = require('../../../wire/router')

var log = logger.createLogger('api:controllers:user')

module.exports = {
  getUser: getUser
, getUserDevices: getUserDevices
, addUserDevice: addUserDevice
, getUserDeviceBySerial: getUserDeviceBySerial
, deleteUserDeviceBySerial: deleteUserDeviceBySerial
, remoteConnectUserDeviceBySerial: remoteConnectUserDeviceBySerial
, remoteDisconnectUserDeviceBySerial: remoteDisconnectUserDeviceBySerial
, getUserAccessTokens: getUserAccessTokens
, userLogin: userLogin
, userRegister: userRegister
, bindUserDevice: bindUserDevice
}

function getUser(req, res) {
  res.json({
    success: true
  , user: req.user
  })
}

function userRegister(req, res) {
  var flag = false
  if(!req.body.name)
    flag = true
  if(!req.body.pwd)
    flag = true
  if(flag) {
    return res.status(400)
      .json({
        success: false
      , error: 'ValidationError'
      , validationErrors: 'name or password is empty'
      })
  }

  var secret = 'pwd-secret'
  var userid = uuid.v4().replace(/-/g, '')
  var pwd = crypto.createHmac('sha1', secret)
                  .update(req.body.pwd)
                  .digest('hex')
  dbapi.saveUserAfterRegister({
    id: userid
  , name: req.body.name
  , pwd: pwd
  , ip: req.ip
  })
  .then(function(data) {
    if(data && data == 'name exsit') {
      return res.status(400)
      .json({
        success: false
      , error: 'ValidationError'
      , validationErrors: 'user name exsit'
      })
    } else if(data && data.inserted) {
      //注册成功后直接绑定设备
      dbapi.bindDevice({
        userid: userid
      })
      var token = jwtutil.encode({
      payload: {
            id: userid
          , name: req.body.name
        }
      , secret: req.options.secret
      , header: {
          exp: Date.now() + 24 * 3600
        }
      })
      return res.status(200)
        .json({
          success: true
        , userid: userid
        , jwt: token
        })
    } else {
      return res.status(500)
      .json({
        success: false
      , error: 'ServerError'
      , validationErrors: 'register faild'
      })
    }
  })
  .catch(function(err) {
    log.error('Unexpected error', err.stack)
    res.status(500)
      .json({
        success: false
      , error: 'ServerError'
      })
  })
}

function userLogin(req, res) {
  var flag = false
  if(!req.body.name)
    flag = true
  if(!req.body.pwd)
    flag = true
  if(flag) {
    return res.status(400)
      .json({
        success: false
      , error: 'ValidationError'
      , validationErrors: 'name or password is empty'
      })
  }

  var secret = 'pwd-secret'
  var pwd = crypto.createHmac('sha1', secret)
                  .update(req.body.pwd)
                  .digest('hex')
  dbapi.userLogin({
    name: req.body.name
  , pwd: pwd
  })
  .then(function(data){
    if(data && util.isArray(data) && util.isString(data[0])) {
      var userid = data[0]
      dbapi.saveUserAfterLogin({
        id: userid
      , name: req.body.name
      , ip: req.ip
      })

      var token = jwtutil.encode({
      payload: {
          id: userid
          , name: req.body.name
        }
      , secret: req.options.secret
      , header: {
          exp: Date.now() + 24 * 3600
        }
      })
      res.status(200)
        .json({
          success: true
        , userid: userid
        , jwt: token
        })
    } else {
      return res.status(400)
      .json({
        success: false
      , error: 'ValidationError'
      , validationErrors: 'name not exsit or password error'
      })
    }
  })
  .catch(function(err) {
    log.error('Unexpected error', err.stack)
    res.status(500)
      .json({
        success: false
      , error: 'ServerError'
      })
  })
}

function getUserDevices(req, res) {
  var fields = req.swagger.params.fields.value

  dbapi.getUserDevices(req.user.id)
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          var deviceList = []

          list.forEach(function(device) {
            datautil.normalize(device, req.user)
            var responseDevice = device
            if (fields) {
              responseDevice = _.pick(device, fields.split(','))
            }
            deviceList.push(responseDevice)
          })

          res.json({
            success: true
          , devices: deviceList
          })
        })
    })
    .catch(function(err) {
      log.error('Failed to load device list: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getUserDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value
  var fields = req.swagger.params.fields.value

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (!device) {
        return res.status(404).json({
          success: false
        , description: 'Device not found'
        })
      }

      datautil.normalize(device, req.user)
      if (!deviceutil.isOwnedByUser(device, req.user)) {
        return res.status(403).json({
          success: false
        , description: 'Device is not owned by you'
        })
      }

      var responseDevice = device
      if (fields) {
        responseDevice = _.pick(device, fields.split(','))
      }

      res.json({
        success: true
      , device: responseDevice
      })
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function addUserDevice(req, res) {
  var serial = req.body.serial
  var timeout = req.body.timeout || null

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (!device) {
        return res.status(404).json({
          success: false
        , description: 'Device not found'
        })
      }

      datautil.normalize(device, req.user)
      if (!deviceutil.isAddable(device, req.user)) {
        return res.status(403).json({
          success: false
        , description: 'Device is being used or not available'
        })
      }

      // Timer will be called if no JoinGroupMessage is received till 5 seconds
      var responseTimer = setTimeout(function() {
        req.options.channelRouter.removeListener(wireutil.global, messageListener)
        return res.status(504).json({
            success: false
          , description: 'Device is not responding'
        })
      }, 5000)

      var messageListener = wirerouter()
        .on(wire.JoinGroupMessage, function(channel, message) {
          if (message.serial === serial && message.owner.id === req.user.id) {
            clearTimeout(responseTimer)
            req.options.channelRouter.removeListener(wireutil.global, messageListener)

            return res.json({
              success: true
            , description: 'Device successfully added'
            })
          }
        })
        .handler()

      req.options.channelRouter.on(wireutil.global, messageListener)
      var usage = 'automation'

      req.options.push.send([
        device.channel
      , wireutil.envelope(
          new wire.GroupMessage(
            new wire.OwnerMessage(
              req.user.uuid
            , req.user.name
            , req.user.group
            )
          , timeout
          , wireutil.toDeviceRequirements({
            serial: {
              value: serial
            , match: 'exact'
            }
          })
          , usage
          )
        )
      ])
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function deleteUserDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (!device) {
        return res.status(404).json({
          success: false
        , description: 'Device not found'
        })
      }

      datautil.normalize(device, req.user)
      if (!deviceutil.isOwnedByUser(device, req.user)) {
        return res.status(403).json({
          success: false
        , description: 'You cannot release this device. Not owned by you'
        })
      }

      // Timer will be called if no JoinGroupMessage is received till 5 seconds
      var responseTimer = setTimeout(function() {
        req.options.channelRouter.removeListener(wireutil.global, messageListener)
        return res.status(504).json({
            success: false
          , description: 'Device is not responding'
        })
      }, 5000)

      var messageListener = wirerouter()
        .on(wire.LeaveGroupMessage, function(channel, message) {
          if (message.serial === serial && message.owner.id === req.user.id) {
            clearTimeout(responseTimer)
            req.options.channelRouter.removeListener(wireutil.global, messageListener)

            return res.json({
              success: true
            , description: 'Device successfully removed'
            })
          }
        })
        .handler()

      req.options.channelRouter.on(wireutil.global, messageListener)

      req.options.push.send([
        device.channel
      , wireutil.envelope(
          new wire.UngroupMessage(
            wireutil.toDeviceRequirements({
              serial: {
                value: serial
              , match: 'exact'
              }
            })
          )
        )
      ])
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function remoteConnectUserDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (!device) {
        return res.status(404).json({
          success: false
        , description: 'Device not found'
        })
      }

      datautil.normalize(device, req.user)
      if (!deviceutil.isOwnedByUser(device, req.user)) {
        return res.status(403).json({
          success: false
        , description: 'Device is not owned by you or is not available'
        })
      }

      var responseChannel = 'txn_' + uuid.v4()
      req.options.sub.subscribe(responseChannel)

      // Timer will be called if no JoinGroupMessage is received till 5 seconds
      var timer = setTimeout(function() {
        req.options.channelRouter.removeListener(responseChannel, messageListener)
        req.options.sub.unsubscribe(responseChannel)
        return res.status(504).json({
            success: false
          , description: 'Device is not responding'
        })
      }, 5000)

      var messageListener = wirerouter()
        .on(wire.ConnectStartedMessage, function(channel, message) {
          if (message.serial === serial) {
            clearTimeout(timer)
            req.options.sub.unsubscribe(responseChannel)
            req.options.channelRouter.removeListener(responseChannel, messageListener)

            return res.json({
              success: true
            , remoteConnectUrl: message.url
            })
          }
        })
        .handler()

      req.options.channelRouter.on(responseChannel, messageListener)

      req.options.push.send([
        device.channel
      , wireutil.transaction(
          responseChannel
        , new wire.ConnectStartMessage()
        )
      ])
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function remoteDisconnectUserDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (!device) {
        return res.status(404).json({
          success: false
        , description: 'Device not found'
        })
      }

      datautil.normalize(device, req.user)
      if (!deviceutil.isOwnedByUser(device, req.user)) {
        return res.status(403).json({
          success: false
        , description: 'Device is not owned by you or is not available'
        })
      }

      var responseChannel = 'txn_' + uuid.v4()
      req.options.sub.subscribe(responseChannel)

      // Timer will be called if no JoinGroupMessage is received till 5 seconds
      var timer = setTimeout(function() {
        req.options.channelRouter.removeListener(responseChannel, messageListener)
        req.options.sub.unsubscribe(responseChannel)
        return res.status(504).json({
            success: false
          , description: 'Device is not responding'
        })
      }, 5000)

      var messageListener = wirerouter()
        .on(wire.ConnectStoppedMessage, function(channel, message) {
          if (message.serial === serial) {
            clearTimeout(timer)
            req.options.sub.unsubscribe(responseChannel)
            req.options.channelRouter.removeListener(responseChannel, messageListener)

            return res.json({
              success: true
            , description: 'Device remote disconnected successfully'
            })
          }
        })
        .handler()

      req.options.channelRouter.on(responseChannel, messageListener)

      req.options.push.send([
        device.channel
      , wireutil.transaction(
          responseChannel
        , new wire.ConnectStopMessage()
        )
      ])
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getUserAccessTokens(req, res) {
  dbapi.loadAccessTokens(req.user.name)
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          var titles = []
          list.forEach(function(token) {
            titles.push(token.title)
          })
          res.json({
            success: true
          , titles: titles
          })
        })
    })
    .catch(function(err) {
      log.error('Failed to load tokens: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

/** 绑定设备
   *  传入参数：userid-用户id
   */
function bindUserDevice(req, res){
  var userid = req.body.userid
  
  dbapi.bindDevice({
    userid: userid
  })
  .then(function(data) {
    if(data && data.inserted) {
      return res.json({
          success: true
        , description: 'Device successfully bind'
        })
    } else {
      return res.status(500)
      .json({
        success: false
      , description: 'Device bind failed'
      })
    }
  })
  .catch(function(err) {
    log.error('Failed to bind device: "%s": ', userid, err.stack)
    res.status(500).json({
      success: false
    })
  })
}
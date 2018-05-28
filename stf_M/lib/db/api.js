var r = require('rethinkdb')
var util = require('util')
var uuid = require('uuid')

var db = require('./')
var wireutil = require('../wire/util')

var dbapi = Object.create(null)

String.prototype.replaceAll = function(s1, s2) {
  return this.replace(new RegExp(s1, "gm"), s2)
}

dbapi.DuplicateSecondaryIndexError = function DuplicateSecondaryIndexError() {
  Error.call(this)
  this.name = 'DuplicateSecondaryIndexError'
  Error.captureStackTrace(this, DuplicateSecondaryIndexError)
}

util.inherits(dbapi.DuplicateSecondaryIndexError, Error)

dbapi.close = function(options) {
  return db.close(options)
}

dbapi.saveUserAfterRegister = function(user) {
  return db.run(r.table('users').getField('name').contains(user.name))
    .then(function(stats) {
      if (stats) {
        return 'name exsit'
      } else {
        return db.run(r.table('users').insert({
          id: user.id
        , name: user.name
        , pwd: user.pwd
        , ip: user.ip
        , group: wireutil.makePrivateChannel()
        , lastLoggedInAt: r.now()
        , createdAt: r.now()
        }))
      }
    })
}

dbapi.saveUserAfterLogin = function(user) {
    return db.run(r.table('users').get(user.id).update({
      name: user.name
    , ip: user.ip
    , lastLoggedInAt: r.now()
    }))
}

dbapi.userLogin = function(user) {
  return db.run(r.table('users').filter({name:user.name, pwd:user.pwd}).getField('id'))
    .then(function(cursor){
      return cursor.toArray()
    })
}

dbapi.loadUser = function(id) {
  return db.run(r.table('users').get(id).without(['pwd']))
}

dbapi.getUser = function(id) {
  return db.run(r.table('users').get(id).without(['pwd']))
}

dbapi.getUserDevices = function(userid) {
  return db.run(r.table('userdevices').filter({'userid':userid})
    .eqJoin('deviceid', r.table('devices')).without({'right':['id']}).zip())
}

dbapi.bindDevice = function(obj) {
  return db.run(r.table('devices').filter({'present':true}).getField('id')
        .difference(r.table('userdevices').getField('deviceid')))
    .then(function(cursor){
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('userdevices').insert({
          id: uuid.v4().replaceAll('-','')
        , userid: obj.userid
        , deviceid: idArray[0]
        , starttime: r.now()
        }))
      }
      return null
    })
}

dbapi.updateUserSettings = function(id, changes) {
  return db.run(r.table('users').get(id).update({
    settings: changes
  }))
}

dbapi.resetUserSettings = function(id) {
  return db.run(r.table('users').get(id).update({
    settings: r.literal({})
  }))
}

dbapi.insertUserAdbKey = function(id, key) {
  return db.run(r.table('users').get(id).update({
    adbKeys: r.row('adbKeys').default([]).append({
      title: key.title
    , fingerprint: key.fingerprint
    })
  }))
}

dbapi.deleteUserAdbKey = function(id, fingerprint) {
  return db.run(r.table('users').get(id).update({
    adbKeys: r.row('adbKeys').default([]).filter(function(key) {
      return key('fingerprint').ne(fingerprint)
    })
  }))
}

dbapi.lookupUsersByAdbKey = function(fingerprint) {
  return db.run(r.table('users').getAll(fingerprint, {
    index: 'adbKeys'
  }))
}

dbapi.lookupUserByAdbFingerprint = function(fingerprint) {
  return db.run(r.table('users').getAll(fingerprint, {
      index: 'adbKeys'
    })
    .pluck('id', 'name', 'group'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(groups) {
      switch (groups.length) {
        case 1:
          return groups[0]
        case 0:
          return null
        default:
          throw new Error('Found multiple users for same ADB fingerprint')
      }
    })
}

dbapi.lookupUserByVncAuthResponse = function(response, serial) {
  return db.run(r.table('vncauth').getAll([response, serial], {
      index: 'responsePerDevice'
    })
    .eqJoin('userId', r.table('users'))('right')
    .pluck('id', 'name', 'group'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(groups) {
      switch (groups.length) {
        case 1:
          return groups[0]
        case 0:
          return null
        default:
          throw new Error('Found multiple users with the same VNC response')
      }
    })
}

dbapi.loadUserDevices = function(userid) {
  return db.run(r.table('devices').getAll(userid, {
    index: 'owner'
  }))
}

dbapi.saveDeviceLog = function(serial, entry) {
  return db.run(r.table('logs').insert({
      serial: entry.serial
    , timestamp: r.epochTime(entry.timestamp)
    , priority: entry.priority
    , tag: entry.tag
    , pid: entry.pid
    , message: entry.message
    }
  , {
      durability: 'soft'
    }))
}

dbapi.saveDeviceInitialState = function(serial, device) {
  var data = {
    present: false
  , presenceChangedAt: r.now()
  , provider: device.provider
  , owner: null
  , status: device.status
  , statusChangedAt: r.now()
  , ready: false
  , reverseForwards: []
  , remoteConnect: false
  , remoteConnectUrl: null
  , usage: null
  }
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update(data))
          .then(function(stats){
            if (stats.skipped) {
              data.id = uuid.v4().replaceAll('-','')
              data.serial = serial
              data.createdAt = r.now()
              return db.run(r.table('devices').insert(data))
            }
            return stats
          })
      } else {
        data.id = uuid.v4().replaceAll('-','')
        data.serial = serial
        data.createdAt = r.now()
        return db.run(r.table('devices').insert(data))
      }
    })
}

dbapi.setDeviceConnectUrl = function(serial, url) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          remoteConnectUrl: url
        , remoteConnect: true
        }))
      }
      return null
    })
}

dbapi.unsetDeviceConnectUrl = function(serial, url) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          remoteConnectUrl: null
        , remoteConnect: false
        }))
      }
      return null
    })
}

dbapi.saveDeviceStatus = function(serial, status) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          status: status
        , statusChangedAt: r.now()
        }))
      }
      return null
    })
}

dbapi.setDeviceOwner = function(serial, owner) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          owner: owner
        }))
      }
      return null
    })
}

dbapi.unsetDeviceOwner = function(serial) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          owner: null
        }))
      }
      return null
    })
}

dbapi.setDevicePresent = function(serial) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          present: true
        , presenceChangedAt: r.now()
        }))
      }
      return null
    })
}

dbapi.setDeviceAbsent = function(serial) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          present: false
        , presenceChangedAt: r.now()
        }))
      }
      return null
    })
}

dbapi.setDeviceUsage = function(serial, usage) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          usage: usage
        , usageChangedAt: r.now()
        }))
      }
      return null
    })
}

dbapi.unsetDeviceUsage = function(serial) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          usage: null
        , usageChangedAt: r.now()
        }))
      }
      return null
    })
}

dbapi.setDeviceAirplaneMode = function(serial, enabled) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          airplaneMode: enabled
        }))
      }
      return null
    })
}

dbapi.setDeviceBattery = function(serial, battery) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          battery: {
            status: battery.status
          , health: battery.health
          , source: battery.source
          , level: battery.level
          , scale: battery.scale
          , temp: battery.temp
          , voltage: battery.voltage
          }
        }
      , {
          durability: 'soft'
        }))
      }
      return null
    })
}

dbapi.setDeviceBrowser = function(serial, browser) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          browser: {
            selected: browser.selected
          , apps: browser.apps
          }
        }))
      }
      return null
    })
}

dbapi.setDeviceConnectivity = function(serial, connectivity) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          network: {
            connected: connectivity.connected
          , type: connectivity.type
          , subtype: connectivity.subtype
          , failover: !!connectivity.failover
          , roaming: !!connectivity.roaming
          }
        }))
      }
      return null
    })
}

dbapi.setDevicePhoneState = function(serial, state) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          network: {
            state: state.state
          , manual: state.manual
          , operator: state.operator
          }
        }))
      }
      return null
    })
}

dbapi.setDeviceRotation = function(serial, rotation) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          display: {
            rotation: rotation
          }
        }))
      }
      return null
    })
}

dbapi.setDeviceNote = function(serial, note) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          notes: note
        }))
      }
      return null
    })
}

dbapi.setDeviceReverseForwards = function(serial, forwards) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          reverseForwards: forwards
        }))
      }
      return null
    })
}

dbapi.setDeviceReady = function(serial, channel) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          channel: channel
        , ready: true
        , owner: null
        , reverseForwards: []
        }))
      }
      return null
    })
}

dbapi.saveDeviceIdentity = function(serial, identity) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]).update({
          platform: identity.platform
        , manufacturer: identity.manufacturer
        , operator: identity.operator
        , model: identity.model
        , version: identity.version
        , abi: identity.abi
        , sdk: identity.sdk
        , display: identity.display
        , phone: identity.phone
        , product: identity.product
        }))
      }
      return null
    })
}

dbapi.loadDevices = function() {
  return db.run(r.table('devices'))
}

dbapi.loadPresentDevices = function() {
  return db.run(r.table('devices').getAll(true, {
    index: 'present'
  }))
}

dbapi.loadDevice = function(serial) {
  return db.run(r.table('devices').getAll(serial, {index:'serial'}).getField('id'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(idArray) {
      if(idArray && idArray.length > 0) {
        return db.run(r.table('devices').get(idArray[0]))
      }
      return null
    })
}

dbapi.getDevice = function(id) {
  return db.run(r.table('devices').get(id))
}

dbapi.saveUserAccessToken = function(name, token) {
  return db.run(r.table('accessTokens').insert({
    name: name
  , id: token.id
  , title: token.title
  , jwt: token.jwt
  }))
}

dbapi.removeUserAccessToken = function(name, title) {
  return db.run(r.table('accessTokens').getAll(name, {
    index: 'name'
  }).filter({title: title}).delete())
}

dbapi.loadAccessTokens = function(name) {
  return db.run(r.table('accessTokens').getAll(name, {
    index: 'name'
  }))
}

dbapi.loadAccessToken = function(id) {
  return db.run(r.table('accessTokens').get(id))
}

module.exports = dbapi

var r = require('rethinkdb')

module.exports = {
  users: {
    primaryKey: 'id'
  , indexes: {
      adbKeys: {
        indexFunction: function(user) {
          return user('adbKeys')('fingerprint')
        }
      , options: {
          multi: true
        }
      }
      , name: {
        indexFunction: function(user) {
          return user('name')
        }
      }
    }
  }
, accessTokens: {
    primaryKey: 'id'
  , indexes: {
      name: null
    }
  }
, vncauth: {
    primaryKey: 'password'
  , indexes: {
      response: null
    , responsePerDevice: {
        indexFunction: function(row) {
          return [row('response'), row('deviceId')]
        }
      }
    }
  }
, devices: {
    primaryKey: 'id'
  , indexes: {
      owner: {
        indexFunction: function(device) {
          return r.branch(
            device('present')
          , device('owner')('email')
          , r.literal()
          )
        }
      }
    , present: null
    , providerChannel: {
        indexFunction: function(device) {
          return device('provider')('channel')
        }
      }
    , serial: {
        indexFunction: function(device) {
          return device('serial')
        }
      }
    }
  }
, logs: {
    primaryKey: 'id'
  }
, userdevices: {
    primaryKey: 'id'
  , indexes: {
      userid: {
        indexFunction: function(userdevice) {
          return userdevice('userid')
        }
      }
    , deviceid: {
        indexFunction: function(userdevice) {
          return userdevice('deviceid')
        }
      }
    }
  }
}

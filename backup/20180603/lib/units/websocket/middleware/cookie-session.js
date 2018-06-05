var cookieSession = require('cookie-session')
var jwtutil = require('../../../util/jwtutil')

module.exports = function(options) {
  var session = cookieSession(options)

  return function(socket, next) {
    var req = socket.request
    var res = Object.create(null)
    if(req._query && req._query.jwt) {
      var jwt = req._query.jwt
      req.jwt = jwtutil.decode(jwt, options.secret)
    } 
    session(req, res, next)
  }
}

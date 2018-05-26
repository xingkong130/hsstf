var cookieSession = require('cookie-session')

module.exports = function(options) {
  var session = cookieSession(options)
  return function(socket, next) {
    var req = socket.request
    var res = Object.create(null)
    console.log(req.query)
    if(req.query.jwt) {
      req.jwt = req.query.jwt
    }
    session(req, res, next)
  }
}

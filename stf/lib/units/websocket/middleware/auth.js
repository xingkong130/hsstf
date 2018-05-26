var dbapi = require('../../../db/api')

module.exports = function(socket, next) {
  var req = socket.request
  var token = req.session.jwt ? req.session.jwt : req.query.jwt
  if (token) {
    return dbapi.loadUser(token.id)
      .then(function(user) {
        if (user) {
          req.user = user
          next()
        }
        else {
          next(new Error('Invalid user'))
        }
      })
      .catch(next)
  }
  else {
    next(new Error('Missing authorization token'))
  }
}

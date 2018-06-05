var dbapi = require('../../../db/api')

module.exports = function(socket, next) {
  var req = socket.request
  // console.log(req)
  var token = req.jwt ? req.jwt : req.session.jwt
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
    console.log('Missing authorization token')
    next(new Error('Missing authorization token'))
  }
}

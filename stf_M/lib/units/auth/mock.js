var http = require('http')

var express = require('express')
var validator = require('express-validator')
var cookieSession = require('cookie-session')
var bodyParser = require('body-parser')
var serveStatic = require('serve-static')
var csrf = require('csurf')
var Promise = require('bluebird')
var basicAuth = require('basic-auth')
var crypto = require('crypto')
var uuid = require('uuid')
var util = require('util')
var url = require('url')
//var captchapng = require('captchapng')

var logger = require('../../util/logger')
var requtil = require('../../util/requtil')
var jwtutil = require('../../util/jwtutil')
var pathutil = require('../../util/pathutil')
var urlutil = require('../../util/urlutil')
var lifecycle = require('../../util/lifecycle')
var dbapi = require('../../db/api')

String.prototype.replaceAll = function(s1, s2) {
  return this.replace(new RegExp(s1, "gm"), s2)
}

module.exports = function(options) {
  var log = logger.createLogger('auth-mock')
  var app = express()
  var server = Promise.promisifyAll(http.createServer(app))

  lifecycle.observe(function() {
    log.info('Waiting for client connections to end')
    return server.closeAsync()
      .catch(function() {
        // Okay
      })
  })

  // BasicAuth Middleware
  var basicAuthMiddleware = function(req, res, next) {
    function unauthorized(res) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
      return res.send(401)
    }

    var user = basicAuth(req)

    if (!user || !user.name || !user.pass) {
      return unauthorized(res)
    }

    if (user.name === options.mock.basicAuth.username &&
        user.pass === options.mock.basicAuth.password) {
      return next()
    }
    else {
      return unauthorized(res)
    }
  }

  app.set('view engine', 'pug')
  app.set('views', pathutil.resource('auth/mock/views'))
  app.set('strict routing', true)
  app.set('case sensitive routing', true)

  app.use(cookieSession({
    name: options.ssid
  , keys: [options.secret]
  }))
  app.use(bodyParser.json())
  app.use(csrf())
  app.use(validator())
  app.use('/static/bower_components',
    serveStatic(pathutil.resource('bower_components')))
  app.use('/static/auth/mock', serveStatic(pathutil.resource('auth/mock')))

  app.use(function(req, res, next) {
    res.cookie('XSRF-TOKEN', req.csrfToken())
    next()
  })

  if (options.mock.useBasicAuth) {
    app.use(basicAuthMiddleware)
  }

  app.get('/', function(req, res) {
    res.redirect('/auth/mock/')
  })

  app.get('/auth/mock/', function(req, res) {
    res.render('index')
  })

  app.post('/auth/api/v1/mock', function(req, res) {
    var log = logger.createLogger('auth-mock')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function() {
            req.checkBody('name').notEmpty()
            req.checkBody('email').isEmail()
          })
          .then(function() {
            log.info('Authenticated "%s"', req.body.email)
            var token = jwtutil.encode({
              payload: {
                email: req.body.email
              , name: req.body.name
              }
            , secret: options.secret
            , header: {
                exp: Date.now() + 24 * 3600
              }
            })
            res.status(200)
              .json({
                success: true
              , redirect: urlutil.addParams(options.appUrl, {
                  jwt: token
                })
              })
          })
          .catch(requtil.ValidationError, function(err) {
            res.status(400)
              .json({
                success: false
              , error: 'ValidationError'
              , validationErrors: err.errors
              })
          })
          .catch(function(err) {
            log.error('Unexpected error', err.stack)
            res.status(500)
              .json({
                success: false
              , error: 'ServerError'
              })
          })
        break
      default:
        res.send(406)
        break
    }
  })
  
  /** 获取验证码
   * 输出：Base64的图片编码
   */
  app.get('/auth/api/v1/checkcode', function(req, res) {
    var checkcode = Math.floor(Math.random()*(9999-999+1)+999)
    req.session.checkcode = checkcode
    // var p = new captchapng(80,30,parseInt(code))
    // p.color(255, 255, 255, 0)
    // p.color(80, 80, 80, 255)
    // var img = p.getBase64()
    // var imgbase64 = new Buffer(img, 'base64')
    // res.writeHead(200, { 'Content-Type': 'image/png'})
    // res.end(imgbase64)
    
    res.status(200)
    .json({
      success: true
    , checkcode: checkcode
    })
  })
  
  /** 注册
   *  传入参数：name-用户名，pwd-密码，checkcode-验证码
   */
  app.post('/auth/api/v1/register', function(req, res) {
    var log = logger.createLogger('auth-mock')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function() {
            req.checkBody('name').notEmpty()
            req.checkBody('pwd').notEmpty()
            //req.checkBody('checkcode').notEmpty()
          })
          // .then(function() {
          //   if(req.session.checkcode != req.body.checkcode) {
          //     return res.status(400)
          //       .json({
          //         success: false
          //       , error: 'ValidationError'
          //       , validationErrors: 'checkcode error'
          //       })
          //   }
          // })
          .then(function() {
            log.info('User register "%s"', req.body.name)
            var userid = uuid.v4().replaceAll('-','')
            var secret = 'pwd-secret'
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
                , secret: options.secret
                , header: {
                    exp: Date.now() + 24 * 3600
                  }
                })
                return res.status(200)
                  .json({
                    success: true
                  , userid: userid
                  , jwt: token
                  , redirect: urlutil.addParams(options.appUrl, {
                      jwt: token
                    })
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
          })
          .catch(requtil.ValidationError, function(err) {
            res.status(400)
              .json({
                success: false
              , error: 'ValidationError'
              , validationErrors: err.errors
              })
          })
          .catch(function(err) {
            log.error('Unexpected error', err.stack)
            res.status(500)
              .json({
                success: false
              , error: 'ServerError'
              })
          })
        break
      default:
        res.send(406)
        break
    }
  })
  
  /** 登录
   *  传入参数：name-用户名，pwd-密码
   */
  app.post('/auth/api/v1/login', function(req, res) {
    var log = logger.createLogger('auth-mock')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function() {
            req.checkBody('name').notEmpty()
            req.checkBody('pwd').notEmpty()
          })
          .then(function() {
            log.info('User login "%s"', req.body.name)
            if(req.session.checkcode != req.body.checkcode) {
              return res.status(400)
                .json({
                  success: false
                , error: 'ValidationError'
                , validationErrors: 'checkcode error'
                })
            }
          })
          .then(function() {
            var userid = uuid.v4().replaceAll('-', '')
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
                , secret: options.secret
                , header: {
                    exp: Date.now() + 24 * 3600
                  }
                })
                res.status(200)
                  .json({
                    success: true
                  , userid: userid
                  , jwt: token
                  , redirect: urlutil.addParams(options.appUrl, {
                      jwt: token
                    })
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
          })
          .catch(requtil.ValidationError, function(err) {
            res.status(400)
              .json({
                success: false
              , error: 'ValidationError'
              , validationErrors: err.errors
              })
          })
          .catch(function(err) {
            log.error('Unexpected error', err.stack)
            res.status(500)
              .json({
                success: false
              , error: 'ServerError'
              })
          })
        break
      default:
        res.send(406)
        break
    }
  })

  /** 注册
   *  传入参数：name-用户名，pwd-密码，checkcode-验证码
   */
  app.post('/auth/api/v1/bindDevice', function(req, res) {
    var log = logger.createLogger('auth-mock')
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function() {
            req.checkBody('userid').notEmpty()
          })
          .then(function() {
            log.info('User bindDevice "%s"', req.body.userid)
            dbapi.bindDevice({
              userid: req.body.userid
            })
            .then(function(data) {
              if(data && data.inserted) {
                return res.status(200)
                  .json({
                    success: true
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
          })
          .catch(requtil.ValidationError, function(err) {
            res.status(400)
              .json({
                success: false
              , error: 'ValidationError'
              , validationErrors: err.errors
              })
          })
          .catch(function(err) {
            log.error('Unexpected error', err.stack)
            res.status(500)
              .json({
                success: false
              , error: 'ServerError'
              })
          })
        break
      default:
        res.send(406)
        break
    }
  })

  app.post('/auth/api/v1/getDevices', function(req, res) {

    var wsUrl = url.parse(options.websocketUrl, true)
    wsUrl.query.uip = req.ip
    var websocketUrl = url.format(wsUrl)

    dbapi.getUserDevices(req.body.userid)
      .then(function(cursor) {
        return Promise.promisify(cursor.toArray, cursor)()
          .then(function(list) {
            var deviceList = []
            list.forEach(function(device) {
              //datautil.normalize(device, req.user)
              var responseDevice = device
              responseDevice.display.touchUrl = websocketUrl
              // if (fields) {
              //   responseDevice = _.pick(device, fields.split(','))
              // }
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
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}

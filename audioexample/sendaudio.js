var WebSocketServer = require('ws').Server
    , http = require('http')
    , express = require('express')
    , path = require('path')
    , net = require('net')
    , fs = require('fs')
    , app = express()
    , child_process = require('child_process');


var PORT = process.env.PORT || 7500;

app.use(express.static(path.join(__dirname, '/public')));

var server = http.createServer(app);

var wss = new WebSocketServer({server: server});

wss.on('connection', function (wsClient) {
    console.log("new client connet!");

    const fs = require('fs')
    fs.readFile('my.aac', function (err, data) {
        if (err)
            throw err;
        buf = new Buffer(data);

        for (var i = 0 ; i <  buf.length ; i+=100)
        {
            var sendbuf = buf.slice(i,i+100);
            wsClient.send(sendbuf, {binary: true});
        }
        console.log("send buf is "+buf.length);
    })
});

server.listen(PORT, "0.0.0.0", function () {
    console.info('Listening on http://localhost:%d ', PORT);
});
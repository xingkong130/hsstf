var WebSocketServer = require('ws').Server
    , http = require('http')
    , express = require('express')
    , path = require('path')
    , net = require('net')
    , fs = require('fs')
    , app = express()
    , child_process = require('child_process')
    , net = require('net')
    , WebSocket = require('ws')


var PORT = process.env.PORT || 8500;

app.use(express.static(path.join(__dirname, '/public')));

var server = http.createServer(app);

var wss = new WebSocketServer({server: server});

wss.on('connection', function (wsClient) {
    console.info("Got a  client connected 8500 port " + wsClient.protocol);


    //获取websocket的数据
    //测试代码本地测试本地
    // var miniAudioSocket = new WebSocket('ws://192.168.3.95:7500', 'minicap');
    var miniAudioSocket = new WebSocket('ws://127.0.0.1:7500', 'minicap');

    miniAudioSocket.onclose = function () {
        console.log('onclose', arguments)
    };

    miniAudioSocket.onerror = function () {
        console.log('onerror', arguments)
    };

    miniAudioSocket.onmessage = function (message) {

        wsClient.send(message.data, {
                        binary: true
                    });
        console.log(message.data.length);
    };

    ////获取socket的连接数据
    ////测试开发板上面代码

    // var miniAudioSocket = net.Socket();
    //
    // miniAudioSocket.connect('1199', '127.0.0.1', function () {
    //     console.log("Connected to miniaudio");
    // });
    //
    // function readAudio() {
    //     console.log('read miniaudio data');
    //     for (var chunk; (chunk = miniAudioSocket.read());) {
    //             wsClient.send(chunk, {
    //                             binary: true
    //                         });
    //     }
    // }
    //
    // miniAudioSocket.on('readable', readAudio);
    //
    // miniAudioSocket.on('error', function (error) {
    //     console.error('Be sure to run `adb forward tcp:1199 localabstract:minicap`\n' + error);
    // });
    //
    // miniAudioSocket.on('close', function (error) {
    //     console.warn('miniaudio exit!`\n' + error);
    // });

});

server.listen(PORT, "0.0.0.0", function () {
    console.info('Listening on http://localhost:%d ', PORT);
});

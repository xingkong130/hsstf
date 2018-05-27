var WebSocketServer = require('ws').Server
    , http = require('http')
    , express = require('express')
    , path = require('path')
    , net = require('net')
    , fs = require('fs')
    , app = express()
    , child_process = require('child_process');


var PORT = process.env.PORT || 9002;

app.use(express.static(path.join(__dirname, '/public')));

var server = http.createServer(app);

var wss = new WebSocketServer({server: server});


wss.on('connection', function (wsClient) {
    console.info("Got a  client connected 9002 port " + wsClient.protocol);
    var miniCapSocket = net.Socket();
    var miniTouchSocket = net.Socket();
    var miniAudioSocket = net.Socket();

    var banner = {
        version: 0
        , length: 0
        , pid: 0
        , realWidth: 0
        , realHeight: 0
        , virtualWidth: 0
        , virtualHeight: 0
        , orientation: 0
        , quirks: 0
    };

    switch (wsClient.protocol) {
        case 'minicap':
            connectMiniCap(wsClient, banner);
            break;
        case 'minitouch':
            connectMiniTouch(wsClient);
            break;
        case 'miniaudio':
            connectMiniAudio(wsClient);
            break;
    }

    wsClient.on('message', function (message) {
        console.log('get a  msg :' + message);
        switch (wsClient.protocol) {
            case 'minicap':
                rotaScreen(wsClient, banner, message);
                break;
            case 'minitouch':
                miniTouchSocket.write(message);
                break;
        }
    });

    wsClient.on('close', function () {
        console.info('Web Server Lost a client');
        miniCapSocket.end();
        miniTouchSocket.end();
        miniAudioSocket.end();
    });


    function connectMiniAudio(wsA) {

        miniAudioSocket.connect('1199', '127.0.0.1', function () {
            console.log("Connected to miniaudio");
        });

        function readAudio() {
            // console.log('read miniaudio data');
            for (var chunk; (chunk = miniAudioSocket.read());) {
                wsA.send(chunk, {
                    binary: true
                });
            }
        }

        miniAudioSocket.on('readable', readAudio);
        miniAudioSocket.on('error', function (error) {
            console.error('Be sure to run `adb forward tcp:1919 localabstract:minicap`\n' + error);
            process.exit(1)
        });

        miniAudioSocket.on('close',  function (error) {
            console.warn('miniaudio exit!`\n' + error);
        });
    }

    function connectMiniTouch(ws) {
        console.log('protocol ' + ws.protocol);
        ws.send("hi");
        // v 1
        // ^ 10 768 1024 0
        // $ 7486
        var miniTouchHeader = {
            version: 0,
            ax_contacts: 2,
            max_x: 0,
            max_y: 0,
            max_pressure: 0,
            pid: 0
        };
        miniTouchSocket.connect(1111, '127.0.0.1', function () {
            console.log("Connected to minitouch");
        });
        miniTouchSocket.on('data', function (data) {
            console.info('miniTouch back message data:' + data.toString());
            // [ 'v 1', '^ 10 768 1024 0', '$ 7486', '' ]
            var datas = data.toString().split("\n");
            miniTouchHeader.version = datas[0].split(" ")[1];
            var pressVal = datas[1].split(" ");
            miniTouchHeader.ax_contacts = pressVal[1];
            miniTouchHeader.max_x = pressVal[2];
            miniTouchHeader.max_y = pressVal[3];
            miniTouchHeader.max_pressure = pressVal[4];
            miniTouchHeader.pid = datas[2].split(" ")[1];

            console.log('miniTouchHeader', miniTouchHeader);
        });
        miniTouchSocket.on('error', function (error) {
            console.error('minitouch is crash ' + error.toString());
        });

        miniTouchSocket.on('close', function () {
            console.error('minitouch exit');
        })
    }

    var i_now_time = 0;
    var i_sum = 0;
    var i_fps = 1;
    var i_bitsum = 0;
    function getTime() {
        var date = new Date();

        var day = date.getDate();
        var hour = date.getHours();
        var minute = date.getMinutes();
        var second = date.getSeconds();

        var ret = day*1000000 + hour*10000 + minute*100+second;
        return ret;
    }

    function connectMiniCap(ws, banner) {

        var i_num = 0;
        var readBannerBytes = 0;
        var bannerLength = 2;
        var readFrameBytes = 0;
        var frameBodyLength = 0;
        var frameBody = new Buffer(0);
        miniCapSocket.connect(1717, '127.0.0.1', function () {
            console.log("Connected to minicap");
        });
        miniCapSocket.on('readable', tryRead);

        miniCapSocket.on('error', function (error) {
            console.error('Be sure to run `adb forward tcp:1717 localabstract:minicap`\n' + error);
            process.exit(1)
        });

        miniCapSocket.on('close', function () {
            console.warn('MiniCap exit!');
        });

        function tryRead() {
            // console.log('read minicap data');
            for (var chunk; (chunk = miniCapSocket.read());) {
                for (var cursor = 0, len = chunk.length; cursor < len;) {
                    if (readBannerBytes < bannerLength) {
                        switch (readBannerBytes) {
                            case 0:
                                // version
                                banner.version = chunk[cursor];
                                break;
                            case 1:
                                // length
                                banner.length = bannerLength = chunk[cursor];
                                break;
                            case 2:
                            case 3:
                            case 4:
                            case 5:
                                // pid
                                banner.pid += (chunk[cursor] << ((readBannerBytes - 2) * 8)) >>> 0;
                                break;
                            case 6:
                            case 7:
                            case 8:
                            case 9:
                                // real width
                                banner.realWidth += (chunk[cursor] << ((readBannerBytes - 6) * 8)) >>> 0;
                                break;
                            case 10:
                            case 11:
                            case 12:
                            case 13:
                                // real height
                                banner.realHeight += (chunk[cursor] << ((readBannerBytes - 10) * 8)) >>> 0;
                                break;
                            case 14:
                            case 15:
                            case 16:
                            case 17:
                                // virtual width
                                banner.virtualWidth += (chunk[cursor] << ((readBannerBytes - 14) * 8)) >>> 0;
                                break;
                            case 18:
                            case 19:
                            case 20:
                            case 21:
                                // virtual height
                                banner.virtualHeight += (chunk[cursor] << ((readBannerBytes - 18) * 8)) >>> 0;
                                break;
                            case 22:
                                // orientation
                                banner.orientation += chunk[cursor] * 90;
                                break;
                            case 23:
                                // quirks
                                banner.quirks = chunk[cursor];
                                break
                        }

                        cursor += 1;
                        readBannerBytes += 1;

                        if (readBannerBytes === bannerLength) {
                            console.log('banner', banner)
                        }
                    }
                    else if (readFrameBytes < 4) {
                        frameBodyLength += (chunk[cursor] << (readFrameBytes * 8)) >>> 0;
                        cursor += 1;
                        readFrameBytes += 1;
                    }
                    else {
                        if (len - cursor >= frameBodyLength) {
                            frameBody = Buffer.concat([
                                frameBody
                                , chunk.slice(cursor, cursor + frameBodyLength)
                            ]);
                            if (frameBody[0] !== 0xFF || frameBody[1] !== 0xD8) {
                                console.error('Frame body does not start with JPG header', frameBody);
                                process.exit(1)
                            }
                            i_num++;

                            i_sum++;
                            if (getTime() >  i_now_time)
                            {
                                i_now_time = getTime();
                                console.log(getTime() + " " + i_sum + " " + i_bitsum / 1000);
                                if (i_sum >= 10)
                                    i_fps = parseInt(parseInt(i_sum) / 10);

                                i_sum = 0;
                                i_bitsum = 0;
                            }

                            if (i_num % i_fps == 0) {
                                i_bitsum +=frameBody.length;
                                ws.send(frameBody, {
                                    binary: true
                                });
                            }
                            cursor += frameBodyLength;
                            frameBodyLength = readFrameBytes = 0;
                            frameBody = new Buffer(0)
                        }
                        else {
                            frameBody = Buffer.concat([
                                frameBody
                                , chunk.slice(cursor, len)
                            ]);
                            frameBodyLength -= len - cursor;
                            readFrameBytes += len - cursor;
                            cursor = len
                        }
                    }
                }
            }
        }
    }

    function rotaScreen(wsClient, banner, angle) {
        console.log('rota angle :' + angle);
        const cmd = 'adb shell exec kill -15 ' + banner.pid;
        console.log(cmd);
        execCommand(cmd, function (error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: ' + error.code);
            }
            console.log('kill success minicap ' + stdout);
            startUpMiniCapCmd(512, 768, 512, 768, angle, function (error, stdout, stderr) {
                if (error) {
                    console.error("start up minicap error " + error);
                }
                execCommand("adb forward tcp:1717 localabstract:minicap", function (error, stdout, stderr) {
                    if (error) {
                        console.error('adb forward tcp:1717 failed ');
                    }
                    connectMiniCap(wsClient, banner);
                });
                console.log("start up minicap success \n" + stdout);
            });
        });
    }

});

function execCommand(cmd, callback) {
    child_process.exec(cmd, callback)
}

function startUpMiniCapCmd(realW, realY, virtualX, virtualY, angle, cmdcallback) {
    console.log("star cmd:" + "/data/local/tmp /data/local/tmp/minicap -P " + realW + "x" + realY + "@" + virtualX + "x" + virtualY + "/" + angle + " -Q 80");
    execCommand("adb shell LD_LIBRARY_PATH=/data/local/tmp /data/local/tmp/minicap -P " + realW + "x" + realY + "@" + virtualX + "x" + virtualY + "/" + angle + " -Q 50", cmdcallback);
}

function startUpMiniTouch(callback) {
    execCommand("adb shell /data/local/tmp/minitouch", callback)
}

server.listen(PORT, "0.0.0.0", function () {
    console.info('Listening on http://localhost:%d ', PORT);
});

//execCommand("adb shell /data/local/tmp/busybox killall minicap minitouch");

// startUpMiniCapCmd(512, 768, 400, 512, 90, function (error, stdout, stderr) {
//     if (error) {
//         console.error("start up minicap error " + error);
//     }
//     console.log("start up minicap success\n" + stdout);
// });
//
// startUpMiniTouch(function (error, stdout, stderr) {
//     if (error) {
//         console.error("start up minitouch error " + error);
//     }
//     console.log("start up minitouch success \n" + stdout);
// });

execCommand("adb forward tcp:1717 localabstract:minicap");
execCommand("adb forward tcp:1199 tcp:1199");
execCommand("adb forward tcp:1111 localabstract:minitouch");

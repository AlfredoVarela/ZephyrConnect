/**
 * Created by alfredo on 8/10/16.
 */

var crc = require('crc');
var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();


ADDRESS = "E0:D7:BA:A7:F1:5D";
var results = [];
var is_stopping = false;

function connect(callback) {
    var socket = btSerial.on('found', function (address) {
        if (address == ADDRESS) {
            btSerial.findSerialPortChannel(address, function (channel) {
                btSerial.connect(address, channel, function () {
                    console.log('connected to '+ address);
                    btSerial.on('data', function (buffer) {
                        decode(buffer);
                    });
                    listener(socket,function(res) {
                        callback(res);
                    });
                }, function () {
                    console.log('cannot connect');
                });
            }, function () {
                console.log('found nothing');
            });
        }
    });
    btSerial.inquire();
}

function decode(data) {

    // console.log("*************************************");
    switch (data[1]) {
        case 35:
            // console.log("Received LifeSign message");
            break;
        case 44:
            // console.log("Received Event message");
            // console.log("HR size: " + data[8]);
            results.push(data[8]);
            break;
        case 43:
            console.log("Received Summary Data Packet");
            break;
        case 37:
            console.log("Received Accelerometer Data Packet");
            break;
        case 36:
            console.log("Received R to R Data Packet");
            break;
        case 33:
            console.log("Received Breathing Data Packet");
            break;
        default:
            console.log("Packet type: " + data[1]);
            console.log("Received Not recognised message");
            break;
    }
    // console.log("*************************************");
}

function listener(socket,callback) {

    socket.on('data', function (buffer) {
        decode(buffer);
        lifeSing = create_message_frame('100011', 0);
        socket.write(new Buffer(lifeSing), function (err, bytesWritten) {
            if (err) console.log(err);
        });
    });
    setTimeout(function() {
        stop(socket,function (res) {
            callback(res);
        });
    }, 20000);

}

function checkBin(n) {
    return /^[01]{1,64}$/.test(n)
}

function Bin2Hex(n) {
    if (!checkBin(n))return 0;
    return parseInt(n, 2).toString(16)
}

function create_message_frame(message_id, payload) {
    dlc = payload.toString().length;
    if (0 <= dlc <= 128) {
        crc_byte = crc.crc32(payload);
        message_bytes = '00000010' + message_id + dlc + payload + crc_byte + '00000011';
        message_fame = Bin2Hex(message_bytes);
        return message_fame
    }
}

function stop(socket,callback) {
    is_stopping = true;
    socket.close();
    avg(function (res) {
        callback(res);
    });

}

function avg(callback) {
    var sum = 0;
    if (is_stopping == true) {
        for (var i = 0; i < results.length; i++) {
            sum = sum + results[i];
        }
        var media = sum / results.length;
        callback(media);
    }
}

function run() {
    connect(function (res) {
        console.log("Tu HR media = " + res);
        return res;
    });
}
run();





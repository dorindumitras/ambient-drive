'use strict';
var net = require('net');
function request(op, socketPath) {
    return new Promise(function (resolve, reject) {
        var socket = net.createConnection(socketPath || '/dev/shm/dorin-ambient/control.sock');
        var buffer = '', settled = false;
        function finish(error, result) {
            if (settled) return;
            settled = true; socket.destroy();
            if (error) reject(error); else resolve(result);
        }
        socket.setTimeout(12000, function () { finish(new Error('Ambient Drive service timeout')); });
        socket.on('error', function (e) { finish(e); });
        socket.on('connect', function () { socket.write(JSON.stringify(typeof op === 'string' ? {op: op} : op) + '\n'); });
        socket.on('data', function (chunk) {
            buffer += chunk.toString('utf8');
            if (Buffer.byteLength(buffer) > 16384) return finish(new Error('Response too large'));
            var end = buffer.indexOf('\n');
            if (end < 0) return;
            try {
                var response = JSON.parse(buffer.slice(0, end));
                if (!response.ok) return finish(new Error(response.error || 'Request failed'));
                finish(null, response.status);
            } catch (e) { finish(e); }
        });
        socket.on('end', function () { if (!settled) finish(new Error('Incomplete service response')); });
    });
}
if (require.main === module) {
    var op = process.argv[2] || 'status';
    if (['status', 'enable', 'disable'].indexOf(op) < 0) {
        console.error('Usage: node client.js status|enable|disable'); process.exitCode = 1;
    } else request(op).then(function (s) { console.log(JSON.stringify(s, null, 2)); }, function (e) {
        console.error(e.message); process.exitCode = 1;
    });
}
module.exports = {request: request};

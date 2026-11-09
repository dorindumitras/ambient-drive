'use strict';
var fs = require('fs');
var path = require('path');
var net = require('net');
var controller = require('./controller');
var model = require('./model');
var socketGroup = require('./socket-group');
function mkdir(dir, mode) {
    if (fs.existsSync(dir)) return;
    mkdir(path.dirname(dir), mode);
    try { fs.mkdirSync(dir, mode); } catch (e) { if (e.code !== 'EEXIST') throw e; }
}
function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
function create(options) {
    var dir = options.stateDir, socketPath = options.socketPath;
    var generation = 0, stopping = false, connection = null;
    var profile = options.profile || require('./profile.json');
    var ready = Array.isArray(profile.pendingSignals) && profile.pendingSignals.length === 0;
    var store = require('./settings-store').create(dir), loaded = store.load(), config = loaded.value;
    var state = controller.createState(), inFlight = Promise.resolve();
    var server, worker, controlChain = Promise.resolve();
    var view = {version: '0.2.4', phase: ready ? 'disabled' : 'setup_required', mode: null, lastColor: null, confirmedByReadback: false, lastError: loaded.error};
    function status() {
        var visible = (profile.knownModes || []).concat(config.seenModes);
        var rules = Object.assign({}, config.rules);
        return Object.assign({enabled: config.enabled, telemetryReady: ready, pendingSignals: profile.pendingSignals || [],
            rules: rules, palette: Object.keys(model.colors),
            availableModes: model.modes.filter(function (m) { return visible.indexOf(m) >= 0; })}, view);
    }
    function persist(value) { config = store.save(value); }
    function observe(ctx) {
        var raw = model.baseMode(ctx && ctx.fes), active = model.resolve(ctx);
        var next = model.settings(config), changed = false;
        [raw, active].forEach(function (m) {
            if (m && next.seenModes.indexOf(m) < 0) { next.seenModes.push(m); changed = true; }
        });
        if (changed) persist(next);
    }
    function log(line) {
        (options.log || console.log)(line);
        if (line.indexOf('AUTO_MODE ') === 0) {
            view.mode = line.slice(10);
            view.phase = model.modes.indexOf(view.mode) >= 0 ? 'observing' : 'unknown_mode';
        } else if (line.indexOf('AUTO_WRITE ') === 0) {
            view.phase = 'applying'; view.confirmedByReadback = false;
        } else if (line.indexOf('AUTO_ALREADY ') === 0) {
            view.lastColor = line.slice(13); view.confirmedByReadback = true; view.phase = 'active'; view.lastError = null;
        } else if (line.indexOf('AUTO_KEEP ') === 0) view.phase = 'keep';
        else if (line.indexOf('AUTO_SKIP ') === 0) view.phase = 'ambient_off';
        else if (line.indexOf('AUTO_RESULT ') === 0) {
            var r = JSON.parse(line.slice(12));
            view.lastColor = r.color; view.confirmedByReadback = r.confirmedByReadback;
            view.phase = r.confirmedByReadback ? 'active' : 'unconfirmed';
            view.lastError = r.confirmedByReadback ? null : (r.lastReadError || 'Color change not confirmed');
        }
    }
    async function operate(req) {
        var op = req.op;
        if (op === 'status') return status();
        if (op === 'enable') {
            if (!ready) throw new Error('Telemetry setup incomplete');
            if (!config.enabled) {
                var on = model.settings(config); on.enabled = true; persist(on);
                generation++; state = controller.createState();
                view.phase = 'waiting'; view.lastError = null;
            }
        } else if (op === 'disable') {
            var off = model.settings(config); off.enabled = false; config = off; generation++;
            try { persist(off); }
            finally { await inFlight.catch(function () {}); await closeConnection(); view.phase = 'disabled'; }
        } else if (op === 'set-rule') {
            var next = model.change(config, req.mode, req.color);
            persist(next);
            if (state.observed === req.mode) { generation++; await inFlight.catch(function () {}); }
        } else throw new Error('Unsupported operation');
        return status();
    }
    function accept(socket) {
        var buffer = '', handled = false;
        socket.setTimeout(15000, function () { socket.destroy(); });
        socket.on('error', function () {});
        socket.on('data', function (chunk) {
            if (handled) return;
            buffer += chunk.toString('utf8');
            if (Buffer.byteLength(buffer) > 4096) { handled = true; socket.destroy(); return; }
            var end = buffer.indexOf('\n');
            if (end < 0) return;
            handled = true;
            var req;
            try { req = JSON.parse(buffer.slice(0, end)); if (!req || typeof req.op !== 'string') throw new Error('Bad request'); }
            catch (e) { socket.end(JSON.stringify({ok: false, error: 'Invalid JSON request'}) + '\n'); return; }
            var action;
            if (req.op === 'status') action = Promise.resolve(status());
            else {
                action = controlChain.then(function () { return operate(req); });
                controlChain = action.catch(function () {});
            }
            action.then(function (s) { socket.end(JSON.stringify({ok: true, status: s}) + '\n'); },
                function (e) { socket.end(JSON.stringify({ok: false, error: e.message}) + '\n'); });
        });
    }
    async function closeConnection() {
        if (connection) { var c = connection; connection = null; try { await c.close(); } catch (e) {} }
    }
    async function loop() {
        var errors = 0;
        while (!stopping) {
            if (!config.enabled || !ready) { await sleep(options.pollMs || 1000); continue; }
            var token = generation;
            try {
                inFlight = (async function () {
                    if (!connection) { view.phase = 'waiting'; connection = await options.driver.connect(profile); }
                    if (stopping || !config.enabled || token !== generation) return;
                    var io = {
                        readContext: connection.readContext, readColor: connection.readColor, setColor: connection.setColor,
                        running: function () { return !stopping && config.enabled && token === generation; },
                        settings: function () { return config; }, observe: observe,
                        wait: function () { return sleep(options.readbackMs || 500); }, log: log
                    };
                    await controller.step(state, io);
                    if (state.lastMode === view.mode && (view.phase === 'waiting' || view.phase === 'observing')) {
                        view.phase = view.confirmedByReadback ? 'active' : 'unconfirmed';
                    }
                })();
                await inFlight;
                errors = 0;
            } catch (e) {
                view.lastError = e.message; view.phase = 'waiting'; state.candidate = null;
                log('SERVICE_WAIT ' + String(e));
                if (++errors >= 3) { await closeConnection(); errors = 0; }
            }
            if (!config.enabled) view.phase = 'disabled';
            if (!stopping) await sleep(options.pollMs || (view.phase === 'waiting' ? 3000 : 1000));
        }
    }
    async function start() {
        var socketGid = options.socketGroup ? socketGroup.resolve(options.socketGroup) : null;
        var socketDir = path.dirname(socketPath);
        mkdir(socketDir, 0o755);
        var socketDirStat = fs.lstatSync(socketDir);
        if (!socketDirStat.isDirectory() || socketDirStat.uid !== process.getuid() || (socketDirStat.mode & 0o022)) {
            throw new Error('Socket directory is not owned and protected by this service');
        }
        fs.chmodSync(socketDir, 0o755);
        if (fs.existsSync(socketPath)) {
            var alive = await new Promise(function (resolve) {
                var s = net.createConnection(socketPath), done = false;
                function finish(v) { if (done) return; done = true; s.destroy(); resolve(v); }
                s.setTimeout(1000, function () { finish(true); });
                s.on('connect', function () { finish(true); });
                s.on('error', function (e) { finish(e.code !== 'ECONNREFUSED' && e.code !== 'ENOENT'); });
            });
            if (alive) throw new Error('Another Ambient Drive service is already running');
            if (!fs.lstatSync(socketPath).isSocket()) throw new Error('Socket path is not a socket');
            fs.unlinkSync(socketPath);
        }
        server = net.createServer(accept);
        await new Promise(function (resolve, reject) {
            server.once('error', reject);
            server.listen(socketPath, function () {
                try {
                    // SOME/IP needs the working root primary group. Give only
                    // the control socket to the OAP group, independently.
                    if (socketGid !== null) socketGroup.assign(socketPath, socketGid);
                    else fs.chmodSync(socketPath, 0o660);
                    resolve();
                } catch (e) { server.close(function () { reject(e); }); }
            });
        });
        if (config.enabled && ready) view.phase = 'waiting';
        worker = loop();
        return status();
    }
    async function stop() {
        stopping = true; generation++;
        await inFlight.catch(function () {});
        if (worker) await worker;
        await closeConnection();
        if (server) await new Promise(function (resolve) { server.close(resolve); });
    }
    return {start: start, stop: stop, status: status};
}
function main() {
    var daemon;
    try { daemon = create({stateDir: '/var/opt/dorin-ambient/state', socketPath: '/dev/shm/dorin-ambient/control.sock', socketGroup: 'tm_oap_app', driver: require('./driver')}); }
    catch (e) { console.error(e.stack); process.exit(1); }
    var ending = false;
    function end() { if (!ending) { ending = true; daemon.stop().then(function () { process.exit(0); }, function () { process.exit(1); }); } }
    process.on('SIGINT', end); process.on('SIGTERM', end);
    return daemon.start().then(function () { console.log('Ambient Drive 0.2.4 ready'); }, function (e) { console.error(e.stack); process.exit(1); });
}
if (require.main === module) main();
module.exports = {create: create, main: main};

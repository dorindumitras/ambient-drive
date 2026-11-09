'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var net = require('net');
var service = require('../native/dorin-ambient/daemon');
var client = require('../native/dorin-ambient/client');
var colors = require('./fixtures.json');
function delay(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
async function until(fn) {
    var deadline = Date.now() + 4000;
    while (!fn()) { if (Date.now() > deadline) throw new Error('Test timed out'); await delay(5); }
}
async function rejects(p, pattern) {
    return p.then(function () { throw new Error('Expected failure'); }, function (e) { assert.ok(pattern.test(e.message), e.message); });
}
async function main() {
    var root = fs.mkdtempSync('/tmp/ambient-drive-test-');
    var socket = path.join(root, 'control.sock'), stateDir = path.join(root, 'state');
    var live = {mode: 'COMFORT', color: Object.assign({}, colors.orange), writes: [], connects: 0, closes: 0, block: null};
    var daemon;
    var driver = {connect: async function () {
        if (++live.connects <= 2) throw new Error('Provider not yet available');
        return {
            readContext: function () { return Promise.resolve({fes: live.mode}); },
            readColor: function () { return Promise.resolve(live.color); },
            setColor: async function (v) {
                live.writes.push(v);
                if (live.block) await live.block;
                live.color = Object.assign({}, live.color, {
                    statusHueInteriorLighting: v.controlHueInteriorLighting,
                    statusMenuAmbientePanoramicRoofInteriorLighting: v.controlMenuAmbientePanoramicRoofInteriorLighting
                });
            },
            close: function () { live.closes++; return Promise.resolve(); }
        };
    }};
    function make() { return service.create({socketPath: socket, stateDir: stateDir, driver: driver, profile: {knownModes: ['sport','comfort','eco_pro','manual'], pendingSignals: []}, pollMs: 10, readbackMs: 1, log: function () {}}); }
    function call(op) { return client.request(op, socket); }
    try {
        daemon = make(); await daemon.start();
        assert.strictEqual((await call('status')).enabled, false);
        await delay(30); assert.strictEqual(live.connects, 0, 'Disabled startup must not load vehicle APIs');
        assert.strictEqual(fs.statSync(socket).mode & 0o777, 0o660);
        var duplicate = make();
        await rejects(duplicate.start(), /already running/);
        await rejects(call('status; arbitrary shell text'), /Unsupported operation/);
        await call('enable');
        await until(function () { return daemon.status().confirmedByReadback; });
        assert.strictEqual(live.writes.length, 1);
        assert.strictEqual(live.color.statusHueInteriorLighting, 128);
        assert.ok(live.connects >= 3, 'Service survives unavailable providers without a process restart');
        await call({op: 'set-rule', mode: 'manual', color: 'blue'});
        await call({op: 'set-rule', mode: 'sport_individual', color: null});
        await rejects(call({op:'set-rule',mode:'electric',color:null}), /Invalid/);
        assert.ok((await call('status')).availableModes.indexOf('electric') < 0);
        assert.strictEqual((await call('status')).rules.manual, 'blue');
        await rejects(call({op: 'set-rule', mode: '__proto__', color: 'blue'}), /Invalid/);
        live.mode = 'SPORT_DYNAMIC';
        await until(function () { return daemon.status().lastColor === 'orange'; });
        assert.strictEqual(live.writes.length, 2);
        var release;
        live.block = new Promise(function (resolve) { release = resolve; });
        live.mode = 'ECO_PRO_EFFICIENT';
        await until(function () { return live.writes.length === 3; });
        var done = false;
        var disabling = call('disable').then(function (s) { done = true; return s; });
        await delay(20); assert.strictEqual(done, false, 'Disable waits for an already in-flight setter');
        release();
        var off = await disabling;
        assert.strictEqual(off.enabled, false); assert.strictEqual(off.phase, 'disabled');
        assert.ok(live.closes >= 1, 'Disable releases native proxies');
        await delay(40); assert.strictEqual(live.writes.length, 3);
        assert.strictEqual(JSON.parse(fs.readFileSync(path.join(stateDir, 'settings.json'), 'utf8')).enabled, false);
        await daemon.stop(); daemon = make(); await daemon.start();
        assert.strictEqual((await call('status')).enabled, false, 'Disabled choice survives restart');
        assert.strictEqual((await call('status')).rules.manual, 'blue', 'Per-mode colors survive restart');
        assert.strictEqual((await call('status')).rules.sport_individual, null, 'STANDARD survives restart');
        live.block = null; live.mode = 'COMFORT'; live.color = Object.assign({}, colors.orange);
        await call('enable');
        await until(function () { return daemon.status().lastColor === 'green'; });
        await daemon.stop();
        var count = live.writes.length;
        daemon = make(); await daemon.start();
        assert.strictEqual((await call('status')).enabled, true, 'Enabled choice survives restart');
        await until(function () { return daemon.status().phase === 'active'; });
        assert.strictEqual(live.writes.length, count, 'Restart does not rewrite an already correct color');
        await call('disable'); await daemon.stop(); daemon = null;
        fs.writeFileSync(path.join(stateDir, 'settings.json'), '{bad JSON');
        daemon = make(); await daemon.start();
        assert.strictEqual((await call('status')).enabled, false, 'Corrupt settings fail disabled');
        assert.ok(daemon.status().lastError);
        await daemon.stop(); daemon = null;
        live.mode = 'SPORT_INDIVIDUAL';
        daemon = make(); await daemon.start(); await call('enable');
        await until(function () { return daemon.status().availableModes.indexOf('sport_individual') >= 0; });
        await call('disable'); await daemon.stop(); daemon = make(); await daemon.start();
        assert.ok((await call('status')).availableModes.indexOf('sport_individual') >= 0, 'Discovered modes survive restart');
        await daemon.stop();
        daemon = service.create({socketPath: socket, stateDir: stateDir, driver: driver,
            profile: {knownModes: ['sport','comfort','eco_pro','manual'], pendingSignals: ['manual']}, pollMs: 10, log: function () {}});
        await daemon.start();
        assert.strictEqual((await call('status')).telemetryReady, false);
        await rejects(call('enable'), /Telemetry setup incomplete/);
        console.log('OK: real Unix socket/client; disabled default; service discovery recovery; enable/disable; in-flight cancellation; persistence; single instance; corrupt settings.');
    } finally {
        if (daemon) await daemon.stop();
        if (fs.existsSync(socket)) fs.unlinkSync(socket);
        fs.readdirSync(stateDir).forEach(function (n) { fs.unlinkSync(path.join(stateDir, n)); });
        fs.rmdirSync(stateDir); fs.rmdirSync(root);
    }
}
main().catch(function (e) { console.error(e.stack); process.exitCode = 1; });

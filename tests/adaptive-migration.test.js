'use strict';
var assert = require('assert'), fs = require('fs'), path = require('path');
var service = require('../native/dorin-ambient/daemon');
var client = require('../native/dorin-ambient/client');
var fixture = require('./fixtures/settings-0.2.4.json');
var colors = require('./fixtures.json');
function delay(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
async function until(fn) {
    var deadline = Date.now() + 4000;
    while (!fn()) { if (Date.now() > deadline) throw new Error('Test timed out'); await delay(5); }
}
async function main() {
    var root = fs.mkdtempSync('/tmp/ambient-adaptive-test-'), stateDir = path.join(root, 'state');
    var socket = path.join(root, 'control.sock'), daemon;
    fs.mkdirSync(stateDir);
    var settingsFile = path.join(stateDir, 'settings.json');
    fs.writeFileSync(settingsFile, JSON.stringify(fixture));
    var live = {fes: 'ADAPTIVE', color: Object.assign({}, colors.orange), writes: [], connects: 0};
    var driver = {connect: async function () {
        live.connects++;
        return {
            readContext: function () { return Promise.resolve({fes: live.fes, manualSupported: true, manual: false}); },
            readColor: function () { return Promise.resolve(live.color); },
            setColor: function (v) {
                live.writes.push(v);
                live.color = Object.assign({}, live.color, {
                    statusHueInteriorLighting: v.controlHueInteriorLighting,
                    statusMenuAmbientePanoramicRoofInteriorLighting: v.controlMenuAmbientePanoramicRoofInteriorLighting
                });
                return Promise.resolve();
            },
            close: function () { return Promise.resolve(); }
        };
    }};
    function make() {
        return service.create({socketPath: socket, stateDir: stateDir, driver: driver,
            profile: {knownModes: ['sport', 'comfort', 'eco_pro', 'manual'], pendingSignals: []},
            pollMs: 10, readbackMs: 1, log: function () {}});
    }
    function call(req) { return client.request(req, socket); }
    async function restart() { await daemon.stop(); daemon = make(); await daemon.start(); }
    try {
        daemon = make(); await daemon.start();
        var migrated = await call('status');
        assert.strictEqual(migrated.enabled, true, 'An enabled legacy installation starts enabled');
        assert.ok(migrated.availableModes.indexOf('comfort') >= 0);
        assert.ok(migrated.availableModes.indexOf('adaptive') >= 0, 'Adaptive settings do not depend on previously observing that mode');
        assert.strictEqual(migrated.rules.comfort, 'lilac_white');
        assert.strictEqual(migrated.rules.adaptive, 'lilac_white');
        Object.keys(fixture.rules).forEach(function (mode) {
            assert.strictEqual(migrated.rules[mode], fixture.rules[mode], 'Existing rule retained: ' + mode);
        });
        await until(function () { return daemon.status().mode === 'adaptive' && daemon.status().phase === 'active'; });
        assert.strictEqual(live.color.statusMenuAmbientePanoramicRoofInteriorLighting, 'INDIVIDUALMODUS');
        await call({op: 'set-rule', mode: 'adaptive', color: 'blue_white'});
        await until(function () { return daemon.status().lastColor === 'blue_white'; });
        var saved = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        assert.strictEqual(saved.rules.comfort, 'lilac_white');
        assert.strictEqual(saved.rules.adaptive, 'blue_white');
        await call({op: 'set-rule', mode: 'comfort', color: 'orange_white'});
        var count = live.writes.length;
        await delay(60);
        assert.strictEqual(live.writes.length, count, 'Editing inactive Comfort does not issue an Adaptive command');
        await restart();
        var after = await call('status');
        assert.strictEqual(after.enabled, true);
        assert.strictEqual(after.rules.comfort, 'orange_white');
        assert.strictEqual(after.rules.adaptive, 'blue_white');
        await until(function () { return daemon.status().phase === 'active'; });
        assert.strictEqual(live.writes.length, count, 'Restart does not repeat the one-time migration or rewrite the selected color');
        live.fes = 'COMFORT';
        await until(function () { return daemon.status().lastColor === 'orange_white'; });
        live.fes = 'ADAPTIVE';
        await until(function () { return daemon.status().lastColor === 'blue_white'; });
        await call({op: 'set-rule', mode: 'adaptive', color: null});
        await until(function () { return daemon.status().phase === 'keep'; });
        await call('disable');
        count = live.writes.length;
        var connects = live.connects;
        await restart();
        after = await call('status');
        assert.strictEqual(after.enabled, false, 'Disabled state survives a restart after the split');
        assert.strictEqual(after.rules.adaptive, null, 'Adaptive STANDARD remains independent after restart');
        assert.strictEqual(after.rules.comfort, 'orange_white');
        assert.strictEqual(after.rules.manual, fixture.rules.manual);
        await delay(40);
        assert.strictEqual(live.writes.length, count);
        assert.strictEqual(live.connects, connects, 'A disabled restart does not connect to the vehicle');
        console.log('OK: real IPC and disk migration from0.2.4, both independent colors, observed mode changes, one-time copy, enabled/disabled restart, STANDARD and unchanged other rules.');
    } finally {
        if (daemon) await daemon.stop();
        fs.rmSync(root, {recursive: true, force: true});
    }
}
main().catch(function (e) { console.error(e.stack); process.exitCode = 1; });

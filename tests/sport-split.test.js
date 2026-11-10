'use strict';
var assert = require('assert'), fs = require('fs'), path = require('path');
var service = require('../native/dorin-ambient/daemon');
var client = require('../native/dorin-ambient/client');
var model = require('../native/dorin-ambient/model');
var fixture = require('./fixtures/settings-0.2.5.json');
var colors = require('./fixtures.json');
function delay(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
async function until(fn) {
    var deadline = Date.now() + 4000;
    while (!fn()) { if (Date.now() > deadline) throw new Error('Test timed out'); await delay(5); }
}
async function main() {
    var root = fs.mkdtempSync('/tmp/ambient-sport-test-'), daemon;
    var socket = path.join(root, 'control.sock'), stateDir = path.join(root, 'state');
    fs.mkdirSync(stateDir);
    var settingsFile = path.join(stateDir, 'settings.json');
    fs.writeFileSync(settingsFile, JSON.stringify(fixture));
    var live = {fes: 'SPORT_DYNAMIC', manual: false, color: Object.assign({}, colors.green), writes: [], connects: 0};
    var driver = {connect: async function () {
        live.connects++;
        return {
            readContext: async function () { return {fes: live.fes, manualSupported: true, manual: live.manual}; },
            readColor: async function () { return live.color; },
            setColor: async function (v) {
                live.writes.push(v);
                live.color = Object.assign({}, live.color, {
                    statusHueInteriorLighting: v.controlHueInteriorLighting,
                    statusMenuAmbientePanoramicRoofInteriorLighting: v.controlMenuAmbientePanoramicRoofInteriorLighting
                });
            }, close: async function () {}
        };
    }};
    function make() { return service.create({socketPath: socket, stateDir: stateDir, driver: driver,
        profile: {knownModes: ['sport', 'comfort', 'eco_pro', 'manual'], pendingSignals: []},
        pollMs: 10, readbackMs: 1, log: function () {}}); }
    function call(req) { return client.request(req, socket); }
    async function restart() { await daemon.stop(); daemon = make(); await daemon.start(); }
    try {
        daemon = make(); await daemon.start();
        var status = await call('status');
        assert.strictEqual(status.enabled, true);
        assert.deepStrictEqual(status.availableModes, model.primaryModes, 'Fresh/legacy installs expose eight ordered selectors');
        assert.strictEqual(status.rules.sport_plus, fixture.rules.sport, 'Upgrade inherits the shared Sport color');
        Object.keys(fixture.rules).forEach(function (mode) { assert.strictEqual(status.rules[mode], fixture.rules[mode]); });
        await until(function () { return daemon.status().phase === 'active'; });
        var choices = {sport: 'orange', sport_plus: 'lilac', sport_individual: 'bronze_white', comfort: 'green',
            adaptive: 'blue_white', eco_pro: 'blue', eco_pro_individual: 'green_white', manual: 'orange_white'};
        for (var mode of model.primaryModes) await call({op: 'set-rule', mode: mode, color: choices[mode]});
        var signals = {sport: 'SPORT_DYNAMIC', sport_plus: 'SPORT_EXPERT', sport_individual: 'SPORT_INDIVIDUAL',
            comfort: 'COMFORT', adaptive: 'ADAPTIVE', eco_pro: 'ECO_PRO_EFFICIENT', eco_pro_individual: 'ECO_PRO_INDIVIDUAL', manual: 'COMFORT'};
        for (var active of model.primaryModes) {
            live.fes = signals[active]; live.manual = active === 'manual';
            await until(function () { var s = daemon.status(); return s.mode === active && s.lastColor === choices[active] && s.phase === 'active'; });
        }
        live.manual = false; live.fes = 'PHEV_SPORT_PLUS';
        await until(function () { return daemon.status().mode === 'sport_plus' && daemon.status().lastColor === 'lilac'; });
        await call({op: 'set-rule', mode: 'sport_plus', color: null});
        await until(function () { return daemon.status().phase === 'keep'; });
        var count = live.writes.length;
        await call({op: 'set-rule', mode: 'sport', color: 'white'});
        await delay(60); assert.strictEqual(live.writes.length, count, 'Sport Plus STANDARD never falls back to Sport');
        var saved = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        assert.strictEqual(saved.rules.sport_plus, null); assert.strictEqual(saved.rules.sport, 'white');
        await restart();
        status = await call('status');
        assert.strictEqual(status.enabled, true);
        assert.deepStrictEqual(status.rules, saved.rules, 'Every independent color survives a service restart');
        await until(function () { return daemon.status().phase === 'keep'; });
        assert.strictEqual(live.writes.length, count);
        live.fes = 'SPORT_DYNAMIC';
        await until(function () { return daemon.status().mode === 'sport' && daemon.status().lastColor === 'white'; });
        live.fes = 'SPORT_INDIVIDUAL';
        await until(function () { return daemon.status().mode === 'sport_individual' && daemon.status().lastColor === 'bronze_white'; });
        live.fes = 'ECO_PRO_INDIVIDUAL';
        await until(function () { return daemon.status().mode === 'eco_pro_individual' && daemon.status().lastColor === 'green_white'; });
        live.fes = 'ECO_PRO_PLUS';
        await until(function () { return daemon.status().mode === 'eco_pro_plus' && daemon.status().phase === 'keep'; });
        assert.deepStrictEqual((await call('status')).availableModes, model.primaryModes.concat(['eco_pro_plus']), 'Observed extra modes follow the eight main rows');
        await call('disable'); count = live.writes.length;
        var connects = live.connects;
        await restart(); await delay(40);
        status = await call('status'); assert.strictEqual(status.enabled, false);
        assert.deepStrictEqual(status.rules, saved.rules);
        assert.strictEqual(live.writes.length, count); assert.strictEqual(live.connects, connects);
        console.log('OK:0.2.5 disk/IPC upgrade, eight independent rules, both Sport Plus signals, Individual modes, STANDARD, extra modes and enabled/disabled restart.');
    } finally { if (daemon) await daemon.stop(); fs.rmSync(root, {recursive: true, force: true}); }
}
main().catch(function (e) { console.error(e.stack); process.exitCode = 1; });

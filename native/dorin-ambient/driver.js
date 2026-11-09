'use strict';
var fs = require('fs');
var path = require('path');
var READ = 'statusAmbientLightInteriorColour';
var WRITE = 'ambientLightInteriorColour';
var MODE = 'statusFESVehicleDynamicSwitchHMI';
var COLOR_FILE = 'de_bmw_infotainment_misc_ComfortFunctionIuK.json';
var MODE_FILE = 'de_bmw_infotainment_drivingexcitement_FES.json';
var chain = Promise.resolve();
function tick(fn) {
    function run() {
        return new Promise(function (resolve, reject) {
            setImmediate(function () {
                try { Promise.resolve(fn()).then(resolve, reject); } catch (e) { reject(e); }
            });
        });
    }
    var p = chain.then(run, run);
    chain = p.catch(function () {});
    return p;
}
function find(root) {
    var files = ['oap_12206', 'oap_12203', 'oap_12223'];
    fs.readdirSync(root).filter(function (n) { return /^oap_\d+$/.test(n); }).sort().forEach(function (n) {
        if (files.indexOf(n) < 0) files.push(n);
    });
    var color, mode;
    files.forEach(function (app) {
        var dir = path.join(root, app, 'someipInterfaces');
        try {
            var c = JSON.parse(fs.readFileSync(path.join(dir, COLOR_FILE), 'utf8'));
            if (!color && c.fields[READ].getter.id === 3 && c.fields[WRITE].setter.id === 26) color = c;
        } catch (e) {}
        try {
            var m = JSON.parse(fs.readFileSync(path.join(dir, MODE_FILE), 'utf8'));
            if (!mode && m.fields[MODE].getter.id === 37) mode = m;
        } catch (e) {}
    });
    if (!color || !mode) throw new Error('Missing existing MGU color/mode interface configs');
    return {color: color, mode: mode};
}
function validPath(value) {
    return Array.isArray(value) && value.length > 0 && value.length <= 6 && value.every(function (k) {
        return typeof k === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(k) && ['__proto__','constructor','prototype'].indexOf(k) < 0;
    });
}
function bindingConfig(root, def) {
    if (!/^[A-Za-z][A-Za-z0-9_.]+$/.test(def.iface || '') || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(def.field || '') ||
        typeof def.instance !== 'string' || !validPath(def.path) ||
        (def.transport && ['getter','notification'].indexOf(def.transport) < 0) ||
        (def.transport === 'notification' && (!Number.isInteger(def.maxAgeMs) || def.maxAgeMs < 1 || def.maxAgeMs > 10000)) ||
        (def.guards && (!Array.isArray(def.guards) || def.guards.length > 4 || def.guards.some(function (g) {
            return !g || !validPath(g.path) || !Array.isArray(g.values) || !g.values.length;
        }))) ||
        !Array.isArray(def.trueValues) || !def.trueValues.length || !Array.isArray(def.falseValues) || !def.falseValues.length ||
        def.trueValues.some(function (v) { return def.falseValues.indexOf(v) >= 0; })) throw new Error('Invalid verified signal binding');
    var apps = fs.readdirSync(root).filter(function (n) { return /^oap_\d+$/.test(n); }).sort();
    for (var i = 0; i < apps.length; i++) {
        try {
            var file = path.join(root, apps[i], 'someipInterfaces', def.iface.replace(/\./g, '_') + '.json');
            var cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
            var field = (cfg.fields || {})[def.field] || (cfg.events || {})[def.field];
            if (field && (def.transport === 'notification' ? (field.event && field.event.id > 0 || (cfg.events || {})[def.field]) : field.getter && field.getter.id > 0)) return cfg;
        } catch (e) {}
    }
    throw new Error('Verified signal has no existing generated ' + (def.transport === 'notification' ? 'notification' : 'getter') + ': ' + def.iface + '.' + def.field);
}
function pathValue(value, parts) {
    var current = value;
    for (var i = 0; i < parts.length; i++) {
        if (!current || !Object.prototype.hasOwnProperty.call(current, parts[i])) return undefined;
        current = current[parts[i]];
    }
    return current;
}
function bindingValue(value, def) {
    if ((def.guards || []).some(function (g) { return g.values.indexOf(pathValue(value,g.path)) < 0; })) return undefined;
    var current = pathValue(value,def.path);
    if (def.trueValues.indexOf(current) >= 0) return true;
    if (def.falseValues.indexOf(current) >= 0) return false;
    return undefined;
}
function notificationValue(state,def,now) {
    if (state.closed || state.available === false || !state.latest || now < state.receivedAt || now-state.receivedAt > def.maxAgeMs) return undefined;
    return bindingValue(state.latest,def);
}
async function connect(profile) {
    var native = require('/usr/lib/someip.node');
    var cfg = find('/var/opt/public/oap'), proxies = [], stops = [];
    async function open(c, instance) {
        var p = await tick(function () { return native.buildProxy(c, instance || '1'); });
        proxies.push(p);
        await tick(function () { return p.init(); });
        return p;
    }
    async function close() {
        stops.forEach(function (fn) { fn(); });
        for (var i = proxies.length - 1; i >= 0; i--) {
            try { if (proxies[i].shutdown) await tick(function () { return proxies[i].shutdown(); }); } catch (e) {}
        }
    }
    try {
        var light = await open(cfg.color), mode = await open(cfg.mode);
        async function bind(def) {
            if (!def) return null;
            var p = await open(bindingConfig('/var/opt/public/oap', def), def.instance);
            if (def.transport === 'notification') {
                var state = {latest:null,receivedAt:0,available:null,closed:false};
                stops.push(function () { state.closed = true; state.latest = null; });
                if (typeof p.subscribeToAvailability === 'function') {
                    await tick(function () { return p.subscribeToAvailability(function (available) {
                        state.available = !!available; if (!available) state.latest = null;
                    }); });
                }
                await tick(function () { return p.subscribe({name:def.field,onReceive:function (value) {
                    if (state.closed) return;
                    try { state.latest = JSON.parse(JSON.stringify(value)); state.receivedAt = Date.now(); }
                    catch (e) { state.latest = null; }
                }}); });
                return function () { return Promise.resolve(notificationValue(state,def,Date.now())); };
            }
            return async function () { return bindingValue(await tick(function () { return p.getValue(def.field, 2000); }), def); };
        }
        var manual = await bind(profile && profile.bindings && profile.bindings.manual);
        return {
            readContext: async function () {
                var s = await tick(function () { return mode.getValue(MODE, 2000); });
                return {fes: s.actualValueModeDrivingExperience, manualSupported: !!manual, manual: manual ? await manual() : false};
            },
            readColor: function () { return tick(function () { return light.getValue(READ, 2000); }); },
            setColor: function (v) { return tick(function () { return light.setValue(WRITE, v, 4000); }); },
            close: close
        };
    } catch (e) { await close(); throw e; }
}
module.exports = {connect: connect, find: find, bindingValue: bindingValue, bindingConfig: bindingConfig, notificationValue: notificationValue};

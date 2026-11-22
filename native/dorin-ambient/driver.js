'use strict';
var fs = require('fs');
var path = require('path');
var READ = 'statusAmbientLightInteriorColour';
var WRITE = 'ambientLightInteriorColour';
var MODE = 'statusFESVehicleDynamicSwitchHMI';
var MODE_VALUE = 'actualValueModeDrivingExperience';
var MODE_EVENT_MAX_AGE_MS = 5000;
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
    var color, mode, eventMode;
    files.forEach(function (app) {
        var dir = path.join(root, app, 'someipInterfaces');
        try {
            var c = JSON.parse(fs.readFileSync(path.join(dir, COLOR_FILE), 'utf8'));
            if (!color && c.fields[READ].getter.id === 3 && c.fields[WRITE].setter.id === 26) color = c;
        } catch (e) {}
        try {
            var m = JSON.parse(fs.readFileSync(path.join(dir, MODE_FILE), 'utf8'));
            var f = m.fields[MODE];
            if (!mode && f.getter && f.getter.id === 37) mode = m;
            if (!eventMode && f.event && f.event.id === 32805) eventMode = m;
        } catch (e) {}
    });
    mode = mode || eventMode;
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
function freshNotification(state, maxAgeMs, now) {
    var age = now - state.receivedAt;
    if (!state.closed && state.available !== false && age >= 0 && age <= maxAgeMs) return state.latest;
}
function notificationValue(state,def,now) {
    return bindingValue(freshNotification(state,def.maxAgeMs,now),def);
}
function modeName(raw, field) {
    var value = raw && raw[MODE_VALUE];
    if (typeof value === 'string' && /^[A-Za-z_][A-Za-z_0-9]*$/.test(value)) return value.toUpperCase();
    if (typeof value === 'string' && /^\d{1,3}$/.test(value)) value = Number(value);
    if (!Number.isInteger(value)) return undefined;
    var schema = field.schema;
    var entry = schema && schema.t === 'Struct' && Array.isArray(schema.e) && schema.e.find(function (e) {
        return e.n === MODE_VALUE && e.t === 'Enum';
    });
    if (!entry || !entry.e) return undefined;
    var matches = Object.keys(entry.e).filter(function (name) { return entry.e[name] === value; });
    return matches.length === 1 ? matches[0] : undefined;
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
            await shutdown(proxies[i]);
        }
    }
    async function shutdown(proxy) {
        try { if (proxy.shutdown) await tick(function () { return proxy.shutdown(); }); } catch (e) {}
    }
    async function watch(proxy, field, decode, maxAgeMs) {
        var state = {latest: undefined, receivedAt: 0, available: null, closed: false};
        var stop = function () { state.closed = true; state.latest = undefined; };
        try {
            if (typeof proxy.subscribeToAvailability === 'function') {
                await tick(function () { return proxy.subscribeToAvailability(function (available) {
                    state.available = !!available;
                    if (!available) state.latest = undefined;
                }); });
            }
            await tick(function () { return proxy.subscribe({name:field,onReceive:function (value) {
                if (state.closed) return;
                try { state.latest = decode(value); state.receivedAt = Date.now(); }
                catch (e) { state.latest = undefined; }
            }}); });
        } catch (e) { stop(); throw e; }
        stops.push(stop);
        return function () { return freshNotification(state,maxAgeMs,Date.now()); };
    }
    try {
        var light = await open(cfg.color), mode = await open(cfg.mode);
        var field = cfg.mode.fields[MODE];
        var getter = field.getter && field.getter.id === 37;
        var modeEvent, preferEvent = !getter;
        if (field.event && field.event.id === 32805) {
            try { modeEvent = await watch(mode, MODE, function (raw) { return modeName(raw, field); }, MODE_EVENT_MAX_AGE_MS); }
            catch (e) { if (!getter) throw e; }
        }
        async function readMode() {
            var notified = modeEvent && modeEvent();
            if (preferEvent && notified !== undefined) return {fes:notified, source:'notification'};
            if (!getter) return {fes:undefined, source:null};
            try {
                var raw = await tick(function () { return mode.getValue(MODE, 2000); });
                preferEvent = false;
                return {fes:modeName(raw, field), source:'getter'};
            } catch (e) {
                preferEvent = true;
                notified = modeEvent && modeEvent();
                if (notified !== undefined) return {fes:notified, source:'notification'};
                throw e;
            }
        }
        async function bind(def) {
            if (!def) return null;
            var count = proxies.length;
            try {
                var p = await open(bindingConfig('/var/opt/public/oap', def), def.instance);
                if (def.transport === 'notification') return await watch(p, def.field, function (v) {
                    return bindingValue(v, def);
                }, def.maxAgeMs);
                return async function () { return bindingValue(await tick(function () { return p.getValue(def.field, 2000); }), def); };
            } catch (e) {
                if (proxies.length > count) await shutdown(proxies.pop());
                return null;
            }
        }
        var bindings = profile && profile.bindings || {};
        var primaryManual = await bind(bindings.manual), secondaryManual = await bind(bindings.manualFallback);
        async function readManual() {
            var primary, secondary;
            try { if (primaryManual) primary = await primaryManual(); } catch (e) {}
            if (typeof primary === 'boolean') return {value:primary, source:'powertrain'};
            try { if (secondaryManual) secondary = await secondaryManual(); } catch (e) {}
            if (typeof secondary === 'boolean') return {value:secondary, source:'mdrive'};
            return {value:undefined, source:null};
        }
        return {
            readContext: async function () {
                var s = await readMode(), manual = await readManual();
                return {fes:s.fes, modeSource:s.source, manualSupported:!!(bindings.manual || bindings.manualFallback),
                    manual:manual.value, manualSource:manual.source};
            },
            readColor: function () { return tick(function () { return light.getValue(READ, 2000); }); },
            setColor: function (v) { return tick(function () { return light.setValue(WRITE, v, 4000); }); },
            close: close
        };
    } catch (e) { await close(); throw e; }
}
module.exports = {connect: connect, find: find, bindingValue: bindingValue, bindingConfig: bindingConfig,
    notificationValue: notificationValue, modeName: modeName};

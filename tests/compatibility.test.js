'use strict';

var assert = require('assert');
var fs = require('fs');
var vm = require('vm');
var profile = require('../native/dorin-ambient/profile.json');
var source = fs.readFileSync(__dirname + '/../native/dorin-ambient/driver.js', 'utf8');
var frames = require('./ms-live-13.json');
var modeField = 'statusFESVehicleDynamicSwitchHMI';
var modeValue = 'actualValueModeDrivingExperience';

function fixture(options) {
    options = options || {};
    var getter = options.eventOnly ? {} : {getter: {id:37}};
    var configs = {
        color: {name:'color', fields:{
            statusAmbientLightInteriorColour:{getter:{id:3}}, ambientLightInteriorColour:{setter:{id:26}}
        }},
        mode: {name:'mode', fields:{}},
        primary: {name:'primary', fields:{dataDisplayGearboxSecure:{event:{id:32775}}}},
        secondary: {name:'secondary', fields:{dataDisplayGearbox:{event:{id:32833}}}},
    };
    configs.mode.fields[modeField] = Object.assign(getter,{
        event:{id:32805},schema:{t:'Struct',e:[{n:modeValue,t:'Enum',e:{
            COMFORT:4, SPORT_DYNAMIC:1, ECO_PRO_EFFICIENT:7, SIGNAL_UNBEFUELLT:63
        }}]}
    });
    var files = {
        de_bmw_infotainment_misc_ComfortFunctionIuK: 'color',
        de_bmw_infotainment_drivingexcitement_FES: 'mode',
        de_bmw_powertrain_Powertrain: 'primary',
        de_bmw_infotainment_misc_MDrive: 'secondary'
    };
    var now = 1000, reads = 0, failRead = false, notifications = {}, availability = {}, closed = [];
    var module0 = {exports:{}};
    var native = {buildProxy:function(config) {
        return {
            init:function() { if (options.failPrimary && config.name==='primary') throw Error('M/S provider unavailable'); },
            subscribeToAvailability:function(cb) { availability[config.name]=cb; cb(true); },
            subscribe:function(request) {
                assert.ok(config.fields[request.name].event);
                notifications[config.name]=request.onReceive;
            },
            getValue:function(field) {
                assert.strictEqual(config.name,'mode');
                assert.strictEqual(field,modeField);
                reads++;
                if (failRead) throw Error('FES getter unavailable');
                return {actualValueModeDrivingExperience:4};
            },
            shutdown:function() { closed.push(config.name); }
        };
    }};
    vm.runInNewContext(source,{
        module:module0, setImmediate:setImmediate, Date:{now:function(){return now;}},
        require:function(name) {
            if (name==='/usr/lib/someip.node') return native;
            if (name==='fs') return {
                readdirSync:function(){return ['oap_12206'];},
                readFileSync:function(filename) {
                    var key = files[filename.split('/').pop().slice(0,-5)];
                    if (!key) throw Error('No config');
                    return JSON.stringify(configs[key]);
                }
            };
            return require(name);
        }
    });
    var driver = module0.exports;
    return {
        connect:function(){return driver.connect(profile);},
        modeField:configs.mode.fields[modeField],
        modeName:driver.modeName,
        failGetter:function() { failRead=true; },
        passes:function(ms) { now+=ms; },
        receive:notifications, availability:availability, closed:closed,
        reads:function(){return reads;}
    };
}

async function main() {
    var f = fixture(), io = await f.connect();
    var first = await io.readContext();
    assert.strictEqual(first.fes,'COMFORT');
    assert.strictEqual(first.modeSource,'getter');
    assert.strictEqual(first.manual,undefined,'An available proxy is not a valid M/S sample');
    assert.strictEqual(f.modeName({actualValueModeDrivingExperience:2},f.modeField),undefined,'Unlisted numeric values are not guessed');
    f.failGetter();
    f.receive.mode({actualValueModeDrivingExperience:'1'});
    var after = await io.readContext();
    assert.strictEqual(after.fes,'SPORT_DYNAMIC');
    assert.strictEqual(after.modeSource,'notification');
    var reads = f.reads();
    await io.readContext();
    assert.strictEqual(f.reads(),reads,'A fresh FES notification avoids repeated getter timeouts');
    f.availability.mode(false);
    await assert.rejects(io.readContext(),/getter unavailable/);
    f.availability.mode(true);
    await assert.rejects(io.readContext(),/getter unavailable/,'An old value cannot survive a reconnect');
    f.receive.mode({actualValueModeDrivingExperience:7});
    var manual = frames.find(function(r) { return r.manual; });
    f.receive.secondary(manual.secondary);
    assert.strictEqual((await io.readContext()).manualSource,'mdrive');
    assert.strictEqual((await io.readContext()).manual,true);
    f.receive.primary(frames[0].sample.value);
    assert.strictEqual((await io.readContext()).manual,false,'The original validated source takes priority');
    f.passes(1501);
    assert.strictEqual((await io.readContext()).manual,undefined,'A stale M/S value is never treated as current');
    f.passes(3500);
    await assert.rejects(io.readContext(),/getter unavailable/,'A stale FES event expires');
    await io.close();
    assert.strictEqual(f.closed.length,4);

    f = fixture({eventOnly:true,failPrimary:true});
    io = await f.connect();
    assert.strictEqual((await io.readContext()).fes,undefined);
    assert.ok(f.closed.indexOf('primary')>=0,'A failed optional proxy is closed immediately');
    f.receive.mode({actualValueModeDrivingExperience:'ECO_PRO_EFFICIENT'});
    f.receive.secondary(manual.secondary);
    var eventOnly = await io.readContext();
    assert.strictEqual(eventOnly.fes,'ECO_PRO_EFFICIENT');
    assert.strictEqual(eventOnly.manual,true);
    assert.strictEqual(f.reads(),0,'The event-only transport never tries a getter');
    await io.close();
    console.log('OK: FES getter and notification fallback, unit enum decoding, expiry, reconnect, and optional M/S sources.');
}
main().catch(function(e){console.error(e.stack);process.exitCode=1;});

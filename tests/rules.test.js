'use strict';
var assert = require('assert');
var model = require('../native/dorin-ambient/model');
var auto = require('../native/dorin-ambient/controller');
var colors = require('./fixtures.json');
function fixture() {
    var f = {ctx: {fes: 'COMFORT', plugin: true, hybrid: false, manualSupported: true, manual: false, electricSupported: true, electric: false},
        color: Object.assign({}, colors.orange), config: model.defaults(), writes: [], live: true, logs: []};
    f.io = {
        readContext: function () { return Promise.resolve(Object.assign({}, f.ctx)); },
        settings: function () { return f.config; },
        readColor: function () { return Promise.resolve(f.color); },
        setColor: function (v) {
            f.writes.push(v);
            f.color = Object.assign({}, f.color, {statusHueInteriorLighting: v.controlHueInteriorLighting,
                statusMenuAmbientePanoramicRoofInteriorLighting: v.controlMenuAmbientePanoramicRoofInteriorLighting});
            return Promise.resolve();
        },
        running: function () { return f.live; }, wait: function () { return Promise.resolve(); },
        log: function (s) { f.logs.push(s); }
    };
    return f;
}
async function twice(s, f) { await auto.step(s, f.io); await auto.step(s, f.io); }
async function main() {
    var f = fixture(), s = auto.createState();
    await twice(s, f); assert.strictEqual(f.color.statusHueInteriorLighting, 128);
    f.config = model.change(f.config, 'comfort', 'blue');
    await twice(s, f); assert.strictEqual(f.color.statusHueInteriorLighting, 199, 'Rule change for the active mode applies');
    f.config = model.change(f.config, 'comfort', null);
    await twice(s, f); assert.strictEqual(f.writes.length, 2, 'No change means no new command or restoration');
    f.ctx.fes = 'SPORT_DYNAMIC'; f.config = model.change(f.config, 'sport', 'green');
    await twice(s, f); assert.strictEqual(f.color.statusHueInteriorLighting, 128, 'Sport color is configurable');
    f.ctx.manual = true;
    await twice(s, f); assert.strictEqual(f.writes.length, 3, 'Unassigned manual overrides underlying Sport without changing color');
    f.ctx.fes = 'ECO_PRO_EFFICIENT';
    await twice(s, f); assert.strictEqual(f.writes.length, 3, 'Underlying FES changes are ignored while manual is active');
    f.config = model.change(f.config, 'manual', 'orange');
    await twice(s, f); assert.strictEqual(f.color.statusHueInteriorLighting, 10);
    f.ctx.manual = false; await twice(s, f); assert.strictEqual(f.color.statusHueInteriorLighting, 199);
    f.ctx.electric = true; f.ctx.hybrid = undefined;
    await twice(s, f); assert.strictEqual(f.writes.length, 5, 'Electric/Hybrid telemetry no longer changes the selected rule');
    assert.throws(function () { model.change(f.config,'electric','green'); },/Invalid/);
    f.ctx.manual = true; await twice(s, f); assert.strictEqual(f.color.statusHueInteriorLighting, 10, 'M/S has priority over the driving mode');
    f.ctx.manual = undefined; f.ctx.fes = 'COMFORT';
    var count = f.writes.length; await twice(s, f); assert.strictEqual(f.writes.length, count, 'Missing manual telemetry never falls back to base mode');
    f = fixture(); s = auto.createState();
    await twice(s, f); f.color = Object.assign({}, colors.blue);
    f.config = model.change(f.config, 'sport', 'blue');
    await twice(s, f); assert.strictEqual(f.writes.length, 1, 'Changing another rule preserves manual color override');
    f.ctx.manual = undefined; await twice(s, f); f.ctx.manual = false; await twice(s, f);
    assert.strictEqual(f.writes.length, 1, 'Unknown telemetry does not clear manual override');
    f = fixture(); s = auto.createState();
    var reads = 0;
    f.io.readContext = function () { return Promise.resolve(Object.assign({}, f.ctx, {manual: ++reads >= 3})); };
    await twice(s, f); assert.strictEqual(f.writes.length, 0, 'Context is rechecked before writing');
    f = fixture(); s = auto.createState();
    f.io.setColor = function (v) { f.writes.push(v); return Promise.reject(new Error('ACK timeout')); };
    await auto.step(s, f.io);
    try { await auto.step(s, f.io); assert.fail(); } catch (e) { assert.strictEqual(e.message, 'ACK timeout'); }
    await twice(s, f); assert.strictEqual(f.writes.length, 1, 'No repeated setters for an uncertain result');
    assert.strictEqual(model.resolve({fes: 'PHEV_ELECTRIC_STANDARD'}), null, 'No electric rule exists');
    assert.strictEqual(model.resolve({fes: 'COMFORT', plugin: true, hybrid: false, electricSupported: true, electric: true}), 'comfort');
    assert.strictEqual(model.resolve({fes: 'PHEV_ELECTRIC_STANDARD', electricSupported: true, electric: false}), null);
    assert.strictEqual(model.resolve({fes: 'COMFORT', plugin: true, hybrid: true, electricSupported: true, electric: true}), 'comfort', 'Brief electric propulsion in Hybrid keeps the drive-mode rule');
    assert.strictEqual(model.resolve({fes: 'SPORT_DYNAMIC', plugin: false, electric: true}), 'sport', 'Non-plugin vehicles never get the electric override');
    assert.strictEqual(model.resolve({fes: 'PHEV_HYBRID_STANDARD', baseDriveMode: 'comfort', plugin: true, hybrid: true}), 'comfort');
    assert.strictEqual(model.resolve({fes: 'PHEV_HYBRID_STANDARD', plugin: true, hybrid: true}), null, 'No guessed Comfort fallback without the base-mode signal');
    assert.strictEqual(model.resolve({fes: 'COMFORT', plugin: true, hybrid: false, electricSupported: true, electric: true}), 'comfort');
    assert.strictEqual(model.resolve({fes: 'ADAPTIVE'}), 'adaptive');
    assert.strictEqual(model.resolve({fes:'ADAPTIVE',manualSupported:true,manual:true}), 'manual');
    assert.strictEqual(model.resolve({fes:'SPORT_DYNAMIC',baseDriveMode:'adaptive'}), 'adaptive');
    var independent=model.change(model.defaults(),'comfort','lilac');
    independent=model.change(independent,'adaptive','blue');
    assert.strictEqual(independent.rules.comfort,'lilac');
    assert.strictEqual(independent.rules.adaptive,'blue');
    independent=model.change(independent,'comfort','orange');
    assert.strictEqual(independent.rules.adaptive,'blue','Changing Comfort must not modify Adaptive');
    independent=model.change(independent,'adaptive',null);
    assert.strictEqual(independent.rules.comfort,'orange','Adaptive STANDARD must not modify Comfort');
    assert.strictEqual(model.settings(independent).rules.adaptive,null,'Explicit Adaptive STANDARD survives normalization');
    assert.ok(model.modes.indexOf('adaptive')>=0);
    [null].concat(Object.keys(model.colors)).forEach(function(color){
        [true,false].forEach(function(enabled){
            var legacyConfig=model.defaults();delete legacyConfig.rules.adaptive;
            legacyConfig.rules.comfort=color;legacyConfig.enabled=enabled;
            legacyConfig.seenModes=legacyConfig.seenModes.filter(function(m){return m!=='adaptive';});
            var migratedConfig=model.settings(legacyConfig);
            assert.strictEqual(migratedConfig.enabled,enabled);
            assert.strictEqual(migratedConfig.rules.comfort,color);
            assert.strictEqual(migratedConfig.rules.adaptive,color,'Legacy shared color seeds both rows, including STANDARD');
            assert.ok(migratedConfig.seenModes.indexOf('adaptive')>=0,'Both settings rows are available on existing cars');
            var changed=model.change(migratedConfig,'comfort',color==='blue'?'green':'blue');
            assert.strictEqual(model.settings(changed).rules.adaptive,color,'The initial copy is never repeated after migration');
        });
    });
    f=fixture();s=auto.createState();f.config=model.change(f.config,'adaptive','lilac');
    await twice(s,f);assert.strictEqual(f.color.statusHueInteriorLighting,128);
    f.ctx.fes='ADAPTIVE';await twice(s,f);assert.strictEqual(f.color.statusHueInteriorLighting,258);
    count=f.writes.length;f.config=model.change(f.config,'comfort','blue');await twice(s,f);
    assert.strictEqual(f.writes.length,count,'Editing inactive Comfort leaves active Adaptive unchanged');
    f.config=model.change(f.config,'adaptive',null);await twice(s,f);
    assert.strictEqual(f.writes.length,count,'Adaptive STANDARD sends no command and never falls back to Comfort');
    f.ctx.fes='COMFORT';await twice(s,f);assert.strictEqual(f.color.statusHueInteriorLighting,199);
    f.ctx.manual=true;f.config=model.change(f.config,'manual','orange');await twice(s,f);
    assert.strictEqual(f.color.statusHueInteriorLighting,10);
    count=f.writes.length;f.ctx.fes='ADAPTIVE';await twice(s,f);
    assert.strictEqual(f.writes.length,count,'M/S still overrides both independent driving modes');
    f.ctx.manual=false;await twice(s,f);assert.strictEqual(f.writes.length,count,'Leaving M/S for Adaptive STANDARD keeps the current color');
    f.config=model.change(f.config,'adaptive','green_white');await twice(s,f);
    assert.strictEqual(f.color.statusMenuAmbientePanoramicRoofInteriorLighting,'FARBAUSWAHL_11');
    assert.strictEqual(model.resolve({fes:'SPORT_EXPERT'}),'sport');
    assert.strictEqual(model.resolve({fes:'PHEV_SPORT_PLUS'}),'sport');
    assert.strictEqual(model.resolve({fes:'COMFORT',baseDriveMode:'sport_plus'}),'sport');
    assert.strictEqual(model.resolve({fes:'SPORT_EXPERT',manualSupported:true,manual:true}),'manual');
    var sportAlias=model.change(model.defaults(),'sport_plus','bronze_white');
    assert.strictEqual(sportAlias.rules.sport,'bronze_white');assert.strictEqual(sportAlias.rules.sport_plus,undefined);
    sportAlias.rules.sport_plus='blue';sportAlias.seenModes.push('sport_plus');
    assert.strictEqual(model.settings(sportAlias).rules.sport,'bronze_white');
    assert.strictEqual(model.modes.indexOf('sport_plus'),-1);
    assert.strictEqual(model.resolve({fes: 'PHEV_BATTERYCONTROL'}), null);
    assert.strictEqual(model.resolve({fes: '__proto__'}), null);
    assert.throws(function () { model.change(model.defaults(), '__proto__', 'blue'); });
    assert.throws(function () { model.change(model.defaults(), 'sport', 'unverified-color'); });
    var legacy = model.settings({schema: 1, enabled: true});
    assert.strictEqual(legacy.enabled, true); assert.strictEqual(legacy.rules.manual, null);
    var old = model.defaults(); old.rules.electric='blue';old.rules.battery_control='green';old.seenModes.push('electric','hybrid');
    var migrated=model.settings(old);assert.strictEqual(migrated.rules.electric,undefined);assert.strictEqual(migrated.rules.battery_control,undefined);
    assert.ok(migrated.seenModes.indexOf('electric')<0);
    assert.strictEqual(model.modes.indexOf('electric'),-1);
    console.log('OK: configurable colors, STANDARD, M/S priority, removed electric overrides, fresh context, manual hold, migration, validation and bounded writes.');
}
main().catch(function (e) { console.error(e.stack); process.exitCode = 1; });

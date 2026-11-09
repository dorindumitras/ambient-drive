'use strict';
var assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
var driver=require('../native/dorin-ambient/driver'),model=require('../native/dorin-ambient/model');
var profile=require('../native/dorin-ambient/profile.json'),capture=require('./ms-live-13.json');
var palette=require('./palette-live-11.json');
async function main() {
    var def=profile.bindings.manual;
    assert.strictEqual(capture.length,44);
    capture.forEach(function(f){
        var state={latest:f.sample.value,receivedAt:100000,available:f.sample.available,closed:false};
        assert.strictEqual(driver.notificationValue(state,def,100000+f.sample.ageMs),f.manual,f.stage);
        assert.strictEqual(model.resolve({fes:f.fes,manualSupported:true,manual:f.manual}),f.manual?'manual':'comfort');
        assert.strictEqual(f.sample.value.dummy2,f.secondary.displayProgramGearbox,'Two independent interfaces agree');
    });
    var valid=capture[11].sample.value;
    assert.strictEqual(driver.notificationValue({latest:valid,receivedAt:1000,available:true},def,2501),undefined);
    assert.strictEqual(driver.notificationValue({latest:valid,receivedAt:1000,available:false},def,1001),undefined);
    assert.strictEqual(driver.notificationValue({latest:valid,receivedAt:1000,available:true,closed:true},def,1001),undefined);
    assert.strictEqual(driver.bindingValue(Object.assign({},valid,{dummy2:'SIGNAL_UNGUELTIG'}),def),undefined);
    assert.strictEqual(driver.bindingValue(Object.assign({},valid,{dummy4:'SIGNAL_UNGUELTIG'}),def),undefined);
    assert.strictEqual(palette.length,11);
    palette.forEach(function(p){assert.deepStrictEqual(model.colors[p.key],{menu:p.value.statusMenuAmbientePanoramicRoofInteriorLighting,hue:p.value.statusHueInteriorLighting});});
    var root=fs.mkdtempSync('/tmp/ambient-verified-bindings-'),dir=path.join(root,'oap_12206','someipInterfaces');
    fs.mkdirSync(path.dirname(dir));fs.mkdirSync(dir);
    var names={color:'de_bmw_infotainment_misc_ComfortFunctionIuK.json',mode:'de_bmw_infotainment_drivingexcitement_FES.json',manual:'de_bmw_powertrain_Powertrain.json'};
    var configs={color:{name:'color',fields:{statusAmbientLightInteriorColour:{getter:{id:3}},ambientLightInteriorColour:{setter:{id:26}}}},
        mode:{name:'mode',fields:{statusFESVehicleDynamicSwitchHMI:{getter:{id:37}}}},
        manual:{name:'manual',fields:{dataDisplayGearboxSecure:{schema:{t:'Struct'},event:{id:32775,groups:[3]}}}}};
    var clock=1000,receive,availability,closed=0;
    var native={buildProxy:function(config){return Promise.resolve({
        init:function(){return Promise.resolve();},
        getValue:function(name){assert.strictEqual(config.name,'mode','Notifier-only binding must never use getValue');return Promise.resolve({actualValueModeDrivingExperience:'COMFORT'});},
        subscribeToAvailability:function(fn){assert.strictEqual(config.name,'manual');availability=fn;fn(true);return Promise.resolve();},
        subscribe:function(request){assert.strictEqual(request.name,def.field);receive=request.onReceive;return Promise.resolve();},
        shutdown:function(){closed++;return Promise.resolve();}
    });}};
    try {
        Object.keys(names).forEach(function(key){fs.writeFileSync(path.join(dir,names[key]),JSON.stringify(configs[key]));});
        assert.strictEqual(driver.bindingConfig(root,def).name,'manual','Uses generated field.event rather than a nonexistent notifier member');
        function redirect(file){return file.indexOf('/var/opt/public/oap')===0?root+file.slice('/var/opt/public/oap'.length):file;}
        var module={exports:{}};
        vm.runInNewContext(fs.readFileSync(__dirname+'/../native/dorin-ambient/driver.js','utf8'),{
            module:module,exports:module.exports,setImmediate:setImmediate,Date:{now:function(){return clock;}},
            require:function(name){
                if(name==='/usr/lib/someip.node')return native;
                if(name==='fs')return {readFileSync:function(file,encoding){return fs.readFileSync(redirect(file),encoding);},readdirSync:function(dir){return fs.readdirSync(redirect(dir));}};
                return require(name);
            }
        });
        var io=await module.exports.connect(profile);
        assert.strictEqual((await io.readContext()).manual,undefined,'No initial guessed value');
        receive(valid);assert.strictEqual((await io.readContext()).manual,true);
        clock+=1501;assert.strictEqual((await io.readContext()).manual,undefined,'Missing cyclic updates stop rule changes');
        receive(valid);assert.strictEqual((await io.readContext()).manual,true);
        availability(false);assert.strictEqual((await io.readContext()).manual,undefined);
        availability(true);assert.strictEqual((await io.readContext()).manual,undefined,'Reconnect requires a new frame');
        receive(capture[0].sample.value);assert.strictEqual((await io.readContext()).manual,false);
        await io.close();assert.strictEqual(closed,3);
    } finally {Object.keys(names).forEach(function(key){fs.unlinkSync(path.join(dir,names[key]));});fs.rmdirSync(dir);fs.rmdirSync(path.dirname(dir));fs.rmdirSync(root);}
    console.log('OK: 44 actual D/S/M/D frames; independent program agreement; cyclic notifier transport; stale/unavailable rejection; reconnect; all 11 measured palette entries.');
}
main().catch(function(e){console.error(e.stack);process.exitCode=1;});

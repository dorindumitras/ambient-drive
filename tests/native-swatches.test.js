'use strict';
var assert=require('assert');
var native=require('../apps/dorin_ambientdrive/native-swatches');
var preview=require('../apps/dorin_ambientdrive/native-preview');
// Contract checked statically in the supplied SDK's createParameterMap and
// createParameterValueUnion. No BMW bundle is loaded or executed by this test.
function validateValue(value,type) {
    if(['Enum','Text','StringId'].indexOf(type)>=0)assert.strictEqual(typeof value,'string','SDK '+type+' requires UTF-8 text');
    else if(type==='Bool')assert.strictEqual(typeof value,'boolean');
    else if(['Clear','Reset'].indexOf(type)>=0)throw new Error('SDK Clear/Reset must omit the Value union');
    else assert.strictEqual(typeof value,'number','SDK '+type+' requires a number');
}
async function main(){
    assert.deepStrictEqual(native.palette,Object.keys(require('../native/dorin-ambient/model').colors));
    assert.throws(function(){validateValue(591,'Enum');},/UTF-8 text/,'Regression: old numeric enum IDs were rejected by the real SDK serializer');
    assert.throws(function(){validateValue(0,'Clear');},/omit the Value/,'Regression: old Clear call supplied an unsupported Value union');
    var calls=[],registrations=[],updates=[],components={};
    var ui={rhmi:{getResourceBundle:function(){return {createResourceHandles:function(ids){registrations.push(ids);return Promise.resolve();},getResourceHandle:function(gid){return gid===native.gid?77:gid===native.standardResource?78:79;}};},update:function(items){
        items.forEach(function(item){assert.strictEqual(item.type,0);item.data.parameterMaps.forEach(function(map){assert.strictEqual(map[1],13);assert.ok(!Object.prototype.hasOwnProperty.call(map,0),'Clear has no Value key');assert.strictEqual(map[3],'Icon');});});updates.push(items);return Promise.resolve();
    }},comp:function(name){return components[name]||(components[name]={getId:function(){return Object.keys(components).indexOf(name)+1;},setValue:function(){var args=Array.from(arguments),v=args.length===1?args[0]:{row:args[0],cellName:args[1],value:args[2],valueType:args[3]};validateValue(v.value,v.valueType);calls.push({name:name,value:v});return Promise.resolve();}});}};
    var engine=native.create(ui);
    await Promise.all(native.palette.map(function(color){return engine.set('COLOR_'+color.toUpperCase(),color,false);}));
    assert.strictEqual(registrations.length,1,'Native icon resource is shared, with row-specific parameters');
    assert.deepStrictEqual(registrations[0],[native.gid]);
    native.palette.forEach(function(color,i){var c=calls.find(function(c){return c.name==='COLOR_'+color.toUpperCase()&&c.value.childCellName==='ensemble';});assert.strictEqual(c.value.value,'ensemble'+(i+1));assert.strictEqual(c.value.valueType,'Enum');});
    await engine.set('SPORT','orange',true);assert.deepStrictEqual(calls[calls.length-1].value,{row:0,cellName:'TextNoColorVisible',value:false,valueType:'Bool'});
    var before=calls.length;await engine.set('SPORT','orange',true);assert.strictEqual(calls.length,before,'Unchanged polls do not reset the native graphic');
    before=calls.length;await engine.set('SPORT',null,true);assert.deepStrictEqual(calls[calls.length-1].value,{row:0,cellName:'TextNoColorVisible',value:false,valueType:'Bool'});
    assert.ok(calls.slice(before).some(function(c){return c.value.cellName==='Icon'&&c.value.value===78&&c.value.valueType==='Asset';}),'STANDARD uses the centered native Icon slot with an app-owned text bitmap');
    assert.ok(!calls.slice(before).some(function(c){return c.value.childCellName==='ensemble';}),'Bitmap receives no native ensemble parameter');
    assert.strictEqual(updates.length,1,'Color-to-text transition clears the old asset parameters');
    assert.ok(!calls.some(function(c){return c.value.valueType==='Clear';}));
    engine.invalidate();before=calls.length;await engine.set('SPORT',null,true);assert.ok(calls.length>before);
    var oldClears=updates.length;await engine.set('SPORT','blue',true);assert.strictEqual(updates.length,oldClears+1,'Text-to-color transition clears the bitmap');
    oldClears=updates.length;await native.clear(ui,'SPORT');assert.strictEqual(updates.length,oldClears+1,'Fallback clearing uses a valid raw update without Value');
    await assert.rejects(engine.set('SPORT','not-a-color',true),/Unknown/);
    var scene=preview.create(ui);await scene.set('INTERIOR_PREVIEW','lilac_white');
    var sceneCalls=calls.filter(function(c){return c.name==='INTERIOR_PREVIEW';});
    assert.ok(sceneCalls.some(function(c){return c.value.cellName==='Illustration'&&c.value.valueType==='Asset'&&c.value.value===79;}));
    assert.ok(sceneCalls.some(function(c){return c.value.childCellName==='ensemble'&&c.value.value==='ensemble11';}));
    assert.ok(sceneCalls.some(function(c){return c.value.childCellName==='color'&&c.value.value==='color_ensemble11';}));
    assert.ok(sceneCalls.some(function(c){return c.value.childCellName==='ambientLight'&&c.value.value===true;}),'Selected-color preview requests illuminated graphics');
    assert.strictEqual(sceneCalls[sceneCalls.length-1].value.value,'ambientLightColor');
    await scene.set('INTERIOR_PREVIEW',null);assert.strictEqual(calls[calls.length-1].value.value,'interiorLightCheckbox','Neutral focus follows the observed native preview parameter');
    assert.strictEqual(calls.filter(function(c){return c.value.childCellName==='ambientLight';}).pop().value.value,false);
    assert.strictEqual(registrations.length,3,'One registration for each native GID and the STANDARD bitmap');
    console.log('OK: strict SDK wire types; all 11 symbolic ensembles; valid Clear packets; native interior preview parameters; STANDARD visibility; no binary reads.');
}
main().catch(function(e){console.error(e.stack);process.exitCode=1;});

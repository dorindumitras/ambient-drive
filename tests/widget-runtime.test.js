'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),EventEmitter=require('events').EventEmitter;
var source=fs.readFileSync(__dirname+'/../kit/runtime/mgu.js','utf8');
var begin=source.indexOf('function patchStartWidgetEvents(app)'),end=source.indexOf('/* ---------------- generic settings screen',begin);
var sets=[],files=[],destroyed=[],timers=[],opened=[],gate=null;
var rb={createResourceHandles:async function(){if(gate)await gate;},getResourceHandle:function(f){return 'handle:'+f;},
    destroyResourceHandles:async function(f){destroyed.push.apply(destroyed,f);}};
var comp=new EventEmitter();comp.spawnedInstances={};comp.setValue=async function(){sets.push(Array.from(arguments));};comp.getResourceBundle=function(){return rb;};
comp.parseUserEvent=function(e){
    if(e.type==='destroyed'||e.type==='abort')delete comp.spawnedInstances[e.spawnId];
    comp.emit(e.type,e);
};
var rhmi={getById:function(id){return id===501?comp:null;},getByName:function(){return comp;}};
var originalCalls=0,app={_createStartWidgetRhmiApplication:async function(){originalCalls++;app.startWidgetRhmiApplication=rhmi;}};
var context={module:{exports:{}},Buffer:Buffer,Date:Date,path:path,SPEC:{id:'dorin_ambientdrive'},
    RHMI_RES:'/mock/resources',RUN_TAG:'test',global:{},log:{info:function(){},warn:function(){},error:function(){}},
    fs:{writeFileSync:function(f){files.push(f);},renameSync:function(a,b){files.push(b);},unlinkSync:function(f){files.push('removed:'+f);}},
    widgetText:function(v){return String(v);},setTimeout:function(fn,ms){timers.push({fn:fn,ms:ms});}};
vm.runInNewContext(source.slice(begin,end)+'\nmodule.exports={Widget:Widget,patchStartWidgetEvents:patchStartWidgetEvents};',context);
var Widget=context.module.exports.Widget;
async function event(command,events){return app._createStartWidgetRhmiApplication({configData:JSON.stringify({command:command,events:events})});}
async function main(){
    var widget=new Widget({image:'BackgroundImage1',smallImage:'IconCam',cells:{Title:['SID_DORIN_AMBIENTDRIVE_WIDGET_NAME','StringId']}});
    context.module.exports.patchStartWidgetEvents(app);widget.attach(rhmi);widget.attach(rhmi);
    assert.strictEqual(comp.listenerCount('action'),1,'Reattachment cannot multiply tap handlers');
    var tap=source.match(/widget\.onTap\(\(\) => \{ if \(entryUuids\[0\]\) openEntry\(entryUuids\[0\]\); \}\);/)[0];
    vm.runInNewContext(tap,{widget:widget,entryUuids:['main-entry'],openEntry:function(uuid){opened.push(uuid);}});
    await event('CREATE_START_WIDGET_RHMI_APP',[{type:'created',componentId:501,spawnId:7,widgetSize:1}]);
    assert.strictEqual(widget.instances()[0].big,false);assert.strictEqual(widget.active(),true);
    assert.ok(sets.some(function(s){return s[0]===7&&s[1]==='Title'&&s[3]==='StringId';}));
    var frame={d:new Uint8Array([1,2,3,255]),png:function(){return Buffer.from('png');}};
    await widget.image(7,frame);
    assert.ok(sets.some(function(s){return s[0]===7&&s[1]==='IconCam'&&s[3]==='Asset';}));
    await event('CREATE_START_WIDGET_RHMI_APP',[{type:'resize',componentId:501,spawnId:7,widgetSize:2}]);
    assert.strictEqual(widget.instances()[0].big,true);
    var calls=originalCalls;
    await app._createStartWidgetRhmiApplication({configData:JSON.stringify({command:'SEND_EVENTS',rhmiEvents:{501:[{type:'action',spawnId:7},{type:'visible',spawnId:7,visible:false}]}})});
    assert.strictEqual(originalCalls,calls,'SEND_EVENTS never recreates the widget');
    assert.deepStrictEqual(opened,['main-entry']);assert.strictEqual(widget.active(),false);
    await widget.image(7,frame);var count=sets.length;await widget.image(7,frame);
    assert.ok(sets.some(function(s){return s[0]===7&&s[1]==='BackgroundImage1'&&s[3]==='Asset';}));
    assert.strictEqual(sets.length,count,'Identical pixels are coalesced');
    await event('CREATE_START_WIDGET_RHMI_APP',[{type:'destroyed',componentId:501,spawnId:7}]);
    assert.strictEqual(widget.instances().length,0);assert.ok(destroyed.length>=1);assert.strictEqual(widget._img[7],undefined);
    await event('CREATE_START_WIDGET_RHMI_APP',[{type:'created',componentId:501,spawnId:8,widgetSize:2}]);
    var release;gate=new Promise(function(r){release=r;});var inFlight=widget.image(8,frame);
    await Promise.resolve();await event('CREATE_START_WIDGET_RHMI_APP',[{type:'destroyed',componentId:501,spawnId:8}]);
    release();await inFlight;gate=null;
    assert.ok(!sets.some(function(s){return s[0]===8&&s[1]==='BackgroundImage1';}),'A removed spawn never receives a late frame');
    assert.strictEqual(widget._img[8],undefined);
    var draws=0;widget.loop(1,function(){draws++;return frame;});
    await timers.pop().fn();assert.strictEqual(draws,0,'No placed widgets means no drawing');
    assert.ok(files.some(function(f){return f.indexOf('removed:')===0;}),'Dynamic files are cleaned up');
    console.log('OK: native creation, resizing, StringIds, actual tap-to-main wiring, visibility, removal, frame coalescing and in-flight resource cleanup.');
}
main().catch(function(e){console.error(e.stack);process.exitCode=1;});

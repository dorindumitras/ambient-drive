'use strict';
var fs=require('fs'),vm=require('vm'),assert=require('assert');
var schema=require('../apps/dorin_ambientdrive/ui-schema');
var Canvas=require('../kit/runtime/canvas');
var module0={exports:{}};
vm.runInNewContext(fs.readFileSync(__dirname+'/../apps/dorin_ambientdrive/home-widget.js','utf8'),{
    module:module0,exports:module0.exports,require:function(name){
        if(name==='./kit/canvas')return Canvas;
        if(name==='./ui-schema')return schema;
        throw new Error(name);
    },Date:Date,Promise:Promise});
var home=module0.exports;
function active(overrides){return Object.assign({enabled:true,telemetryReady:true,mode:'comfort',phase:'active',
    rules:{comfort:'green'},lastColor:'green',confirmedByReadback:true},overrides||{});}
async function main(){
    assert.strictEqual(home.view(null).status,'UNAVAILABLE');
    assert.strictEqual(home.view(active({enabled:false})).mode,null);
    assert.strictEqual(home.view(active({enabled:false})).color,undefined);
    assert.strictEqual(home.view(active({enabled:false})).status,'OFF');
    for(var color of schema.colors){
        for(var mode of schema.modes){
            var rules={};rules[mode]=color;
            var v=home.view(active({mode:mode,rules:rules,lastColor:color}));
            assert.strictEqual(v.mode,mode);assert.strictEqual(v.color,color);
            assert.strictEqual(v.status,color===null?'STANDARD':'ON');
            var cells=home.cells(v);
            assert.strictEqual(cells.TextRecordings[0],'SID_DORIN_AMBIENTDRIVE_MODE_'+mode.toUpperCase());
            assert.strictEqual(cells.TextCam[0],'','The Home layout clears the previous color name');
            assert.strictEqual(cells.TextCam[1],'Text');
        }
    }
    for(var phase of ['waiting','unknown_mode','setup_required','disabled']){
        var noData=home.view(active({phase:phase}));assert.strictEqual(noData.mode,null);assert.strictEqual(noData.color,undefined);assert.strictEqual(noData.status,'WAITING');
    }
    assert.strictEqual(home.view(active({mode:null,phase:'unconfirmed',lastError:'Old FES unavailable'})).status,'WAITING','No fake active mode on the30i failure');
    assert.strictEqual(home.view(active({phase:'applying'})).status,'APPLYING');
    assert.strictEqual(home.view(active({phase:'ambient_off'})).status,'AMBIENT_OFF');
    assert.strictEqual(home.view(active({phase:'unconfirmed'})).status,'UNCONFIRMED');
    assert.strictEqual(home.view(active({confirmedByReadback:false})).status,'UNCONFIRMED');
    assert.strictEqual(home.view(active({lastColor:'blue'})).status,'UNCONFIRMED');
    var cv=home.draw(home.view(active()));assert.strictEqual(cv.w,768);assert.strictEqual(cv.h,512);
    assert.strictEqual(cv.png().slice(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.notStrictEqual(cv.png().toString('base64'),home.draw(home.view(active({rules:{comfort:'blue_white'},lastColor:'blue_white'}))).png().toString('base64'));
    function pixel(frame,x,y){return Array.from(frame.d.slice((y*frame.w+x)*4,(y*frame.w+x)*4+4));}
    var twoTone=home.draw(home.view(active({rules:{comfort:'blue_white'},lastColor:'blue_white'})),true);
    assert.deepStrictEqual(pixel(twoTone,16,16),[40,119,255,255]);
    assert.deepStrictEqual(pixel(twoTone,16,53),[237,245,255,255]);
    assert.deepStrictEqual(pixel(home.draw(home.view(active({rules:{comfort:null}})),true),16,16),[0,0,0,0]);
    var now=0,status=active(),requestError=null,requests=[],sets=[],draw,changed;
    var ctx={log:{warn:function(){}},widget:{loop:function(fps,fn){assert.strictEqual(fps,1);draw=fn;},
        onChange:function(fn){changed=fn;},set:async function(){sets.push(Array.from(arguments));},instances:function(){return [{spawnId:1}];}}};
    var client={request:async function(op,path,timeout){requests.push([op,path,timeout]);if(requestError)throw requestError;return status;}};
    home.start(ctx,client,{now:function(){return now;}});
    var small={spawnId:1,big:false,visible:true},big={spawnId:2,big:true,visible:true};
    assert.strictEqual((await draw(small)).w,72);assert.strictEqual(requests.length,1);
    assert.deepStrictEqual(requests[0],['status',null,2000]);
    assert.ok(sets.some(function(s){return s[1]==='TimeElapsed'&&s[2]==='SID_AD_WIDGET_ON'&&s[3]==='StringId';}));
    var firstBig=await draw(big);assert.strictEqual(firstBig.w,768);assert.strictEqual(requests.length,1,'All placed widgets share one sample');
    var count=sets.length;assert.strictEqual(await draw(big),null,'A static Home does not repeatedly write identical PNGs');assert.strictEqual(sets.length,count,'Stable native cells are coalesced');
    await draw({spawnId:3,big:true,visible:false});assert.strictEqual(sets.length,count);assert.strictEqual(requests.length,1,'Hidden widgets do not poll');
    now=6000;await draw(small);assert.ok(sets.length>count,'Periodically refresh native cells if the HMI dropped a prior update');
    now+=1100;status=active({enabled:false});assert.deepStrictEqual(pixel(await draw(small),16,16),[0,0,0,0]);
    assert.ok(sets.some(function(s){return s[1]==='TimeElapsed'&&s[2]==='SID_AD_WIDGET_OFF';}));
    now+=1100;requestError=new Error('socket unavailable');await draw(small);
    assert.ok(sets.some(function(s){return s[1]==='TimeElapsed'&&s[2]==='SID_AD_WIDGET_UNAVAILABLE';}));
    now+=1100;requestError=null;status=active({mode:'sport',rules:{sport:'orange'},lastColor:'orange'});await draw(big);
    assert.ok(sets.some(function(s){return s[1]==='TextRecordings'&&s[2]==='SID_DORIN_AMBIENTDRIVE_MODE_SPORT';}));
    var release;client.request=function(op){requests.push([op]);return new Promise(function(r){release=r;});};now+=1100;
    var a=draw(small),b=draw(big);await Promise.resolve();count=requests.length;release(status);await Promise.all([a,b]);assert.strictEqual(requests.length,count);
    changed();client.request=async function(op){requests.push([op]);return status;};await draw(small);
    assert.ok(requests.every(function(r){return r[0]==='status';}),'Home never enables, disables or changes any rule');
    assert.strictEqual(home.start({},{request:function(){throw new Error('must not poll');}}),null);
    console.log('OK: all modes/colors, honest confirmation and unknown/offline states, native StringIds, small/large graphics, shared visible-only reads, recovery and read-only widget.');
}
main().catch(function(e){console.error(e.stack);process.exitCode=1;});

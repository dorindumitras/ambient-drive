'use strict';
var fs=require('fs'),vm=require('vm'),assert=require('assert');
var model=require('../native/dorin-ambient/model'),schema=require('../apps/dorin_ambientdrive/ui-schema');
async function main(){
    var callbacks={},focuses={},components={},checked={},visible={},sids={},properties={},ops=[],previews=[],glyphs=[],loops={},opened=[],closed=[];
    var config=model.defaults(),fail=false,swatchFail=false,nativePreviewFail=false,fallbackPreviewFail=false,statusGate=null,finished,onVisible,colorSelectionWrites=0,focusRequested=0;
    var servicePhase=null,serviceError=null,nativeCalls=0,imageReturnFalse=false,stackChanged;
    var context={ui:{
        rhmi:{on:function(event,fn){assert.strictEqual(event,'applicationStackChanged');stackChanged=fn;}},
        comp:function(name){return components[name]||(components[name]={id:Object.keys(components).length+1,getId:function(){return this.id;},on:function(event,fn){assert.strictEqual(event,'focus');focuses[name]=fn;},setValue:function(row,cell,value,type){if(type==='StringId')sids[name+':'+cell]=value;else assert.ok(['Clear','Bool'].indexOf(type)>=0);return Promise.resolve();},setProperty:function(key,value,type){properties[name+':'+key]=value;assert.strictEqual(type,'UInt');return Promise.resolve();}});},
        image:function(name,bytes,cell){if(fallbackPreviewFail)return Promise.reject(new Error('Image unavailable'));if(imageReturnFalse)return Promise.resolve(false);assert.ok(['INTERIOR_PREVIEW','COLOR_PREVIEW'].indexOf(name)>=0);assert.strictEqual(cell,'Illustration');previews.push({name:name,color:bytes.toString(),source:'bitmap'});return Promise.resolve(true);},
        checked:function(name,value){checked[name]=value;if(name.indexOf('COLOR_')===0)colorSelectionWrites++;return Promise.resolve();},
        visible:function(name,value){visible[name]=value;return Promise.resolve();},enabled:function(){return Promise.resolve();},
        onClick:function(name,fn){callbacks[name]=fn;},onVisible:function(fn){onVisible=fn;},
        open:async function(name){opened.push(name);await onVisible(name,true);await stackChanged({ROOT_APP:[context.ui.comp('MAIN').getId(),context.ui.comp('COLORS').getId()]});},close:async function(name){closed.push(name);await onVisible('MAIN',true);}
    },log:{warn:function(){},info:function(){}},loop:function(name,fps,fn){loops[name]=fn;}};
    vm.runInNewContext(fs.readFileSync(__dirname+'/../apps/dorin_ambientdrive/main.js','utf8'),{require:function(name){
        if(name==='./ui-schema')return schema;
        if(name==='./artwork')return {create:function(){return {render:function(color){return Buffer.from(color===null?'base':color);}};}};
        if(name==='./native-preview')return {create:function(){return {set:function(name,color){nativeCalls++;if(nativePreviewFail)return Promise.reject(new Error('Native scene unavailable'));previews.push({name:name,color:color===null?'base':color,source:'native'});return Promise.resolve();}};}};
        if(name==='./native-focus')return {apply:function(){focusRequested++;return new Promise(function(){});}};
        if(name==='./native-swatches')return {clear:function(){return Promise.resolve();},create:function(){return {set:function(name,color,modeRow){glyphs.push({name:name,color:color,modeRow:modeRow});return swatchFail?Promise.reject(new Error('HMI resource denied')):Promise.resolve();},invalidate:function(){}};}};
        if(name==='./kit/mgu')return {run:function(impl){finished=Promise.resolve(impl.start(context));return finished;}};
        if(name==='./client')return {request:async function(req){
            ops.push(req);if(req==='status'&&statusGate)await statusGate;if(fail)throw new Error('Unavailable');
            var op=typeof req==='string'?req:req.op;
            if(op==='enable')config.enabled=true;if(op==='disable')config.enabled=false;
            if(op==='set-rule')config=model.change(config,req.mode,req.color);
            return {enabled:config.enabled,telemetryReady:true,rules:config.rules,palette:Object.keys(model.colors),availableModes:['sport','comfort','adaptive','eco_pro','manual'],phase:servicePhase||(config.enabled?'active':'disabled'),lastColor:'green',lastError:serviceError};
        }};
        throw new Error(name);
    },console:console});
    await finished;
    async function back(){await onVisible('COLORS',false);await stackChanged({ROOT_APP:[context.ui.comp('MAIN').getId()]});}
    assert.strictEqual(focusRequested,1,'An unanswered optional focus update never holds up app initialization');
    assert.deepStrictEqual(ops,['status']);assert.strictEqual(checked.ENABLED,false);assert.strictEqual(previews.pop().color,'green');
    assert.strictEqual(nativeCalls,0,'An available original bitmap bypasses the unlit native scene');
    servicePhase='waiting';serviceError='Service unavailable for call get:statusFESVehicleDynamicSwitchHMI()';
    await loops.MAIN();assert.strictEqual(sids['STATUS:Text'],'SID_AD_PHASE_WAITING','An unavailable driving-mode service is not a failed color-write confirmation');
    servicePhase='unconfirmed';serviceError='Color change not confirmed';await loops.MAIN();assert.strictEqual(sids['STATUS:Text'],'SID_AD_PHASE_ERROR');
    servicePhase=null;serviceError=null;
    assert.strictEqual(visible.MODE_MANUAL,true);assert.strictEqual(visible.MODE_COMFORT,true);assert.strictEqual(visible.MODE_ADAPTIVE,true);assert.strictEqual(typeof callbacks.MODE_ADAPTIVE,'function');assert.strictEqual(callbacks.MODE_SPORT_PLUS,undefined);assert.strictEqual(callbacks.MODE_ELECTRIC,undefined);
    await callbacks.MODE_ADAPTIVE();assert.strictEqual(sids['COLORS_TITLE:Text'],'SID_DORIN_AMBIENTDRIVE_MODE_ADAPTIVE');
    await callbacks.COLOR_LILAC();assert.strictEqual(config.rules.adaptive,'lilac');assert.strictEqual(config.rules.comfort,'green');
    assert.strictEqual(closed.length,0,'Adaptive selection also stays open');await back();
    await callbacks.MODE_COMFORT();assert.strictEqual(sids['COLORS_TITLE:Text'],'SID_DORIN_AMBIENTDRIVE_MODE_COMFORT');
    assert.strictEqual(checked.COLOR_GREEN,true);await callbacks.COLOR_BLUE();
    assert.strictEqual(config.rules.comfort,'blue');assert.strictEqual(config.rules.adaptive,'lilac');
    await callbacks.COLOR_GREEN();await back();
    await focuses.MODE_ADAPTIVE({value:true});assert.strictEqual(previews.pop().color,'lilac','Adaptive previews its own choice');
    await callbacks.MODE_ADAPTIVE();await callbacks.COLOR_NONE();await back();
    assert.strictEqual(config.rules.adaptive,null);assert.strictEqual(config.rules.comfort,'green');
    assert.ok(glyphs.some(function(g){return g.name==='MODE_ADAPTIVE'&&g.color===null&&g.modeRow;}),'Adaptive STANDARD uses the existing centered indicator');
    await focuses.MODE_SPORT({value:true});assert.strictEqual(previews.pop().color,'orange');
    await callbacks.MODE_SPORT({subType:0});assert.strictEqual(opened.pop(),'COLORS');
    assert.strictEqual(sids['COLORS_TITLE:Text'],'SID_DORIN_AMBIENTDRIVE_MODE_SPORT');
    assert.strictEqual(properties['COLORS:DefaultFocusComponent'],components.COLOR_ORANGE.id);
    assert.strictEqual(checked.COLOR_ORANGE,true);assert.strictEqual(checked.COLOR_BLUE,false);
    assert.ok(glyphs.some(function(g){return g.name==='COLOR_LILAC_WHITE'&&g.color==='lilac_white';}));
    previews.length=0;var before=ops.length;
    await focuses.COLOR_ORANGE_WHITE({row:0,value:true});assert.strictEqual(previews.pop().color,'orange_white');
    await focuses.COLOR_BLUE_WHITE({row:0,value:false});assert.strictEqual(previews.length,0,'Blur does not change the preview');
    assert.strictEqual(ops.length,before,'Focusing colors never calls the daemon');assert.strictEqual(config.rules.sport,'orange');
    var writes=colorSelectionWrites;await loops.COLORS();assert.strictEqual(colorSelectionWrites,writes,'Unchanged polling preserves the selection/cursor');assert.strictEqual(previews.length,0,'Polling preserves focused color');
    before=ops.length;for(var type of [4,5,6,8,10])await callbacks.COLOR_BLUE({subType:type});assert.strictEqual(ops.length,before,'Scroll/current/abort do not commit');
    await callbacks.COLOR_BLUE({subType:9});assert.strictEqual(config.rules.sport,'blue');assert.strictEqual(closed.length,0,'Saving a color leaves the picker open');assert.strictEqual(previews.pop().color,'blue');
    await callbacks.COLOR_GREEN({subType:0});assert.strictEqual(config.rules.sport,'green');assert.strictEqual(checked.COLOR_GREEN,true);assert.strictEqual(checked.COLOR_BLUE,false);
    await callbacks.COLOR_BLUE({subType:0});assert.strictEqual(config.rules.sport,'blue');assert.strictEqual(closed.length,0,'Multiple choices can be saved without reopening the list');
    before=ops.filter(function(x){return x.op==='set-rule';}).length;await focuses.COLOR_LILAC_WHITE({value:true});await back();
    var restored=previews.pop();assert.strictEqual(restored.name,'INTERIOR_PREVIEW');assert.strictEqual(restored.color,'blue','Back restores the saved rule preview while the parent remained visible');
    assert.strictEqual(ops.filter(function(x){return x.op==='set-rule';}).length,before,'Back never commits a focused-only color');
    await callbacks.MODE_MANUAL();assert.strictEqual(checked.COLOR_NONE,true);
    await focuses.COLOR_NONE({value:true});assert.strictEqual(previews.pop().color,'green','STANDARD previews actual current color');
    before=ops.filter(function(x){return x.op==='set-rule';}).length;
    await focuses.COLOR_LILAC({value:true});await back();
    assert.strictEqual(ops.filter(function(x){return x.op==='set-rule';}).length,before,'Back cancels a focus preview');assert.strictEqual(config.rules.manual,null);
    await callbacks.MODE_SPORT();await callbacks.COLOR_NONE();assert.strictEqual(config.rules.sport,null,'STANDARD is persisted as null');assert.strictEqual(closed.length,0);await back();
    await callbacks.ENABLED();assert.strictEqual(config.enabled,true);await callbacks.ENABLED();assert.strictEqual(config.enabled,false);
    var release;statusGate=new Promise(function(resolve){release=resolve;});var poll=loops.MAIN();await Promise.resolve();var toggle=callbacks.ENABLED();release();await Promise.all([poll,toggle]);statusGate=null;assert.strictEqual(config.enabled,true,'Action arriving during polling is queued');
    await Promise.all([callbacks.ENABLED(),callbacks.ENABLED()]);assert.strictEqual(config.enabled,true,'Rapid toggles use acknowledged state');
    await callbacks.MODE_SPORT();var first=callbacks.COLOR_BRONZE({subType:9}),second=callbacks.COLOR_BLUE({subType:9});await Promise.all([first,second]);assert.strictEqual(config.rules.sport,'blue','Queued choices can return to a preceding color');
    await back();await callbacks.MODE_SPORT();fail=true;var closes=closed.length;await callbacks.COLOR_GREEN({subType:9});assert.strictEqual(config.rules.sport,'blue');assert.strictEqual(closed.length,closes,'Failed save leaves the picker open');assert.strictEqual(sids['COLOR_STATUS:Text'],'SID_AD_PHASE_UI_ERROR');
    fail=false;writes=colorSelectionWrites;await onVisible('COLORS',true);assert.ok(colorSelectionWrites>writes,'Reopen repaints native radio selections');
    before=opened.length;await callbacks.MODE_OFFROAD_ICE();assert.strictEqual(opened.length,before,'Unavailable modes cannot be opened');
    swatchFail=true;before=ops.filter(function(x){return x.op==='set-rule';}).length;await onVisible('MAIN',true);assert.strictEqual(sids['MODE_SPORT:TextNoColor'],'SID_AD_COLOR_BLUE','Unavailable native graphic retains the localized color label');assert.strictEqual(ops.filter(function(x){return x.op==='set-rule';}).length,before);
    fallbackPreviewFail=true;await onVisible('MAIN',true);assert.strictEqual(previews.pop().source,'native','Missing/unreadable bitmap falls back to the locally selected native scene');
    fallbackPreviewFail=false;imageReturnFalse=true;await onVisible('MAIN',true);assert.strictEqual(previews.pop().source,'native','A logged image-push failure must not be treated as a successful bitmap');
    nativePreviewFail=true;fallbackPreviewFail=true;before=opened.length;await callbacks.MODE_COMFORT({subType:1});assert.strictEqual(opened.length,before+1,'A native button action and failed artwork never block opening the color list');
    before=ops.length;await callbacks.COLOR_LILAC({subType:'Abort'});assert.strictEqual(ops.length,before,'Named abort events do not save a rule');
    assert.deepStrictEqual(schema.modes,model.modes);assert.strictEqual(schema.colors.length,12);assert.strictEqual(schema.colors[0],null);
    assert.strictEqual(closed.length,0,'Only the native Back action closes the picker');
    console.log('OK: picker stays open after immediate saves, repeated choices, native Back with parent still visible, saved/focused previews, STANDARD, queued actions, error retention and reopen.');
}
main().catch(function(e){console.error(e.stack);process.exitCode=1;});

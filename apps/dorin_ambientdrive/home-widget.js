'use strict';
// Home is a read-only view of the existing service. Native StringIds select
// the iDrive language independently of the app's build-time canvas language.
var Canvas = require('./kit/canvas').Canvas;
var schema = require('./ui-schema');
var PREFIX = 'SID_DORIN_AMBIENTDRIVE_MODE_';
var W = 'SID_AD_WIDGET_';
var RGB = {bronze:'#d8aa75',orange:'#ff872d',white:'#edf5ff',blue:'#2877ff',green:'#19d2a2',lilac:'#b47af6'};
function view(status) {
    var out = {mode:null,color:undefined,status:'UNAVAILABLE',confirmed:false};
    if (!status) return out;
    if (!status.enabled) { out.status='OFF'; return out; }
    if (!status.telemetryReady || schema.modes.indexOf(status.mode)<0 ||
        ['waiting','unknown_mode','setup_required','disabled'].indexOf(status.phase)>=0) {
        out.status='WAITING'; return out;
    }
    out.mode=status.mode;
    var color=status.rules && status.rules[status.mode];
    if (schema.colors.indexOf(color)<0) { out.mode=null;out.status='WAITING';return out; }
    out.color=color;
    if (color===null) out.status='STANDARD';
    else if (status.phase==='ambient_off') out.status='AMBIENT_OFF';
    else if (status.phase==='applying' || status.phase==='observing') out.status='APPLYING';
    else if (status.phase==='active' && status.confirmedByReadback===true && status.lastColor===color) {
        out.status='ON';out.confirmed=true;
    } else out.status='UNCONFIRMED';
    return out;
}
function cells(v) {
    return {Title:['SID_DORIN_AMBIENTDRIVE_WIDGET_NAME','StringId'],
        TextRecordings:[v.mode ? PREFIX+v.mode.toUpperCase() : W+'NO_DATA','StringId'],
        TextCam:['','Text'],TimeElapsed:[W+v.status,'StringId'],TimeRemaining:['','Text'],
        ProgressbarVisible:[false,'Bool'],ErrorInfo:[false,'Bool'],background:[true,'Bool']};
}
function draw(v, small) {
    var cv=small?new Canvas(72,72):new Canvas(768,512).clear('#080d16');
    if(!small)cv.gradientRect(0,0,768,512,[[0,'#0e1724'],[1,'#03060b']]);
    if(typeof v.color!=='string')return cv;
    var pair=/_white$/.test(v.color), rgb=RGB[v.color.replace(/_white$/,'')];
    if(!rgb)return cv;
    var x=small?5:495, y=small?5:219, size=small?62:112;
    cv.fillRect(x,y,size,size,rgb);
    if(pair)cv.fillRect(x,y+size/2,size,size/2,RGB.white);
    return cv;
}
function start(ctx, client, options) {
    if (!ctx.widget || typeof ctx.widget.loop!=='function') return null;
    options=options||{};
    var now=options.now||Date.now, latest=null, sampledAt=-Infinity, pending=null;
    var previous=Object.create(null), frames=Object.create(null), graphics=Object.create(null), warned=false;
    function read() {
        if(pending)return pending;
        if(now()-sampledAt<1000)return Promise.resolve(latest);
        pending=Promise.resolve().then(function(){return client.request('status',null,2000);})
            .then(function(s){latest=s;warned=false;},function(e){
                latest=null;
                if(!warned){ctx.log.warn('Ambient Drive Home status: '+e.message);warned=true;}
            }).then(function(){sampledAt=now();pending=null;return latest;});
        return pending;
    }
    ctx.widget.onChange(function(){
        previous=Object.create(null);frames=Object.create(null);sampledAt=-Infinity;
        if(typeof ctx.widget.instances==='function'&&!ctx.widget.instances().length){graphics=Object.create(null);latest=null;}
    });
    ctx.widget.loop(1,async function(inst){
        if(inst.visible===false)return null;
        var v=view(await read()), values=cells(v), old=previous[inst.spawnId]||(previous[inst.spawnId]={});
        var changes=[], force=old._sentAt!==undefined&&now()-old._sentAt>=5000;
        Object.keys(values).forEach(function(name){
            var pair=values[name], key=JSON.stringify(pair);
            if(force||old[name]!==key) changes.push(Promise.resolve(ctx.widget.set(inst.spawnId,name,pair[0],pair[1]))
                .then(function(){old[name]=key;}));
        });
        await Promise.all(changes);
        if(changes.length)old._sentAt=now();
        var layout=inst.big?'large':'small', key=JSON.stringify([layout,v.color]);
        // Home can stay visible for hours. Avoid repeatedly writing identical
        // PNGs; refresh on state/lifecycle changes, with a slow recovery retry.
        var sent=frames[inst.spawnId];
        if(sent&&sent.key===key&&now()-sent.at<30000)return null;
        if(!graphics[layout] || graphics[layout].key!==key)graphics[layout]={key:key,frame:draw(v,!inst.big)};
        frames[inst.spawnId]={key:key,at:now()};
        return graphics[layout].frame;
    });
    return {view:view};
}
module.exports={start:start,view:view,cells:cells,draw:draw};

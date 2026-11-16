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
        TextCam:[v.color===undefined ? W+'NO_DATA' : 'SID_AD_COLOR_'+(v.color===null?'NONE':v.color.toUpperCase()),'StringId'],
        TimeElapsed:[W+v.status,'StringId'],TimeRemaining:[W+'COLOR_SET','StringId'],
        ProgressbarVisible:[false,'Bool'],ErrorInfo:[false,'Bool'],background:[true,'Bool']};
}
function draw(v) {
    var cv=new Canvas(768,512).clear('#080d16');
    cv.gradientRect(0,0,768,512,[[0,'#0e1724'],[1,'#03060b']]);
    var key=v.color, base=typeof key==='string'?key.replace(/_white$/,''):null;
    var rgb=RGB[base]||'#627185', pair=typeof key==='string'&&/_white$/.test(key);
    var color=require('./kit/canvas').rgba(rgb);
    // Decorative front/door strips; the HMI owns all foreground text/layout.
    // Empty/disabled/unavailable views stay neutral instead of showing stale colors.
    var segments=[[120,292,226,244],[226,244,542,244],[542,244,648,292]];
    segments.forEach(function (s) {
        cv.line(s[0],s[1],s[2],s[3],34,[color[0],color[1],color[2],12]);
        cv.line(s[0],s[1],s[2],s[3],15,[color[0],color[1],color[2],35]);
        cv.line(s[0],s[1],s[2],s[3],4,[color[0],color[1],color[2],180]);
        if(pair)cv.line(s[0],s[1]+9,s[2],s[3]+9,3,[237,245,255,180]);
    });
    return cv;
}
function start(ctx, client, options) {
    if (!ctx.widget || typeof ctx.widget.loop!=='function') return null;
    options=options||{};
    var now=options.now||Date.now, latest=null, sampledAt=-Infinity, pending=null;
    var previous=Object.create(null), frames=Object.create(null), graphic=null, graphicKey=null, warned=false;
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
        if(typeof ctx.widget.instances==='function'&&!ctx.widget.instances().length){graphic=null;graphicKey=null;latest=null;}
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
        if(!inst.big)return null; // BMW's small layout uses native text cells.
        var key=JSON.stringify([v.color,v.status]);
        if(graphicKey!==key){graphic=draw(v);graphicKey=key;}
        // Home can stay visible for hours. Avoid repeatedly writing identical
        // PNGs; refresh on state/lifecycle changes, with a slow recovery retry.
        var sent=frames[inst.spawnId];
        if(sent&&sent.key===key&&now()-sent.at<30000)return null;
        frames[inst.spawnId]={key:key,at:now()};
        return graphic;
    });
    return {view:view};
}
module.exports={start:start,view:view,cells:cells,draw:draw};

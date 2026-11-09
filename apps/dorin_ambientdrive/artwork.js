'use strict';
// Read the vehicle's own installed artwork. No OEM pixels are shipped with the app.
// Ramses 19.0.14 layout verified against the G01 interior-light resource pack.
var fs = require('fs'), path = require('path'), zlib = require('zlib');
var ROOT = '/mnt/dataro/dataro1/hmi/bmw/id7/assetDB/ContentPreview/Interieur';
var SLOTS = {white:'S02',orange:'S04',green:'S06',lilac:'S08',bronze:'S10',blue:'S12',
    orange_white:'S14',green_white:'S16',lilac_white:'S18',bronze_white:'S20',blue_white:'S22'};
function check(ok, message) { if (!ok) throw new Error('Ambient artwork: ' + message); }
function hash(b, p) {
    function word(at) { return b.toString('hex',at,at+8).match(/../g).reverse().join(''); }
    return word(p) + word(p+8);
}
function parse(data, index) {
    check(Buffer.isBuffer(data) && data.length <= 33554432, 'pack size');
    var prefix = '[RamsesVersion:19.0.14]\n', end = data.indexOf(10,prefix.length)+1;
    check(data.toString('ascii',0,prefix.length) === prefix && end > prefix.length && end < 120 && data.length > end+32, 'unsupported Ramses version/header');
    function offset(p) { check(data.readUInt32LE(p+4)===0,'64-bit offset range');return data.readUInt32LE(p); }
    var section=offset(end), toc=offset(end+8);
    check(section===end+16 && section+16<=data.length && toc+4<=data.length,'section bounds');
    var count=data.readUInt32LE(section+12), names={}, entries={}, handles={};
    check(count>0 && count<=64 && section+16+count*52===toc,'client record layout');
    check(typeof index==='string' && Buffer.byteLength(index)<32768,'index size');
    index.trim().split(/\r?\n/).forEach(function(line){
        var m=/^0x([0-9a-f]{1,32}) ([A-Za-z0-9_.-]+\.png)$/.exec(line);
        check(m,'index record');var id=('00000000000000000000000000000000'+m[1]).slice(-32);
        check(!names[id],'duplicate resource id');names[id]=m[2];
    });
    for(var i=0;i<count;i++){
        var p=section+16+i*52, id=hash(data,p+24), name=names[id];
        var width=data.readUInt32LE(p+40), height=data.readUInt32LE(p+44), format=data.readUInt32LE(p+48);
        check(name && !entries[name] && format===5 && width>0 && height>0 && width<=4096 && height<=2048 && width*height*4<=16777216,'texture record');
        var item={name:name,width:width,height:height,hash:hash(data,p+8)};
        entries[name]=item;check(!handles[item.hash],'duplicate content hash');handles[item.hash]=item;
    }
    check(data.readUInt32LE(toc)===count && toc+4+count*36<=data.length,'TOC bounds');
    var ranges=[];
    for(var j=0;j<count;j++){
        var q=toc+4+j*36, it=handles[hash(data,q+4)];
        check(it && it.offset===undefined && data.readUInt32LE(q)===3,'TOC resource');
        it.raw=data.readUInt32LE(q+20);it.compressed=data.readUInt32LE(q+24);
        it.offset=data.readUInt32LE(q+28);it.size=data.readUInt32LE(q+32);
        check(it.raw===it.width*it.height*4 && it.compressed>0 && it.size===it.compressed+45 && it.offset+it.size<=data.length,'texture data bounds');
        var a=it.offset;
        check(data.readUInt32LE(a)===3 && data.readUInt32LE(a+4)===0 && data.readUInt32LE(a+8)===1 &&
            data.readUInt32LE(a+12)===it.compressed && data.readUInt32LE(a+16)===it.raw &&
            data.readUInt32LE(a+24)===it.width && data.readUInt32LE(a+28)===it.height &&
            data.readUInt32LE(a+32)===9 && data.readUInt32LE(a+36)===1 && data.readUInt32LE(a+40)===it.raw && data[a+44]===0,'RGBA/LZ4 metadata');
        ranges.push(it);
    }
    ranges.sort(function(a,b){return a.offset-b.offset;});var last=toc+4+count*36;
    ranges.forEach(function(it){check(it.offset===last,'overlapping or missing payload');last+=it.size;});
    check(last===data.length,'trailing or missing payload');
    return entries;
}
function lz4(input, size) {
    check(Number.isInteger(size) && size>0 && size<=16777216,'decoded size');
    var output=Buffer.alloc(size), i=0,o=0;
    function length(n) {
        if(n===15){var extra;do{check(i<input.length,'truncated LZ4 length');extra=input[i++];n+=extra;check(n<=size,'LZ4 length overflow');}while(extra===255);}
        return n;
    }
    while(i<input.length){
        var token=input[i++], literals=length(token>>>4);
        check(i+literals<=input.length && o+literals<=size,'LZ4 literal bounds');
        input.copy(output,o,i,i+literals);i+=literals;o+=literals;
        if(i===input.length)break;
        check(i+2<=input.length,'LZ4 offset bounds');var back=input.readUInt16LE(i);i+=2;
        check(back>0 && back<=o,'LZ4 reference bounds');var matched=length(token&15)+4;
        check(o+matched<=size,'LZ4 match bounds');
        for(var n=0;n<matched;n++){output[o]=output[o-back];o++;}
    }
    check(o===size,'incomplete LZ4 output');return output;
}
var crcTable=[];
for(var t=0;t<256;t++){var c=t;for(var k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crcTable[t]=c>>>0;}
function chunk(type, bytes) {
    var label=Buffer.from(type), crc=0xffffffff, payload=Buffer.concat([label,bytes]);
    for(var i=0;i<payload.length;i++)crc=crcTable[(crc^payload[i])&255]^(crc>>>8);
    var out=Buffer.alloc(bytes.length+12);out.writeUInt32BE(bytes.length,0);payload.copy(out,4);out.writeUInt32BE((crc^0xffffffff)>>>0,out.length-4);return out;
}
function png(width,height,rgba) {
    check(rgba.length===width*height*4,'PNG pixels');
    var row=width*4,raw=Buffer.alloc(height*(row+1));
    for(var y=0;y<height;y++)rgba.copy(raw,y*(row+1)+1,(height-1-y)*row,(height-y)*row);
    var ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;
    return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:6})),chunk('IEND',Buffer.alloc(0))]);
}
function compose(base, overlay) {
    check(base.length===overlay.length && base.length%4===0,'layer dimensions');var out=Buffer.alloc(base.length);
    for(var p=0;p<base.length;p+=4){
        var a=overlay[p+3], a0=base[p+3], ao=a+Math.floor((a0*(255-a)+127)/255);
        for(var c=0;c<3;c++)out[p+c]=!ao?0:Math.min(255,Math.floor((overlay[p+c]*a+Math.floor((base[p+c]*a0*(255-a)+127)/255)+Math.floor(ao/2))/ao));
        out[p+3]=ao;
    }
    return out;
}
function discover(root) {
    var candidates=[];
    fs.readdirSync(root).forEach(function(model){
        if(!/^[A-Z][0-9]{2}$/.test(model))return;
        var lights=path.join(root,model,'Interieur_Licht');
        try{fs.readdirSync(lights).forEach(function(name){
            if(!/^[A-Za-z0-9_-]*Settings_Interiorlight$/.test(name))return;
            var file=path.join(lights,name,'wbitmaps.res');if(fs.statSync(file).isFile())candidates.push({file:file,model:model});
        });}catch(e){if(e.code!=='ENOENT')throw e;}
    });
    check(candidates.length===1,'vehicle artwork absent or ambiguous');return candidates[0];
}
function create(options) {
    options=options||{};var data, entries, base, slots, source, cache=[];
    function load() {
        if(data)return;
        var found=options.file?{file:options.file,model:options.model||'local'}:discover(options.root||ROOT);
        check(fs.statSync(found.file).size<=33554432,'pack size');
        var bytes=fs.readFileSync(found.file),index=fs.readFileSync(options.index||found.file+'.ids','utf8');
        var parsed=parse(bytes,index),next={};
        Object.keys(Object.assign({base:'S01'},SLOTS)).forEach(function(color){
            var suffix=(color==='base'?'S01':SLOTS[color])+'.png';
            var names=Object.keys(parsed).filter(function(n){return /_Ambient_ContentPreview_V[0-9]+_S[0-9]+\.png$/.test(n) && n.slice(-suffix.length)===suffix;});
            check(names.length===1,'missing/ambiguous '+color+' layer');next[color]=parsed[names[0]];
        });
        Object.keys(next).forEach(function(k){check(next[k].width===next.base.width && next[k].height===next.base.height,'layer size mismatch');});
        var baseItem=next.base, decoded=lz4(bytes.slice(baseItem.offset+45,baseItem.offset+baseItem.size),baseItem.raw);
        data=bytes;entries=parsed;slots=next;source=found;base=decoded;
    }
    function decode(item){return lz4(data.slice(item.offset+45,item.offset+item.size),item.raw);}
    return {render:function(color){
        check(color===null || Object.prototype.hasOwnProperty.call(SLOTS,color),'unknown color');load();
        var hit=cache.filter(function(it){return it.color===color;})[0];if(hit)return hit.png;
        var it=slots.base,pixels=color===null?base:compose(base,decode(slots[color]));
        var encoded=png(it.width,it.height,pixels);cache.push({color:color,png:encoded});if(cache.length>2)cache.shift();return encoded;
    },info:function(){load();return {model:source.model,file:source.file,width:slots.base.width,height:slots.base.height,resources:Object.keys(entries).length};}};
}
module.exports={create:create,parse:parse,lz4:lz4,png:png,compose:compose,discover:discover,slots:SLOTS};

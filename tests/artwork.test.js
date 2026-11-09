'use strict';
var assert=require('assert'),fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto');
var art=require('../apps/dorin_ambientdrive/artwork');
assert.strictEqual(art.lz4(Buffer.from([0x32,65,66,67,3,0]),9).toString(),'ABCABCABC');
assert.throws(function(){art.lz4(Buffer.from([0,0,0]),4);},/reference/);
assert.throws(function(){art.lz4(Buffer.from([0xf0]),1);},/truncated/);
assert.throws(function(){art.lz4(Buffer.from([0x10,1]),2);},/incomplete/);
assert.throws(function(){art.lz4(Buffer.from([0x30,1,2,3]),1);},/bounds/);
var base=Buffer.from([255,0,0,255,0,0,0,0]),over=Buffer.from([0,0,255,128,0,255,0,255]);
assert.deepStrictEqual(art.compose(base,over),Buffer.from([127,0,128,255,0,255,0,255]));
function pngPixels(png){
    assert.strictEqual(png.slice(0,8).toString('hex'),'89504e470d0a1a0a');
    var pos=8,chunks=[];
    while(pos<png.length){var n=png.readUInt32BE(pos),type=png.toString('ascii',pos+4,pos+8);if(type==='IDAT')chunks.push(png.slice(pos+8,pos+8+n));pos+=n+12;}
    return zlib.inflateSync(Buffer.concat(chunks));
}
assert.deepStrictEqual(pngPixels(art.png(1,2,Buffer.from([1,2,3,255,4,5,6,128]))),Buffer.from([0,4,5,6,128,0,1,2,3,255]));
var root=fs.mkdtempSync('/tmp/ambient-artwork-');
try{
    assert.throws(function(){art.discover(root);},/absent/);
    ['G01','G30'].forEach(function(model){var dir=path.join(root,model,'Interieur_Licht',model+'_Settings_Interiorlight');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'wbitmaps.res'),'');});
    assert.throws(function(){art.discover(root);},/ambiguous/);
}finally{fs.rmSync(root,{recursive:true,force:true});}
if(process.argv[2]){
    var pack=fs.readFileSync(process.argv[2]),index=fs.readFileSync(process.argv[3],'utf8');
    var fixture=require('./artwork-hashes-g01.json'),hash=function(b){return crypto.createHash('sha256').update(b).digest('hex');};
    assert.strictEqual(hash(pack),fixture.packSha256);
    var entries=art.parse(pack,index);assert.strictEqual(Object.keys(entries).length,17);
    Object.keys(entries).forEach(function(name){var it=entries[name],raw=art.lz4(pack.slice(it.offset+45,it.offset+it.size),it.raw);assert.strictEqual(hash(raw),fixture.textures[name],name+' matches independent liblz4');});
    assert.throws(function(){art.parse(pack.slice(0,-1),index);},/bounds|payload/);
    var changed=Buffer.from(pack);changed.writeUInt32LE(0xffffffff,117);assert.throws(function(){art.parse(changed,index);},/record/);
    var scene=art.create({file:process.argv[2],index:process.argv[3],model:'G01'}),seen={};
    Object.keys(art.slots).forEach(function(color){var png=scene.render(color);assert.strictEqual(png.readUInt32BE(16),1281);assert.strictEqual(png.readUInt32BE(20),644);var pixels=pngPixels(png);assert.strictEqual(pixels.length,644*(1281*4+1));assert.ok(!seen[hash(pixels)],'Each color has distinct original pixels');seen[hash(pixels)]=true;});
    assert.throws(function(){scene.render('invented');},/unknown/);
    console.log('OK: full G01 pack; all 17 textures match independent liblz4; 11 distinct previews; exact image bounds; corrupt input rejected.');
}
console.log('OK: bounded LZ4 overlap/truncation checks, alpha compositing, PNG orientation, missing/ambiguous model handling.');

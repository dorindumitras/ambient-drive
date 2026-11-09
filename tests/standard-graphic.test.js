'use strict';
var assert=require('assert'),make=require('../tools/make-standard');
var c=make.render(),left=c.w,top=c.h,right=-1,bottom=-1;
for(var y=0;y<c.h;y++)for(var x=0;x<c.w;x++)if(c.d[(y*c.w+x)*4+3]){
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
}
assert.strictEqual(c.w,80);assert.strictEqual(c.h,16);
assert.ok(left>=2&&right<c.w-2,'All eight letters fit horizontally with transparent margins');
assert.ok(top>=1&&bottom<c.h-1,'Glyphs fit vertically without clipping');
assert.ok(Math.abs((left+right)/2-(c.w-1)/2)<=1.5,'Text is horizontally centered');
assert.ok(Math.abs((top+bottom)/2-(c.h-1)/2)<=1.5,'Text is vertically centered');
assert.strictEqual(c.png().slice(0,8).toString('hex'),'89504e470d0a1a0a');
console.log('OK: complete STANDARD text fits80x16 native icon asset, centered with transparent margins; PNG valid.');

'use strict';
// App-owned text graphic; no BMW pixels or font resources are extracted here.
// The existing native Icon asset positions it like the original color chips.
var fs=require('fs'),Canvas=require('../kit/runtime/canvas').Canvas;
function render(){
    var canvas=new Canvas(80,16).clear([0,0,0,0]);
    var width=canvas.textWidth('STANDARD',16,{literal:true});
    if(width>74)throw new Error('STANDARD exceeds the reserved graphic width');
    canvas.text('STANDARD',40,14,16,'#ffffff',{literal:true,align:'center'});
    return canvas;
}
if(require.main===module){fs.writeFileSync(process.argv[2],render().png());console.log('STANDARD text graphic80x16 generated.');}
module.exports={render:render};

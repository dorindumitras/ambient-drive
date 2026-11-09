'use strict';
var assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
async function main(){
    var source=fs.readFileSync(path.join(__dirname,'../kit/runtime/mgu.js'),'utf8');
    // Execute only our Ui class with independent resource stubs, never OEM code.
    var a=source.indexOf('class Ui {'),z=source.indexOf('/* ---------------- home-screen widget');
    assert.ok(a>0&&z>a);
    var dir=fs.mkdtempSync('/tmp/ambient-image-result-'),registrationFail=false,setFail=false,warnings=[];
    try{
        var Ui=vm.runInNewContext(source.slice(a,z)+'\nUi',{fs:fs,path:path,Buffer:Buffer,Date:Date,
            RHMI_RES:dir,RUN_TAG:'fixture',HmiText:function(){},
            log:{info:function(){},warn:function(s){warnings.push(s);}}});
        var component={setValue:function(row,cell,handle,type){assert.strictEqual(cell,'Illustration');assert.strictEqual(handle,7);assert.strictEqual(type,'Asset');return setFail?Promise.reject(new Error('HMI refused image')):Promise.resolve();}};
        var ui=new Ui({rhmiApplication:{getByName:function(){return component;},getResourceBundle:function(){return {
            createResourceHandles:function(){return registrationFail?Promise.reject(new Error('Resource unavailable')):Promise.resolve();},
            getResourceHandle:function(){return 7;},destroyResourceHandles:function(){return Promise.resolve();}
        };}}});
        var bytes=Buffer.from('test PNG payload');
        assert.strictEqual(await ui.image('PREVIEW',bytes,'Illustration'),true);
        registrationFail=true;assert.strictEqual(await ui.image('PREVIEW',bytes,'Illustration'),false,'Resource failures reach the preview fallback decision');
        registrationFail=false;setFail=true;assert.strictEqual(await ui.image('PREVIEW',bytes,'Illustration'),false);
        setFail=false;assert.strictEqual(await ui.image('PREVIEW',bytes,'Illustration'),true,'An image failure does not poison later pushes');
        assert.ok(warnings.some(function(s){return s.indexOf('Resource unavailable')>=0;}));
    }finally{fs.rmSync(dir,{recursive:true,force:true});}
    console.log('OK: image success/failure results, resource failure, HMI refusal and recovery; own code only.');
}
main().catch(function(e){console.error(e.stack);process.exitCode=1;});

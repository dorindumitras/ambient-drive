'use strict';
var assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm'),net=require('net');
var boot=require('../native/dorin-ambient/bootstrap'),groups=require('../native/dorin-ambient/socket-group');
var service=require('../native/dorin-ambient/daemon'),client=require('../native/dorin-ambient/client');
function fakeProcess(gid){var cwd='/var/opt/dorin-ambient/current';return {env:{HOME:'/wrong'},getuid:function(){return 0;},getgid:function(){return gid;},chdir:function(s){cwd=s;},cwd:function(){return cwd;}};}
async function main(){
    var passwd='daemon:x:1:1:daemon:/usr/sbin:/bin/false\nroot:x:0:0:root:/home/root:/bin/sh\n';
    assert.strictEqual(boot.accountHome(passwd),'/home/root');
    assert.throws(function(){boot.accountHome('root:x:0:0::relative:/bin/sh');},/resolve/);
    assert.throws(function(){boot.accountHome(passwd+passwd);},/resolve/);
    var proc=fakeProcess(0),files={readFileSync:function(file){assert.strictEqual(file,'/etc/passwd');return passwd;},statSync:function(home){assert.strictEqual(home,'/home/root');return {isDirectory:function(){return true;}};}};
    var context=boot.prepare(files,proc);assert.strictEqual(context.gid,0);assert.strictEqual(proc.env.HOME,'/home/root');assert.strictEqual(proc.cwd(),'/home/root');
    assert.throws(function(){boot.prepare(files,fakeProcess(12202));},/primary group/,'Reproduces the rejected primary group from the vehicle log');
    var text=fs.readFileSync(__dirname+'/../native/dorin-ambient/bootstrap.js','utf8'),module={exports:{}},loaded=false;
    proc=fakeProcess(0);
    vm.runInNewContext(text,{module:module,exports:module.exports,process:proc,console:{log:function(){}},require:function(name){
        if(name==='fs')return files;
        if(name==='./daemon'){assert.strictEqual(proc.cwd(),'/home/root');assert.strictEqual(proc.env.HOME,'/home/root');loaded=true;return {main:function(){return Promise.resolve('started');}};}
        throw new Error('Unexpected early/native load '+name);
    }});
    assert.strictEqual(await module.exports.main(),'started');assert.ok(loaded,'Native-capable daemon is loaded only after normalization');
    var groupText='root:x:0:\ntm_oap_app:x:12202:\n';
    assert.strictEqual(groups.groupId(groupText,'tm_oap_app'),12202);
    assert.throws(function(){groups.groupId(groupText,'missing');},/resolve/);
    assert.throws(function(){groups.groupId('tm_oap_app:x:NaN:','tm_oap_app');},/resolve/);
    var dir=fs.mkdtempSync('/tmp/ambient-transport-test-'),socket=path.join(dir,'control.sock'),stateDir=path.join(dir,'state'),daemon;
    try{
        daemon=service.create({socketPath:socket,stateDir:stateDir,driver:{connect:function(){throw new Error('Disabled service must not connect');}},profile:{knownModes:['comfort'],pendingSignals:[]},pollMs:5,log:function(){}});
        await daemon.start();
        // Exercise real chown/chmod/stat and a real client after assignment.
        // The host's own group is used here; production resolves tm_oap_app.
        groups.assign(socket,process.getgid());
        assert.strictEqual(fs.statSync(socket).gid,process.getgid());assert.strictEqual(fs.statSync(socket).mode&0o777,0o660);
        assert.strictEqual((await client.request('status',socket)).version,'0.2.4');
        assert.strictEqual((await client.request('status',socket)).enabled,false);
        var bad=service.create({socketPath:socket,stateDir:stateDir,socketGroup:'ambient_drive_group_that_does_not_exist',profile:{pendingSignals:[]},driver:{}});
        await assert.rejects(bad.start(),/resolve socket group/);
        assert.strictEqual((await client.request('status',socket)).enabled,false,'Failed group lookup must not disturb an existing instance');
    }finally{
        if(daemon)await daemon.stop();fs.rmSync(dir,{recursive:true,force:true});
    }
    var unit=fs.readFileSync(__dirname+'/../native/dorin-ambient/dorin-ambient.service','utf8');
    assert.ok(/^Group=root$/m.test(unit));assert.ok(/ExecStart=\/usr\/bin\/node .*\/bootstrap\.js/.test(unit));
    console.log('OK: verified root launch context before native loading, account HOME/cwd, explicit socket group/0660, real IPC and missing-group rejection.');
}
main().catch(function(e){console.error(e.stack);process.exitCode=1;});

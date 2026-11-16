'use strict';
var assert=require('assert'),fs=require('fs'),vm=require('vm'),EventEmitter=require('events').EventEmitter;
function load(){
    var socket=new EventEmitter(),module0={exports:{}},timeout,written=[],destroyed=0;
    socket.setTimeout=function(ms,fn){timeout={ms:ms,fn:fn};};socket.write=function(s){written.push(s);};socket.destroy=function(){destroyed++;};
    vm.runInNewContext(fs.readFileSync(__dirname+'/../apps/dorin_ambientdrive/client.js','utf8'),{
        module:module0,exports:module0.exports,require:function(n){assert.strictEqual(n,'net');return {createConnection:function(p){assert.strictEqual(p,'/dev/shm/dorin-ambient/control.sock');return socket;}};},Buffer:Buffer});
    return {client:module0.exports,socket:socket,timeout:function(){return timeout;},written:written,destroyed:function(){return destroyed;}};
}
async function main(){
    var f=load(),p=f.client.request('status',null,2000);assert.strictEqual(f.timeout().ms,2000);f.socket.emit('connect');
    assert.strictEqual(f.written[0],'{"op":"status"}\n');f.socket.emit('data',Buffer.from('{"ok":true,"status":{"enabled":false}}\n'));
    assert.strictEqual((await p).enabled,false);assert.strictEqual(f.destroyed(),1);
    f=load();p=f.client.request('status');assert.strictEqual(f.timeout().ms,12000,'Existing app calls retain the original timeout');
    f.socket.emit('error',new Error('offline'));await assert.rejects(p,/offline/);assert.strictEqual(f.destroyed(),1);
    f=load();p=f.client.request('status',null,2000);f.timeout().fn();await assert.rejects(p,/timeout/);assert.strictEqual(f.destroyed(),1,'A stalled Home read closes its socket');
    console.log('OK: Home status deadline2s, unchanged default12s, status-only wire request and socket cleanup.');
}
main().catch(function(e){console.error(e.stack);process.exitCode=1;});

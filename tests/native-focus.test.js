'use strict';
var assert = require('assert'), focus = require('../apps/dorin_ambientdrive/native-focus');
async function main() {
    var calls = [], messages = [], log = {info:function(s){messages.push(s);},warn:function(s){messages.push(s);}};
    var groups = {MAIN:{list:22,preview:23},COLORS:{list:41,preview:42}};
    var cached = ['pending row update'], sent = [], detached = false;
    await focus.apply({rhmi:{flush:function() {
        sent.push(cached); cached=[]; detached=true; return Promise.resolve();
    },update:function(batch,withoutCaching) {
        assert.strictEqual(withoutCaching,true,'Await the HMI reply, not a cached local acknowledgement');
        assert.strictEqual(detached,true,'Detach queued UI updates before an uncached update can replace them');
        detached=false;
        cached=batch;sent.push(cached);cached=[];
        calls.push(batch);
        var item = batch[0], property = Object.keys(item.data.propertyMap)[0];
        assert.strictEqual(item.type,2);
        assert.deepStrictEqual(item.data.propertyMap[property],{0:0,1:2});
        assert.ok([22,23,41,42].indexOf(item.data.componentId) >= 0,'Only layout groups receive properties');
        if (property === '15') return Promise.reject(new Error('INAVLID_PARAMETER'));
        return Promise.resolve();
    }}},groups,log);
    assert.strictEqual(calls.length,4);
    assert.deepStrictEqual(sent[0],['pending row update'],'Pending UI data is preserved');
    assert.strictEqual(sent.filter(function(p){return p.length && typeof p[0]==='object';}).length,4,'Each property uses its own acknowledged package');
    assert.strictEqual(messages.filter(function(s){return s.indexOf('applied:') >= 0;}).length,2);
    assert.strictEqual(messages.filter(function(s){return s.indexOf('refused:') >= 0;}).length,2);
    assert.ok(messages.some(function(s){return s.indexOf('MAIN.list.FocusWraparound group=22') >= 0;}));
    calls.length=0;
    await focus.apply({rhmi:{flush:function(){return Promise.resolve();},update:function(){calls.push(1);return new Promise(function(){});}}},groups,log,5);
    assert.strictEqual(calls.length,4,'Unanswered optional requests settle without blocking startup');
    assert.strictEqual(messages.filter(function(s){return s.indexOf('no reply from HMI') >= 0;}).length,4);
    await focus.apply({},null,log);
    console.log('OK: isolated group-property updates, partial HMI refusal, precise diagnostics and timeout; no preview-component focus override.');
}
main().catch(function(e){console.error(e.stack);process.exitCode=1;});

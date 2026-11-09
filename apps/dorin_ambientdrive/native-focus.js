'use strict';

// RHMI property updates for layout groups, which have no getByName() wrapper.
// Keep each request separate so a refusal identifies the exact group/property.
function apply(ui,groups,log,timeoutMs) {
    if (!groups || !ui.rhmi || typeof ui.rhmi.update !== 'function' || typeof ui.rhmi.flush !== 'function') {
        log.warn('Ambient Drive layout focus: no group metadata or RHMI update API');
        return Promise.resolve();
    }
    var requests = [];
    Object.keys(groups).forEach(function (name) {
        var group = groups[name];
        [['preview',3,'Focusable'],['list',15,'FocusWraparound']].forEach(function (item) {
            var id = group[item[0]], property = item[1], label = name + '.' + item[0] + '.' + item[2];
            if (!Number.isInteger(id) || id <= 0) {
                log.warn('Ambient Drive layout focus skipped: ' + label + ' invalid group id');
                return;
            }
            var timer;
            var update = Promise.resolve().then(function () {
                var map = {}; map[property] = {0:0,1:2}; // Value=0; ValueType=UInt
                // This SDK's cached update() resolves before the HMI replies.
                // flush() synchronously detaches its pending package; send our
                // isolated uncached request in the SAME turn, with no await in
                // between, so update(...,true) cannot replace queued UI data.
                Promise.resolve(ui.rhmi.flush()).catch(function (error) {
                    log.warn('Ambient Drive layout preflush: ' + String(error));
                });
                return ui.rhmi.update([{type:2,data:{componentId:id,propertyMap:map}}],true);
            });
            var timeout = new Promise(function (_,reject) {
                timer = setTimeout(function () { reject(new Error('no reply from HMI')); },timeoutMs || 2000);
            });
            requests.push(Promise.race([update,timeout]).then(function () {
                log.info('Ambient Drive layout focus applied: ' + label + ' group=' + id);
            }).catch(function (error) {
                log.warn('Ambient Drive layout focus refused: ' + label + ' group=' + id + ': ' + String(error));
            }).then(function () { clearTimeout(timer); }));
        });
    });
    return Promise.all(requests).then(function () {});
}
module.exports = {apply:apply};

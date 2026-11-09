'use strict';
var fs = require('fs');
var path = require('path');
function mkdir(dir) {
    if (fs.existsSync(dir)) return;
    mkdir(path.dirname(dir)); fs.mkdirSync(dir, 0o700);
}
require('./client').request('disable').catch(function () {
    var store = require('./settings-store').create('/var/opt/dorin-ambient/state');
    var config = store.load().value; config.enabled = false; store.save(config);
}).then(function () {
    console.log(JSON.stringify({status: 'Ambient Drive automation disabled'}));
}, function (e) { console.error(e.message); process.exitCode = 1; });

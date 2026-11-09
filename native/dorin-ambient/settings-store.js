'use strict';
var fs = require('fs'), path = require('path'), model = require('./model');
function mkdir(dir) {
    if (fs.existsSync(dir)) return;
    mkdir(path.dirname(dir));
    try { fs.mkdirSync(dir, 0o700); } catch (e) { if (e.code !== 'EEXIST') throw e; }
}
function create(dir) {
    mkdir(dir);
    var file = path.join(dir, 'settings.json');
    return {
        load: function () {
            try { return {value: model.settings(JSON.parse(fs.readFileSync(file, 'utf8'))), error: null}; }
            catch (e) { return {value: model.defaults(), error: e.code === 'ENOENT' ? null : 'Settings unreadable; disabled'}; }
        },
        save: function (input) {
            var value = model.settings(input), tmp = file + '.' + process.pid + '.tmp';
            var fd = fs.openSync(tmp, 'w', 0o600);
            try { fs.writeSync(fd, JSON.stringify(value) + '\n'); fs.fsyncSync(fd); }
            finally { fs.closeSync(fd); }
            fs.renameSync(tmp, file);
            var directory = fs.openSync(dir, 'r');
            try { fs.fsyncSync(directory); } finally { fs.closeSync(directory); }
            return value;
        }
    };
}
module.exports = {create: create};

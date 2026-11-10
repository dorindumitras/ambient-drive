'use strict';
// Integration check with separately fetched, pinned official MGU Store modules.
// No car connection, installation, external HTTP request or BMW binary loading.
var assert = require('assert'), fs = require('fs'), path = require('path'), crypto = require('crypto');
var root = path.resolve(__dirname, '..');
var readerRoot = path.resolve(process.argv[2] || '');
var sources = require(path.join(readerRoot, 'sources.js'));
var catalog = require(path.join(readerRoot, 'catalog.js'));
var tar = require(path.join(readerRoot, 'tar.js'));
var assets = path.join(root, 'publication/github/release-assets');
var usb = path.join(root, 'publication/stick/mgu-repo/ambient-drive-test');
var base = 'https://github.com/dorindumitras/ambient-drive/releases/download/catalog/';
var requests = [];
function sha(data) { return crypto.createHash('sha256').update(data).digest('hex'); }
async function fetch(url, headers, name, max) {
    assert.ok(url.indexOf(base) === 0, 'Unexpected URL: ' + url);
    assert.strictEqual(headers.Authorization, undefined, 'Public source requires no token');
    var filename = url.slice(base.length);
    assert.ok(/^[A-Za-z0-9@._-]+$/.test(filename));
    var data = fs.readFileSync(path.join(assets, filename));
    assert.ok(data.length <= max); requests.push({url: url, filename: filename}); return data;
}
async function check(source) {
    var ctx = {version: 'ambient-drive-audit', githubApi: 'https://api.github.com', tokenFor: function () { return ''; },
        maxRepoBytes: 32 << 20, maxBuildBytes: 64 << 20, net: {get: fetch, cached: fetch}};
    var reader = sources.reader(source, ctx), cat = await reader.catalog();
    assert.strictEqual(cat.mode, 'catalog'); assert.strictEqual(cat.components.length, 2);
    if (source.type === 'github') { assert.strictEqual(cat.channel, 'releases'); assert.strictEqual(cat.public, true); }
    var entries = cat.components.map(function (entry) { return {entry: entry, source: source.id}; });
    assert.ok(catalog.plan(entries, []).every(function (r) { return r.status === 'available'; }));
    var previous = [{id: 'dorin_ambientdrive', version: '0.2.5'}, {id: 'dorin-ambient', version: '0.2.4'}];
    assert.ok(catalog.plan(entries, previous).every(function (r) { return r.status === 'update'; }));
    var service = cat.components.find(function (c) { return c.id === 'dorin-ambient'; });
    var app = cat.components.find(function (c) { return c.id === 'dorin_ambientdrive'; });
    assert.ok(catalog.compareVersions(service.version, app.requires['dorin-ambient']) >= 0);
    assert.strictEqual(app.requires['mgu-deploy'], '0.7.11');
    for (var c of cat.components) {
        assert.strictEqual(catalog.compat(c.mguHmi, 'ID7'), 'yes');
        assert.strictEqual(catalog.compat(c.mguHmi, 'ID8'), 'no');
        assert.strictEqual(c.author, 'Dorin Dumitras'); assert.ok(!c.build, 'Catalog packages are prebuilt');
        var data = await reader.artifact(c);
        assert.strictEqual(data.length, c.artifact.size); assert.strictEqual(sha(data), c.artifact.sha256);
        var members = await tar.untgz(data, 64 << 20);
        var byName = new Map(members.map(function (m) { return [m.name, m.data]; }));
        if (c.kind === 'app') {
            var info = sources.packageInfo(members);
            assert.strictEqual(info.pkg.name, c.id); assert.strictEqual(info.pkg.version, c.version);
            assert.strictEqual(info.pkg.author, 'Dorin Dumitras');
            assert.ok(byName.has('package/' + info.pkg.main));
            assert.ok(!members.some(function (m) { return /oap-sdk|\.node$/.test(m.name); }));
        } else {
            var meta = JSON.parse(byName.get('component.json'));
            assert.strictEqual(meta.id, c.id); assert.strictEqual(meta.version, c.version);
            meta.files.forEach(function (f) { assert.strictEqual(sha(byName.get('files/' + f.path)), f.sha256); });
            assert.ok(byName.has('units/dorin-ambient.service'));
        }
        var icon = await reader.icon(c); assert.ok(sources.isIcon(icon));
        assert.strictEqual(sha(icon), c.icon.sha256);
    }
    return {source: source.type, freshInstall: 'available', previousInstall: 'update',
        components: cat.components.map(function (c) { return {id: c.id, version: c.version}; }), passed: true};
}
async function main() {
    var result = [];
    result.push(await check({id: 'ambient-drive', type: 'github', repo: 'dorindumitras/ambient-drive', channel: 'releases'}));
    result.push(await check({id: 'ambient-drive-https', type: 'https', url: base + 'catalog.json'}));
    var before = requests.length;
    result.push(await check({id: 'ambient-drive-usb', type: 'usb', root: usb}));
    assert.strictEqual(requests.length, before, 'USB resolves every artifact and icon locally');
    console.log(JSON.stringify({allChecksPassed: true, results: result, requests: requests,
        transport: 'local files at their intended public URLs; no live0.2.6 download or vehicle installation claimed'}, null, 2));
}
main().catch(function (e) { console.error(e.stack); process.exitCode = 1; });

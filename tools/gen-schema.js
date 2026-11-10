'use strict';
var fs = require('fs'), path = require('path');
var root = path.resolve(__dirname, '..');
var model = require('../native/dorin-ambient/model');
var appId = process.argv[2] || 'dorin_ambientdrive';
if (!/^[a-z][a-z0-9_]+$/.test(appId)) throw new Error('Invalid application id');
var folder = path.join(root, 'apps', appId);
var options = [['none','STANDARD']].concat(Object.keys(model.colors).map(function (key) { return [key,key.replace(/_/g,' ')]; }));
var items = [['checkbox', 'ENABLED', 'Ambient Drive']];
var labels = {sport:'Sport',sport_plus:'Sport Plus',sport_individual:'Sport Individual',comfort:'Comfort',adaptive:'Adaptive',eco_pro:'Eco Pro',eco_pro_individual:'Eco Pro Individual',manual:'M/S'};
model.modes.forEach(function (mode) { items.push(['colorpick', 'MODE_' + mode.toUpperCase(), labels[mode] || mode.replace(/_/g, ' ')]); });
items.push(['text3', 'STATUS', '']);
fs.writeFileSync(path.join(folder, 'app.json'), JSON.stringify({id: appId, title: 'Ambient Drive',
    description: 'Schimbă automat lumina ambientală după modul de condus. Culori independente pentru Sport, Sport Plus, Sport Individual, Comfort, Adaptive, Eco Pro, Eco Pro Individual și M/S. STANDARD păstrează culoarea curentă; setările sunt memorate.', version: '0.2.6', vendor: 'Dorin', author: 'Dorin Dumitras',
    loggingId: 'DAMB', iconGlyph: 'AD', nativeGids: ['GID_MYV_LIGHT_INTERIORLIGHT_AMBIENTLIGHTCOLOR_ICON','GID_MYV_SETTINGS_INTERIORLIGHT_AMBIENTLIGHT_PREVIEW'], screens: [{name: 'MAIN', kind: 'menu', title: 'Ambient Drive', items: items,
        contentPreview: {name:'INTERIOR_PREVIEW',widget:'LT_PreviewTable_1Graphic_1Text'},
    }, {name:'COLORS',kind:'list',title:'Ambient Drive',
        contentPreview:{name:'COLOR_PREVIEW',widget:'LT_PreviewTable_1Graphic_1Text'},
        items:options.map(function (opt) { return ['coloroption','COLOR_'+opt[0].toUpperCase(),opt[1]]; }).concat([['text3','COLOR_STATUS','']])
    }], settings: [], signals: {}}, null, 2) + '\n');
fs.writeFileSync(path.join(folder, 'ui-schema.js'), "'use strict';\nmodule.exports = " + JSON.stringify({modes: model.modes,colors:[null].concat(Object.keys(model.colors))}) + ';\n');

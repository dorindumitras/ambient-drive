'use strict';
var model = require('./model');
function command(s, target) {
    var c = {controlHueInteriorLighting: target.hue,
        controlMenuAmbientePanoramicRoofInteriorLighting: target.menu};
    ['HueValueLayer1IndividualGroup', 'HueValueLayer2IndividualGroup', 'HueValueLayer3IndividualGroup',
        'BrightnessValueBrightnessOffsetAmbientePanoramicRoofInteriorLighting'].forEach(function (name) {
        var v = s['status' + name];
        if (!Number.isInteger(v) || v < 0 || v > 255) throw new Error('Invalid status' + name);
        c['control' + name] = v;
    });
    ['ModeAmbientePanoramicRoofInteriorLighting', 'DynamicInteriorLighting', 'DynamicAmbienteInteriorLighting'].forEach(function (name) {
        var v = s['status' + (name === 'DynamicAmbienteInteriorLighting' ? 'DynamicAmbienteIinteriorLighting' : name)];
        if (['AUS', 'EIN', 'SIGNAL_UNBEFUELLT'].indexOf(v) < 0) throw new Error('Invalid status' + name);
        c['control' + name] = v;
    });
    return c;
}
function matches(s, target) {
    return !!s && s.statusMenuAmbientePanoramicRoofInteriorLighting === target.menu && s.statusHueInteriorLighting === target.hue;
}
function createState() { return {candidate: null, observed: null, lastKey: null, lastMode: null}; }
async function step(state, io) {
    var ctx = await io.readContext();
    if (io.observe) io.observe(ctx);
    var mode = model.resolve(ctx);
    if (mode !== state.observed) { io.log('AUTO_MODE ' + String(mode)); state.observed = mode; }
    if (!mode) { state.candidate = null; return; }
    if (state.candidate !== mode) { state.candidate = mode; return; }
    var selected = io.settings().rules[mode];
    var key = mode + ':' + (selected || 'none');
    if (key === state.lastKey) return;
    if (selected === null) {
        state.lastKey = key; state.lastMode = mode; io.log('AUTO_KEEP ' + mode); return;
    }
    var target = model.colors[selected];
    if (!target) throw new Error('Color has not been calibrated');
    var before = await io.readColor();
    if (!before) throw new Error('No ambient status');
    if (before.statusModeAmbientePanoramicRoofInteriorLighting !== 'EIN' ||
        before.statusMenuAmbientePanoramicRoofInteriorLighting === 'AMBIENTEBELEUCHTUNG_AUS') {
        state.lastKey = key; state.lastMode = mode; io.log('AUTO_SKIP ambient off or unknown'); return;
    }
    var payload = command(before, target);
    if (matches(before, target)) {
        state.lastKey = key; state.lastMode = mode; io.log('AUTO_ALREADY ' + selected); return;
    }
    if (!io.running()) return;
    if (model.resolve(await io.readContext()) !== mode) { state.candidate = null; return; }
    if (!io.running() || io.settings().rules[mode] !== selected) return;
    state.lastKey = key; state.lastMode = mode;
    io.log('AUTO_WRITE ' + mode + ' -> ' + selected);
    await io.setColor(payload);
    var after = null, confirmed = false, readError = null;
    for (var i = 0; i < 3 && io.running(); i++) {
        await io.wait();
        if (!io.running()) break;
        try { after = await io.readColor(); confirmed = matches(after, target); if (confirmed) break; }
        catch (e) { readError = String(e); }
    }
    io.log('AUTO_RESULT ' + JSON.stringify({mode: mode, color: selected,
        confirmedByReadback: confirmed, after: after, lastReadError: readError}));
}
module.exports = {command: command, createState: createState, step: step, matches: matches};

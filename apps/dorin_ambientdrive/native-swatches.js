'use strict';
// Names are resolved by the HMI's Enum converter. SDK Enum values travel as UTF-8,
// never as the numeric IDs stored in HmiMain3D's local identifier table.
var GID = 'gid://GID_MYV_LIGHT_INTERIORLIGHT_AMBIENTLIGHTCOLOR_ICON';
var STANDARD = 'ambient_drive_standard.png';
var PALETTE = ['bronze','bronze_white','orange','orange_white','white','blue','blue_white','green','green_white','lilac','lilac_white'];
function ensemble(color) {
    var index = PALETTE.indexOf(color);
    if (index < 0) throw new Error('Unknown swatch color');
    return 'ensemble' + (index + 1);
}
function clear(ui, name) {
    // Clear/Reset have no Value union in the installed SDK. setValue(...,0,'Clear')
    // throws before reaching the HMI, so omit the Value key in a raw public update.
    return ui.rhmi.update([{type:0,data:{componentId:ui.comp(name).getId(),parameterMaps:[{1:13,2:0,3:'Icon'}]}}]);
}
function create(ui) {
    var ready, handle, standardReady, standardHandle, cache = Object.create(null), assetKinds = Object.create(null);
    function init() {
        if (!ready) ready = Promise.resolve().then(function () {
            var rb = ui.rhmi.getResourceBundle();
            return rb.createResourceHandles([GID]).then(function () {
                handle = rb.getResourceHandle(GID);
                if (!Number.isInteger(handle) || handle < 0) throw new Error('Native color graphic unavailable');
            });
        }).catch(function (e) { ready = null; throw e; });
        return ready;
    }
    function initStandard() {
        if (!standardReady) standardReady = Promise.resolve().then(function () {
            var rb = ui.rhmi.getResourceBundle();
            return rb.createResourceHandles([STANDARD]).then(function () {
                standardHandle = rb.getResourceHandle(STANDARD);
                if (!Number.isInteger(standardHandle) || standardHandle < 0) throw new Error('STANDARD text graphic unavailable');
            });
        }).catch(function (e) { standardReady = null; throw e; });
        return standardReady;
    }
    function set(name, color, modeRow) {
        if (color !== null && PALETTE.indexOf(color) < 0) return Promise.reject(new Error('Unknown swatch color'));
        if (Object.prototype.hasOwnProperty.call(cache,name) && cache[name] === color) return Promise.resolve();
        var c = ui.comp(name), kind = modeRow && color === null ? 'standard' : color !== null ? 'color' : null;
        return Promise.resolve().then(function () {
            // Clear parameters when changing between a color GID and a bitmap.
            if (kind && assetKinds[name] && assetKinds[name] !== kind) return clear(ui,name);
        }).then(function () {
            if (kind === 'standard') return initStandard().then(function () { return c.setValue(0,'Icon',standardHandle,'Asset'); });
            // The dedicated STANDARD radio row uses its full-width native label.
            if (color === null) return;
            return init().then(function () { return c.setValue(0,'Icon',handle,'Asset'); }).then(function () {
                return c.setValue({row:0,cellName:'Icon',childCellName:'ensemble',value:ensemble(color),valueType:'Enum'});
            });
        }).then(function () {
            return modeRow ? c.setValue(0,'TextNoColorVisible',false,'Bool') : null;
        }).then(function () { cache[name] = color; if (kind) assetKinds[name] = kind; });
    }
    return {set:set,invalidate:function () { cache = Object.create(null); }};
}
module.exports = {create:create,clear:clear,ensemble:ensemble,palette:PALETTE,gid:GID,standardResource:STANDARD};

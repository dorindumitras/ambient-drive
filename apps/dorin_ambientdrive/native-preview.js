'use strict';
// The original ambient-light preview GID selects the locally installed vehicle
// scene. Parameters follow CCarSettingsInteriorLightActivity's preview setup.
var colors = require('./native-swatches');
var GID = 'gid://GID_MYV_SETTINGS_INTERIORLIGHT_AMBIENTLIGHT_PREVIEW';
function create(ui) {
    var ready, handle;
    function init() {
        if (!ready) ready = Promise.resolve().then(function () {
            var rb = ui.rhmi.getResourceBundle();
            return rb.createResourceHandles([GID]).then(function () {
                handle = rb.getResourceHandle(GID);
                if (!Number.isInteger(handle) || handle < 0) throw new Error('Native interior preview unavailable');
            });
        }).catch(function (e) { ready = null; throw e; });
        return ready;
    }
    async function set(name, color) {
        var c = ui.comp(name);
        await init();
        await c.setValue(0,'Illustration',handle,'Asset');
        function parameter(cell, value, type) {
            return c.setValue({row:0,cellName:'Illustration',childCellName:cell,value:value,valueType:type});
        }
        await parameter('hardwareColoredLEDs',true,'Bool');
        await parameter('white_light',false,'Bool');
        // This is a visual preview, independent of master enabled/disabled.
        await parameter('ambientLight',color !== null,'Bool');
        if (color !== null) {
            var value = colors.ensemble(color);
            await parameter('ensemble',value,'Enum');
            await parameter('color','color_' + value,'Enum');
        }
        await parameter('focus',color === null ? 'interiorLightCheckbox' : 'ambientLightColor','Enum');
    }
    return {set:set};
}
module.exports = {create:create,gid:GID};

'use strict';
var mgu = require('./kit/mgu');
var client = require('./client');
var schema = require('./ui-schema');
var artwork = require('./artwork');
var nativeSwatches = require('./native-swatches');
var nativePreview = require('./native-preview');
var nativeFocus = require('./native-focus');
mgu.run({start: async function (ctx) {
    var ui = ctx.ui, latest = null, controlChain = Promise.resolve(), pendingActions = 0;
    // app.start() has already accepted the baseline XML. Optional group changes
    // must never delay initialized() or abort the app if this HMI refuses one.
    nativeFocus.apply(ui,ctx.spec && ctx.spec.focusGroups,ctx.log);
    var graphics = artwork.create(), nativeScene = nativePreview.create(ui), swatches = nativeSwatches.create(ui), checkedRows = {}, fallbackRows = {};
    var page = 'MAIN', editingMode = null, previewMode = null, previewColor, shown = {}, imageRetryAt = 0, imageWarned = false, swatchWarned = false;
    function colorName(color) { return 'COLOR_' + (color === null ? 'NONE' : color.toUpperCase()); }
    function colorSid(color) { return 'SID_AD_' + colorName(color); }
    function modeName(mode) { return 'MODE_' + mode.toUpperCase(); }
    function isSelection(event) {
        var sub = event && event.subType;
        if (sub === undefined) return true;
        if ([4,5,6,8,10].indexOf(Number(sub)) >= 0) return false;
        return ['increase','decrease','toggleedit','currentvalue','abort','scroll'].indexOf(String(sub).replace(/[_\s-]/g,'').toLowerCase()) < 0;
    }
    function sid(name, value, cell) {
        var c = ui.comp(name);
        return c ? Promise.resolve(c.setValue(0, cell || 'Text', value, 'StringId')) : Promise.resolve();
    }
    function preview() {
        if (!latest || Date.now() < imageRetryAt) return Promise.resolve();
        var name = page === 'COLORS' ? 'COLOR_PREVIEW' : 'INTERIOR_PREVIEW';
        var color = previewColor !== undefined ? previewColor : previewMode ? latest.rules[previewMode] : latest.lastColor;
        if (color === null || color === undefined) color = latest.palette.indexOf(latest.lastColor) >= 0 ? latest.lastColor : null;
        if (shown[name] === color) return Promise.resolve();
        return Promise.resolve().then(function () {
            // Use the exact original per-color layers when the installed model's
            // pack can be identified. A successful native GID update can still
            // display an unlit base scene, as observed on this G01 in0.2.2.
            return ui.image(name, graphics.render(color), 'Illustration').then(function (pushed) {
                if (pushed === false) throw new Error('Bitmap image push failed; see image log');
                ctx.log.info('Ambient Drive preview bitmap: ' + name + ' color=' + String(color));
            });
        }).catch(function (bitmapError) {
            if (!imageWarned) ctx.log.warn('Ambient Drive bitmap preview: ' + bitmapError.message);
            return nativeScene.set(name,color).then(function () {
                ctx.log.info('Ambient Drive preview native fallback: ' + name + ' color=' + String(color));
            });
        }).then(function () { shown[name] = color; imageWarned = false; imageRetryAt = 0; }, function (e) {
            imageRetryAt = Date.now() + 5000;
            if (!imageWarned) { imageWarned = true; ctx.log.warn('Ambient Drive artwork: ' + e.message); }
        });
    }
    function swatch(name, color, modeRow) {
        return swatches.set(name,color,modeRow).catch(function (e) {
            if (!swatchWarned) { swatchWarned = true; ctx.log.warn('Ambient Drive native color graphic: ' + e.message); }
            // Keep a readable, localized choice if this firmware cannot provide the graphic.
            if (!Object.prototype.hasOwnProperty.call(fallbackRows,name) || fallbackRows[name] !== color) return nativeSwatches.clear(ui,name).catch(function (clearError) {
                ctx.log.warn('Ambient Drive clear native color graphic: ' + clearError.message);
            }).then(function () {
                if (modeRow) return sid(name,colorSid(color),'TextNoColor').then(function () {
                    return ui.comp(name).setValue(0,'TextNoColorVisible',true,'Bool');
                });
            }).then(function () { fallbackRows[name] = color; });
        });
    }
    async function paintChoices() {
        if (!latest || !editingMode) return;
        var pending = [];
        schema.colors.forEach(function (color) {
            var name = colorName(color), visible = color === null || latest.palette.indexOf(color) >= 0;
            pending.push(ui.visible(name,visible));
            var checked = color === latest.rules[editingMode];
            if (checkedRows[name] !== checked) pending.push(Promise.resolve(ui.checked(name,checked)).then(function () { checkedRows[name] = checked; }));
            if (visible) pending.push(swatch(name,color,false));
        });
        await Promise.all(pending);
    }
    async function paint(s) {
        latest = s;
        var pending = [ui.checked('ENABLED',s.enabled),ui.enabled('ENABLED',s.telemetryReady || s.enabled)];
        schema.modes.forEach(function (mode) {
            var name = modeName(mode), visible = s.availableModes.indexOf(mode) >= 0;
            pending.push(ui.visible(name,visible));
            if (visible) pending.push(swatch(name,s.rules[mode] === undefined ? null : s.rules[mode],true));
        });
        var phase = !s.telemetryReady ? 'SETUP' :
            ['waiting','unknown_mode'].indexOf(s.phase) >= 0 ? 'WAITING' : s.lastError ? 'ERROR' : null;
        pending.push(sid('STATUS',phase ? 'SID_AD_PHASE_' + phase : 'SID_AD_EMPTY'));
        pending.push(sid('COLOR_STATUS',phase ? 'SID_AD_PHASE_' + phase : 'SID_AD_EMPTY'));
        pending.push(ui.visible('STATUS',!!phase));
        pending.push(ui.visible('COLOR_STATUS',!!phase));
        if (page === 'COLORS') pending.push(paintChoices());
        pending.push(preview());
        await Promise.all(pending);
    }
    function act(request) {
        if (request === 'status' && pendingActions) return controlChain;
        pendingActions++;
        var operation = controlChain.then(async function () {
            try { await paint(await client.request(typeof request === 'function' ? request() : request)); return true; }
            catch (e) {
                ctx.log.warn('Ambient Drive: ' + e.message);
                await Promise.all([sid('STATUS','SID_AD_PHASE_UI_ERROR'),sid('COLOR_STATUS','SID_AD_PHASE_UI_ERROR'),
                    ui.visible('STATUS',true),ui.visible('COLOR_STATUS',true)]);
                return false;
            } finally { pendingActions--; }
        });
        controlChain = operation.catch(function (e) { ctx.log.warn('Ambient Drive UI: ' + e.message); });
        return operation;
    }
    var enabledControl = ui.comp('ENABLED');
    enabledControl.on('focus',function (event) {
        if (!event || event.value !== true) return;
        previewMode = null; previewColor = undefined; return preview();
    });
    function activatePage(name) {
        page = name; shown = {}; checkedRows = {}; fallbackRows = {}; swatches.invalidate();
        imageRetryAt = 0;
        if (name === 'MAIN') { editingMode = null; previewColor = undefined; }
        return act('status');
    }
    if (typeof ui.onVisible === 'function') ui.onVisible(function (name,on) {
        if (on && ['MAIN','COLORS'].indexOf(name) >= 0) return activatePage(name);
    });
    if (ui.rhmi && typeof ui.rhmi.on === 'function') ui.rhmi.on('applicationStackChanged',function (stack) {
        var states = stack && stack.ROOT_APP;
        // Native Back can pop COLORS while MAIN remains marked visible in the
        // stack. Restore the main-page preview without relying on a new visible event.
        if (page === 'COLORS' && Array.isArray(states) &&
            states.indexOf(ui.comp('MAIN').getId()) >= 0 && states.indexOf(ui.comp('COLORS').getId()) < 0) return activatePage('MAIN');
    });
    ui.onClick('ENABLED',function () { return latest && act(function () { return latest.enabled ? 'disable' : 'enable'; }); });
    schema.modes.forEach(function (mode) {
        var name = modeName(mode), component = ui.comp(name);
        component.on('focus',function (event) {
            if (!latest || !event || event.value === false) return;
            previewMode = mode; previewColor = undefined; return preview();
        });
        ui.onClick(name,async function (event) {
            if (!latest || latest.availableModes.indexOf(mode) < 0) return;
            ctx.log.info('Ambient Drive open colors: ' + mode + ' event=' + JSON.stringify(event || {}));
            if (!isSelection(event)) return;
            editingMode = mode; previewMode = mode; previewColor = undefined; page = 'COLORS'; checkedRows = {}; shown = {};
            await sid('COLORS_TITLE','SID_DORIN_AMBIENTDRIVE_' + name);
            var selected = latest.rules[mode] === undefined ? null : latest.rules[mode];
            await ui.comp('COLORS').setProperty('DefaultFocusComponent',ui.comp(colorName(selected)).getId(),'UInt');
            await ui.open('COLORS');
            // Native navigation must not wait for graphic registration/decoding.
            await Promise.all([paintChoices(),preview()]);
        });
    });
    schema.colors.forEach(function (color) {
        var name = colorName(color), component = ui.comp(name);
        component.on('focus',function (event) {
            if (page !== 'COLORS' || !editingMode || !event || event.value === false) return;
            previewColor = color; return preview();
        });
        ui.onClick(name,async function (event) {
            if (page !== 'COLORS' || !editingMode || !latest || color !== null && latest.palette.indexOf(color) < 0) return;
            ctx.log.info('Ambient Drive choose color: ' + editingMode + ' color=' + color + ' event=' + JSON.stringify(event || {}));
            if (!isSelection(event)) return;
            var mode = editingMode;
            var ok = color === latest.rules[mode] && !pendingActions ? true : await act({op:'set-rule',mode:mode,color:color});
            if (ok && editingMode === mode) {
                // Save immediately, keep the native radio list open. The HMI's
                // Back action is the only navigation back to the parent menu.
                previewMode = mode; previewColor = color;
                await preview();
            }
        });
    });
    ctx.loop('MAIN',0.5,function () { return act('status'); });
    ctx.loop('COLORS',0.5,function () { return act('status'); });
    await act('status');
}}).catch(function (e) { console.error('Ambient Drive UI: ' + String(e)); });

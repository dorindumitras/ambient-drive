'use strict';
var COLORS = {
    bronze:{menu:'FARBAUSWAHL_3',hue:27}, bronze_white:{menu:'FARBAUSWAHL_4',hue:120},
    orange:{menu:'FARBAUSWAHL_5',hue:10}, orange_white:{menu:'FARBAUSWAHL_6',hue:120},
    white:{menu:'FARBAUSWAHL_7',hue:120}, blue:{menu:'FARBAUSWAHL_8',hue:199},
    blue_white:{menu:'FARBAUSWAHL_9',hue:120}, green:{menu:'FARBAUSWAHL_10',hue:128},
    green_white:{menu:'FARBAUSWAHL_11',hue:120}, lilac:{menu:'FARBAUSWAHL_12',hue:258},
    lilac_white:{menu:'INDIVIDUALMODUS',hue:120}
};
var MODES = ['sport', 'sport_individual', 'comfort', 'comfort_plus', 'comfort_individual', 'adaptive',
    'eco_pro', 'eco_pro_plus', 'eco_pro_individual',
    'offroad_ice', 'offroad_smooth', 'offroad_grip',
    'offroad_rough', 'ease', 'traction_assist', 'boost', 'manual'];
var FES = {
    SPORT_DYNAMIC: 'sport', SPORT_EXPERT: 'sport', SPORT_INDIVIDUAL: 'sport_individual',
    COMFORT: 'comfort', COMFORT_PLUS: 'comfort_plus', COMFORT_INDIVIDUAL: 'comfort_individual',
    ECO_PRO_EFFICIENT: 'eco_pro', ECO_PRO_PLUS: 'eco_pro_plus', ECO_PRO_INDIVIDUAL: 'eco_pro_individual',
    ADAPTIVE: 'adaptive', PHEV_SPORT_STANDARD: 'sport', PHEV_SPORT_INDIVIDUAL: 'sport_individual',
    PHEV_SPORT_PLUS: 'sport', PHEV_HYBRID_STANDARD: null, PHEV_HYBRID_ECO: 'eco_pro',
    PHEV_HYBRID_COMFORT: 'comfort',
    OFFROAD_ICE: 'offroad_ice', OFFROAD_SMOOTH: 'offroad_smooth', OFFROAD_GRIP: 'offroad_grip',
    OFFROAD_ROUGH: 'offroad_rough', EASE_MODUS: 'ease', TRACTION_ASSIST: 'traction_assist', BOOST: 'boost'
};
function own(o, key) { return Object.prototype.hasOwnProperty.call(o, key); }
var ALIASES = {sport_plus:'sport'};
function canonical(mode) { return typeof mode === 'string' && own(ALIASES,mode) ? ALIASES[mode] : mode; }
function baseMode(raw) { return typeof raw === 'string' && own(FES, raw) ? FES[raw] : null; }
function resolve(ctx) {
    if (!ctx) return null;
    if (ctx.manualSupported && typeof ctx.manual !== 'boolean') return null;
    if (ctx.manual === true) return 'manual';
    var base = canonical(ctx.baseDriveMode);
    return typeof base === 'string' && MODES.indexOf(base) >= 0 &&
        base !== 'manual' ? base : baseMode(ctx.fes);
}
function retired(mode) { return ['hybrid','hybrid_eco','hybrid_comfort','electric','electric_individual','battery_control'].indexOf(mode) >= 0; }
function defaults() {
    var rules = {}; MODES.forEach(function (m) { rules[m] = null; });
    rules.sport = 'orange'; rules.comfort = 'green'; rules.adaptive = 'green'; rules.eco_pro = 'blue';
    return {schema: 2, enabled: false, rules: rules, seenModes: ['sport', 'comfort', 'adaptive', 'eco_pro']};
}
function settings(value) {
    var result = defaults();
    if (!value || (value.schema !== 1 && value.schema !== 2) || typeof value.enabled !== 'boolean') throw new Error('Invalid settings');
    result.enabled = value.enabled;
    if (value.schema === 2) {
        if (!value.rules || typeof value.rules !== 'object' || Array.isArray(value.rules)) throw new Error('Invalid rules');
        Object.keys(value.rules).forEach(function (key) {
            if (retired(key)) return;
            if (own(ALIASES,key)) {
                if (!own(value.rules,ALIASES[key]) && (value.rules[key] === null || own(COLORS,value.rules[key]))) result.rules[ALIASES[key]] = value.rules[key];
                return;
            }
            if (MODES.indexOf(key) < 0 || (value.rules[key] !== null && !own(COLORS, value.rules[key]))) throw new Error('Invalid rule');
            result.rules[key] = value.rules[key];
        });
        // Older releases stored Comfort and Adaptive as one rule. Seed the new
        // rule once, including STANDARD; subsequent saves carry both keys.
        if (!own(value.rules, 'adaptive')) result.rules.adaptive = result.rules.comfort;
        if (!Array.isArray(value.seenModes) || value.seenModes.some(function (m) { return MODES.indexOf(m) < 0 && !own(ALIASES,m) && !retired(m); })) throw new Error('Invalid modes');
        value.seenModes.forEach(function (m) { if (MODES.indexOf(m) >= 0 && result.seenModes.indexOf(m) < 0) result.seenModes.push(m); });
    }
    return result;
}
function change(value, mode, color) {
    mode = canonical(mode);
    if (MODES.indexOf(mode) < 0 || (color !== null && (typeof color !== 'string' || !own(COLORS, color)))) throw new Error('Invalid mode or color');
    var next = settings(value); next.rules[mode] = color; return next;
}
module.exports = {colors: COLORS, modes: MODES, fes: FES, baseMode: baseMode, resolve: resolve,
    defaults: defaults, settings: settings, change: change};

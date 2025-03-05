// https://html.spec.whatwg.org/multipage/indices.html#attributes-1
// https://www.w3.org/TR/REC-html40/index/attributes.html
var links = [
    'src',
    'href',
    'data',
    'action',
    'srcdoc',
    'xlink:href',
    'cite',
    'formaction',
    'ping',
    'poster',
    'background',
    'classid',
    'codebase',
    'longdesc',
    'profile',
    'usemap',
    'icon',
    'manifest',
    'archive'
];
// https://html.spec.whatwg.org/multipage/indices.html#attributes-1
var bools = [
    'hidden',
    'allowfullscreen',
    'async',
    'autofocus',
    'autoplay',
    'checked',
    'controls',
    'default',
    'defer',
    'disabled',
    'formnovalidate',
    'inert',
    'ismap',
    'itemscope',
    'loop',
    'multiple',
    'muted',
    'nomodule',
    'novalidate',
    'open',
    'playsinline',
    'readonly',
    'required',
    'reversed',
    'selected',
];
export var isLink = function (data) {
    return data && typeof data === 'string' ?
        links.indexOf(data) !== -1 :
        false;
};
export var isBool = function (data) {
    return data && typeof data === 'string' ?
        bools.indexOf(data) !== -1 :
        false;
};
var patternValue = /^value$/i;
export var isValue = function (data) {
    return data && typeof data === 'string' ?
        patternValue.test(data) :
        false;
};
var patternOn = /^on/i;
export var hasOn = function (data) {
    return data && typeof data === 'string' ?
        patternOn.test(data) :
        false;
};
export var sliceOn = function (data) {
    var _a;
    return data && typeof data === 'string' ?
        (_a = data === null || data === void 0 ? void 0 : data.toLowerCase()) === null || _a === void 0 ? void 0 : _a.slice(2) :
        '';
};
export var isMarker = function (data, marker) {
    return data && typeof data === 'string' ?
        data.toLowerCase() === marker.toLowerCase() :
        false;
};
export var hasMarker = function (data, marker) {
    return data && typeof data === 'string' ?
        data.toLowerCase().indexOf(marker.toLowerCase()) !== -1 :
        false;
};
export var includes = function (item, search) {
    return item.indexOf(search) !== -1;
};
// const safePattern = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
var safePattern = /^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:\/?#]*(?:[\/?#]|$))/i;
export var dangerousLink = function (data) {
    if (data === '')
        return false;
    if (typeof data !== 'string')
        return false;
    return safePattern.test(data) ? false : true;
};
export var removeBetween = function (start, end) {
    var _a;
    var node = end.previousSibling;
    while (node !== start) {
        (_a = node === null || node === void 0 ? void 0 : node.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(node);
        node = end.previousSibling;
    }
};

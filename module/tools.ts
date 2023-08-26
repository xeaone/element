/**
 * @version 9.1.8
 *
 * @license
 * Copyright (C) Alexander Elias
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @module
 */
// https://html.spec.whatwg.org/multipage/indices.html#attributes-1
// https://www.w3.org/TR/REC-html40/index/attributes.html
const links = [
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
const bools = [
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

export const isLink = function (data: string): boolean {
    return data && typeof data === 'string' ?
        links.indexOf(data) !== -1 :
        false;
};

export const isBool = function (data: string): boolean {
    return data && typeof data === 'string' ?
        bools.indexOf(data) !== -1 :
        false;
};

const patternValue = /^value$/i;
export const isValue = function (data: string): boolean {
    return data && typeof data === 'string' ?
        patternValue.test(data) :
        false;
};

const patternOn = /^on/i;
export const hasOn = function (data: string): boolean {
    return data && typeof data === 'string' ?
        patternOn.test(data) :
        false;
};

export const sliceOn = function (data: string): string {
    return data && typeof data === 'string' ?
        data?.toLowerCase()?.slice(2) :
        '';
};

export const isMarker = function (data: string, marker: string): boolean {
    return data && typeof data === 'string' ?
        data.toLowerCase() === marker.toLowerCase() :
        false;
};

export const hasMarker = function (data: string, marker: string): boolean {
    return data && typeof data === 'string' ?
        data.toLowerCase().indexOf(marker.toLowerCase()) !== -1 :
        false;
};

export const includes = function (item: string | Array<any>, search: any) {
    return item.indexOf(search) !== -1;
};

// const safePattern = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
const safePattern = /^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:\/?#]*(?:[\/?#]|$))/i;
export const dangerousLink = function (data: string) {
    if (data === '') return false;
    if (typeof data !== 'string') return false;
    return safePattern.test(data) ? false : true;
};

export const removeBetween = function (start: Node, end: Node) {
    let node = end.previousSibling;
    while (node !== start) {
        node?.parentNode?.removeChild(node);
        node = end.previousSibling;
    }
};

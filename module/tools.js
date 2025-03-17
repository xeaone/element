/**
* @version 10.0.5
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
/**
 * @type {NodeFilter.SHOW_TEXT}
 */
export const SHOW_TEXT = 4;
/**
 * @type {NodeFilter.SHOW_ELEMENT}
 */
export const SHOW_ELEMENT = 1;
/**
 * @type {Node.TEXT_NODE}
 */
export const TEXT_NODE = 3;
/**
 * @type {Node.COMMENT_NODE}
 */
export const COMMENT_NODE = 3;
/**
 * @type {Node.ELEMENT_NODE}
 */
export const ELEMENT_NODE = 1;
/**
 * @type {Node.ATTRIBUTE_NODE}
 */
export const ATTRIBUTE_NODE = 2;
/**
 * @type {Node.DOCUMENT_FRAGMENT_NODE}
 */
export const DOCUMENT_FRAGMENT_NODE = 11;
// https://html.spec.whatwg.org/multipage/indices.html#attributes-1
// https://www.w3.org/TR/REC-html40/index/attributes.html
const patternLink = new RegExp([
    '^[.@$]?(',
    [
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
        'archive',
    ].join('|'),
    ')',
].join(''), 'i');
// https://html.spec.whatwg.org/multipage/indices.html#attributes-1
const patternBool = new RegExp([
    '^[.@$]?(',
    [
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
    ].join('|'),
    ')',
].join(''), 'i');
const patternAnimation = /^[.@$]?onanimation$/i;
const patternTimeout = /^[.@$]?ontimeout$/i;
const patternOnce = /^[.@$]?ononce$/i;
const patternValue = /^[.@$]?value$/i;
const patternOn = /^[.@$]?on/i;
const patternMarker = /^x-[0-9]{10}-x$/i;
// const safePattern = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
const safePattern = /^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:\/?#]*(?:[\/?#]|$))/i;
export const isLink = function (data) {
    return data && typeof data === 'string' ? patternLink.test(data) : false;
};
export const isBool = function (data) {
    return data && typeof data === 'string' ? patternBool.test(data) : false;
};
export const isIterable = function (data) {
    return data && typeof data !== 'string' && typeof data[Symbol.iterator] === 'function';
};
export const isAnimation = function (data) {
    return data && typeof data === 'string' ? patternAnimation.test(data) : false;
};
export const isOnce = function (data) {
    return data && typeof data === 'string' ? patternOnce.test(data) : false;
};
export const isTimeout = function (data) {
    return data && typeof data === 'string' ? patternTimeout.test(data) : false;
};
export const isValue = function (data) {
    return data && typeof data === 'string' ? patternValue.test(data) : false;
};
export const hasOn = function (data) {
    return data && typeof data === 'string' ? patternOn.test(data) : false;
};
export const isMarker = function (data) {
    return data && typeof data === 'string' ? patternMarker.test(data) : false;
};
export const matchMarker = function (data, marker) {
    return data && marker &&
        typeof data === 'string' &&
        typeof marker === 'string'
        ? data.toLowerCase() === marker.toLowerCase()
        : false;
};
export const hasMarker = function (data, marker) {
    return data && typeof data === 'string' ? data.indexOf(marker) !== -1 : false;
};
export const sliceOn = function (data) {
    return data && typeof data === 'string' ? data.replace(patternOn, '') : '';
};
export const isConnected = function (node) {
    if (node.nodeType === Node.ATTRIBUTE_NODE) {
        return node.parentNode?.isConnected ?? false;
    }
    else {
        return node.isConnected;
    }
    // return (
    //     !node.ownerDocument ||
    //     !(
    //       node.ownerDocument.compareDocumentPosition(node) &
    //       node.DOCUMENT_POSITION_DISCONNECTED
    //     )
    // );
};
// export const includes = function (item: string | Array<any>, search: any) {
//     return item.indexOf(search) !== -1;
// };
export const mark = function () {
    return `x-${`${Math.floor(Math.random() * Date.now())}`.slice(0, 10)}-x`;
};
export const dangerousLink = function (data) {
    if (data === '')
        return false;
    if (typeof data !== 'string')
        return false;
    return safePattern.test(data) ? false : true;
};
/**
 *  DOM mod methods
 */
export const removeBetween = function (start, end) {
    let node = end.previousSibling;
    while (node && node !== start) {
        node.parentNode?.removeChild(node);
        node = end.previousSibling;
    }
};
export const removeNode = function (node) {
    node.parentNode.removeChild(node);
};
export const beforeNode = function (node, child) {
    if (!(node instanceof Node))
        node = child.ownerDocument.createTextNode(`${node}`);
    child.parentNode.insertBefore(node, child);
};
export const afterNode = function (node, child) {
    if (!(node instanceof Node))
        node = child.ownerDocument.createTextNode(`${node}`);
    child.parentNode.insertBefore(node, child.nextSibling);
};
export const replaceNode = function (node, child) {
    child.parentNode.replaceChild(node, child);
};
export const replaceChildren = function (element, ...nodes) {
    while (element.lastChild) {
        element.removeChild(element.lastChild);
    }
    for (const node of nodes) {
        element.appendChild(typeof node === 'string' ? element.ownerDocument.createTextNode(node) : node);
    }
};
/**
 * Attr DOM
 */
export const addAttribute = function (owner, attribute) {
    owner.setAttributeNode(attribute);
    return attribute;
};
export const createAttribute = function (owner, name, value) {
    const attribute = owner.ownerDocument.createAttribute(name);
    attribute.value = value ?? '';
    owner.setAttributeNode(attribute);
    return attribute;
};
export const removeAttribute = function (node) {
    return node.ownerElement.removeAttributeNode(node);
};
/**
 * Node methods
 */
export const isText = function (node) {
    return node?.nodeType === TEXT_NODE;
};
export const isAttribute = function (node) {
    return node?.nodeType === ATTRIBUTE_NODE;
};
export const isElement = function (node) {
    return node?.nodeType === ELEMENT_NODE;
};
export const isComment = function (node) {
    return node?.nodeType === COMMENT_NODE;
};

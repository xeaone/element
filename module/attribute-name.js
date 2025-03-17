/**
* @version 10.0.3
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
import { hasOn, isBool, isLink, isValue, sliceOn } from './tools';
export const attributeName = function (element, binder, source, target) {
    source = source?.toLowerCase() ?? '';
    target = target?.toLowerCase() ?? '';
    // console.log('binder:', binder, 'source:', source, 'target:', target);
    if (source === target) {
        return;
    }
    if (hasOn(source)) {
        if (typeof binder.value === 'function') {
            element.removeEventListener(sliceOn(source), binder.value, true);
        }
    }
    else if (isValue(source)) {
        element.removeAttribute(source);
        Reflect.set(element, source, null);
    }
    else if (isBool(source)) {
        element.removeAttribute(source);
        Reflect.set(element, source, false);
    }
    else if (isLink(source)) {
        element.removeAttribute(source);
        Reflect.deleteProperty(element, source);
    }
    else if (source) {
        element.removeAttribute(source);
        Reflect.deleteProperty(element, source);
    }
    if (hasOn(target)) {
        return;
    }
    else if (isBool(target)) {
        binder.value = '';
        element.setAttribute(target, '');
        Reflect.set(element, target, true);
    }
    else if (target) {
        element.setAttribute(target, '');
        Reflect.set(element, target, null);
    }
    binder.name = target || '';
};

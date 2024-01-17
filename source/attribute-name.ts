import { hasOn, isBool, isLink, isValue, sliceOn } from './tools';
import { Binder } from './types';

export const attributeName = function (element: Element, binder: Binder, source: any, target: any): void {
    // console.log(arguments);

    source = source?.toLowerCase() ?? '';
    target = target?.toLowerCase() ?? '';

    if (source === target) {
        return;
    }

    if (hasOn(source)) {

        if (typeof binder.value === 'function') {
            element.removeEventListener(sliceOn(source), binder.value, true);
        }

    } else if (isValue(source)) {
        element.removeAttribute(source);
        Reflect.set(element, source, null);
    } else if (isBool(source)) {
        console.log(binder, source, target);
        element.removeAttribute(source);
        Reflect.set(element, source, false);
    } else if (isLink(source)) {
        element.removeAttribute(source);
        Reflect.deleteProperty(element, source);
    } else if (source) {
        element.removeAttribute(source);
        Reflect.deleteProperty(element, source);
    }

    if (hasOn(target)) {
        return;
    } else if (isBool(target)) {
        element.setAttribute(target, '');
        Reflect.set(element, target, true);
    } else if (target) {
        element.setAttribute(target, '');
        Reflect.set(element, target, null);
    }

    binder.name = target || '';

};
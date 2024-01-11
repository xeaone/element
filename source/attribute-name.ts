import { hasOn, isBool, isLink, isValue, sliceOn } from './tools';

export const attributeName = function (element: Element, data: any, source: any, target: any): void {
    // console.log(arguments);

    if (source === target) {
        return;
    } else if (isValue(source)) {
        element.removeAttribute(source);
        Reflect.set(element, source, null);
    } else if (hasOn(source)) {

        if (typeof data.value === 'function') {
            element.removeEventListener(sliceOn(source), data.value, true);
        }

    } else if (isLink(source)) {
        element.removeAttribute(source);
    } else if (isBool(source)) {
        element.removeAttribute(source);
        Reflect.set(element, source, false);
    } else if (source) {
        element.removeAttribute(source);
        Reflect.deleteProperty(element, source);
    }

    data.name = target?.toLowerCase() || '';

    if (!data.name) {
        return;
    } else if (hasOn(data.name)) {
        return
    } else if (isBool(data.name)) {
        element.setAttribute(data.name, '');
        Reflect.set(element, data.name, true);
    } else {
        element.setAttribute(data.name, '');
        Reflect.set(element, data.name, undefined);
    }

};
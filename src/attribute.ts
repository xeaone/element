import { BooleanAttributes, DateAttributes } from './tool.ts';
import Display from './display.ts';

export default function Attribute(element: Element, name: string, value: any) {
    if (name === 'value') {
        const type = Reflect.get(element, 'type');

        if (typeof value === 'number' && DateAttributes.includes(type)) {
            const iso = new Date(value).toLocaleString('default', {
                hour12: false,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                fractionalSecondDigits: 3,
            }).replace(/(\d+)\/(\d+)\/(\d+), ([0-9:.]+)/, '$3-$1-$2T$4Z');

            if (type === 'date') value = iso.slice(0, 10);
            else if (type === 'time') value = iso.slice(11, -1);
            else if (type === 'month') value = iso.slice(0, 7);
            else if (type === 'datetime-local') value = iso.slice(0, -1);
        }

        value = `${value == undefined ? '' : value}`;
        Reflect.set(element, name, value);
        element.setAttribute(name, value);
    } else if (name.startsWith('on')) {
        if (Reflect.has(element, `x${name}`)) {
            element.addEventListener(name.slice(2), Reflect.get(element, `x${name}`));
        } else {
            Reflect.set(element, `x${name}`, value);
            element.addEventListener(name.slice(2), value);
        }

        if (element.hasAttribute(name)) element.removeAttribute(name);
    } else if (BooleanAttributes.includes(name)) {
        value = typeof value === 'function' ? value() : value;
        const result = value ? true : false;
        Reflect.set(element, name, result);
        if (result) element.setAttribute(name, '');
        else element.removeAttribute(name);
    } else if (name === 'html') {
        const html = Reflect.get(element, 'xhtml');
        if (html === value) return;
        Reflect.set(element, 'xhtml', value);
        Reflect.set(element, 'innerHTML', value);
    } else {
        const display = Display(value);
        if (element.getAttribute(name) !== display) {
            element.setAttribute(name, display);
        }
    }
}

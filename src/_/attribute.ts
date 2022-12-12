import { BooleanAttributes, DateAttributes, ValueSymbol } from './tool.ts';
import Display from './display.ts';

export default function attribute(element: Element, name: string, bindings: any) {
    if (name === 'data-x-value') {
        // const type = Reflect.get(element, 'type');

        // if (typeof value === 'number' && DateAttributes.includes(type)) {
        //     const iso = new Date(value).toLocaleString('default', {
        //         hour12: false,
        //         year: 'numeric',
        //         month: '2-digit',
        //         day: '2-digit',
        //         hour: '2-digit',
        //         minute: '2-digit',
        //         second: '2-digit',
        //         fractionalSecondDigits: 3,
        //     }).replace(/(\d+)\/(\d+)\/(\d+), ([0-9:.]+)/, '$3-$1-$2T$4Z');

        //     if (type === 'date') value = iso.slice(0, 10);
        //     else if (type === 'time') value = iso.slice(11, -1);
        //     else if (type === 'month') value = iso.slice(0, 7);
        //     else if (type === 'datetime-local') value = iso.slice(0, -1);
        // }
        const value = bindings[element.getAttribute(name) as string];

        value = `${value == undefined ? '' : value}`;

        if (element.getAttribute(name) === value) return;

        Reflect.set(element, name, value);
        element.setAttribute(name, value);
    } else if (name.startsWith('on')) {
        const original = Reflect.get(element, `xRaw${name}`);
        if (original === value) return;

        const wrapped = Reflect.get(element, `xWrap${name}`);

        const wrap = function (e: Event) {
            if (parameters[0]?.prevent) e.preventDefault();
            if (parameters[0]?.stop) e.stopPropagation();
            return value(e);
        };

        Reflect.set(element, `xRaw${name}`, value);
        Reflect.set(element, `xWrap${name}`, wrap);

        element.addEventListener(name.slice(2), wrap, parameters?.[0] as any);
        element.removeEventListener(name.slice(2), wrapped);

        if (element.hasAttribute(name)) element.removeAttribute(name);
    } else if (BooleanAttributes.includes(name)) {
        const result = value ? true : false;
        Reflect.set(element, name, result);
        if (result) element.setAttribute(name, '');
        else element.removeAttribute(name);
    } else if (name === 'html') {
        const original = Reflect.get(element, 'xHtml');
        if (original === value) return;
        Reflect.set(element, 'xHtml', value);
        Reflect.set(element, 'innerHTML', value);
    } else {
        const display = Display(value);
        if (element.getAttribute(name) === display) return;
        element.setAttribute(name, display);
    }
}

import display from './display.ts';
import { BooleanAttributes } from './tool.ts';

const HtmlNameSymbol = Symbol('HtmlName');
const HtmlValueSymbol = Symbol('HtmlValue');

export default function html(strings: string[], ...values: any[]) {
    let data = '';
    const bindings: any = {};
    // let ids = 0;

    for (let index = 0; index < strings.length; index++) {
        const part = strings[index];
        const value = values[index];
        const name = part.match(/\b([a-zA-Z-]+)=$/)?.[1] ?? '';

        if (name.startsWith('on')) {
            // const id = ids++;
            const end = name.length + 1;
            const id = crypto.randomUUID();
            data += `${part.slice(0, -end)}data-x-${id}`;
            bindings[id] = { name, value, id };
        } else if (value?.constructor === Object && value[HtmlNameSymbol] === HtmlValueSymbol) {
            data += value.data;
            Object.assign(bindings, value.bindings);
        } else if (value?.constructor === Array) {
            data += part;
            for (const v of value) {
                data += v.data;
                Object.assign(bindings, v.bindings);
            }
        } else if (BooleanAttributes.includes(name)) {
            if (value) {
                data += part.slice(0, -1);
            } else {
                const end = name.length + 1;
                data += part.slice(0, -end);
            }
        } else if (name) {
            data += `${part}"${display(value)}"`;
        } else {
            data += `${part}${display(value)}`;
        }
    }

    return { [HtmlNameSymbol]: HtmlValueSymbol, data, bindings };
}

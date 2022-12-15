// import Virtual from './virtual.ts';
import { Properties } from './types.ts';
import display from './display.ts';

const HtmlNameSymbol = Symbol('HtmlName');
const HtmlValueSymbol = Symbol('HtmlValue');

// const HtmlCache = new WeakMap();

export default function html(strings: string[], ...values: any[]) {
    let data = '';
    const properties: Properties = {};

    for (let index = 0; index < strings.length; index++) {
        const string = strings[index];
        const value = values[index];
        const name = string.match(/\b([a-zA-Z-]+)=$/)?.[1] ?? '';

        if (name) {
            const id = crypto.randomUUID();
            const end = name.length + 1;
            data += `${string.slice(0, -end)}${name}="{{${id}}}"`;
            properties[id] = { name, value };
        } else if (value?.constructor === Object && value[HtmlNameSymbol] === HtmlValueSymbol) {
            data += string;
            data += value.data;
            Object.assign(properties, value.properties);
        } else if (value?.constructor === Array) {
            data += string;
            // const cache = HtmlCache.get(value);
            // if (cache) console.log(value, cache)
            let map = '';
            for (const item of value) {
                if (item[HtmlNameSymbol] === HtmlValueSymbol) {
                    map += item.data;
                    Object.assign(properties, item.properties);
                } else {
                    map += display(value);
                }
            }
            // HtmlCache.set(value, map);
            data += map;
        } else {
            data += string;
            data += display(value);
        }
    }

    // console.log(data);
    // console.log(Virtual(data));

    return { [HtmlNameSymbol]: HtmlValueSymbol, data, properties };
}

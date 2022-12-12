// import Virtual from './virtual.ts';
import display from './display.ts';

const HtmlNameSymbol = Symbol('HtmlName');
const HtmlValueSymbol = Symbol('HtmlValue');

type Property = { name: string; value: any };
type Properties = Record<string, Property>;

export default function html(strings: string[], ...values: any[]) {
    let data = '';
    const properties: Properties = {};

    for (let index = 0; index < strings.length; index++) {
        const part = strings[index];
        const value = values[index];
        const name = part.match(/\b([a-zA-Z-]+)=$/)?.[1] ?? '';

        if (name) {
            const id = crypto.randomUUID();
            // data += ` data-x-${id} ${part}`;
            const end = name.length + 1;
            data += `${part.slice(0, -end)} data-x-${id} ${name}="${display(value)}"`;
            // data += `${part.slice(0, -end)}data-x-${name}="${id}"`;
            properties[id] = { name, value };
        } else if (value?.constructor === Object && value[HtmlNameSymbol] === HtmlValueSymbol) {
            data += value.data;
            Object.assign(properties, value.properties);
        } else if (value?.constructor === Array) {
            data += part;
            for (const item of value) {
                if (item[HtmlNameSymbol] === HtmlValueSymbol) {
                    data += item.data;
                    Object.assign(properties, item.properties);
                } else {
                    data += `${display(value)}`;
                }
            }
        } else {
            data += `${part}${display(value)}`;
        }
    }

    // console.log(Virtual(data));

    return { [HtmlNameSymbol]: HtmlValueSymbol, data, properties };
}

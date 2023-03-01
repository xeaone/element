import parse from './parse.ts';

export const HtmlCache = new WeakMap();
export const HtmlSymbol = Symbol('html');

export default function html(strings: string[], ...values: unknown[]) {
    if (HtmlCache.has(strings)) {
        const template = HtmlCache.get(strings);
        return { strings, values, template, symbol: HtmlSymbol };
    } else {
        let data = '';

        const length = strings.length - 1;

        for (let index = 0; index < length; index++) {
            data += `${strings[index]}{{${index}}}`;
        }

        data += strings[length];

        // const template = document.createElement('template');
        // template.innerHTML = data;
        const template = parse(data);

        HtmlCache.set(strings, template);

        return { strings, values, template, symbol: HtmlSymbol };
    }
}

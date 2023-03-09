import { createHTML } from './poly';
// import parse from './parse';

export const HtmlCache = new WeakMap();
export const HtmlSymbol = Symbol('html');

type TemplateExpressionsArray = any[];

// export class H {
//     strings:TemplateStringsArray;
//     expressions:TemplateExpressionsArray;
//     template: HTMLTemplateElement;
//     constructor(strings: TemplateStringsArray, expressions: TemplateExpressionsArray, template: HTMLTemplateElement) {
//         this.strings = strings;
//         this.expressions = expressions;
//         this.template = template;
//     }
// }

export default function html(strings: TemplateStringsArray, ...expressions: TemplateExpressionsArray) {
    if (HtmlCache.has(strings)) {
        const template = HtmlCache.get(strings);
        // return new H(strings, expressions, template);
        return { strings, expressions, values:expressions, template, symbol: HtmlSymbol };
    } else {
        let data = '';

        const length = strings.length - 1;

        for (let index = 0; index < length; index++) {
            data += `${strings[index]}{{${index}}}`;
        }

        data += strings[length];

        const template = document.createElement('template');
        template.innerHTML = createHTML(data);

        // const template = parse(data);

        HtmlCache.set(strings, template);

        // return new H(strings, expressions, template);
        return { strings, expressions, values:expressions, template, symbol: HtmlSymbol };
    }
}

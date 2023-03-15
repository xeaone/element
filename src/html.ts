import { createHTML } from './poly';
// import parse from './parse';

export type TemplateExpressionsArray = any[];

export type HtmlInstance = {
    strings: TemplateStringsArray;
    expressions:TemplateExpressionsArray;
    template: HTMLTemplateElement;
    symbol: typeof HtmlSymbol;
}

export const HtmlCache = new WeakMap();
export const HtmlSymbol = Symbol('html');

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

export const html = function (strings: TemplateStringsArray, ...expressions: TemplateExpressionsArray): HtmlInstance {
    const template = HtmlCache.get(strings);
    if (template) {
        // return new H(strings, expressions, template);
        return { strings, expressions, template, symbol: HtmlSymbol };
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
        return { strings, expressions, template, symbol: HtmlSymbol };
    }
}

export default html;
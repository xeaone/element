import { createHTML } from './poly';
import render from './render';
import { Expressions, HTML } from './types';
// import parse from './parse';

export const symbol = Symbol('html');
const cache: WeakMap<TemplateStringsArray, HTMLTemplateElement> = new WeakMap();
// const Templates: WeakMap<TemplateStringsArray, HTMLTemplateElement> = new WeakMap();
// const Actions: WeakMap<DocumentFragment, any[]> = new WeakMap();
// const Expressions: WeakMap<DocumentFragment, any[]> = new WeakMap();

// class Html {
//     template: HTMLTemplateElement;
//     expressions: TemplateExpressionsArray;
//     constructor(template: HTMLTemplateElement, expressions: TemplateExpressionsArray) {
//         this.template = template;
//         this.expressions = expressions;
//     }
// }

export default function html(strings: TemplateStringsArray, ...expressions: Expressions): HTML {
    const template = cache.get(strings);
    if (template) {
        // console.log(expressions)

        // const length = cache.actions.length ?? 0;
        // for (let index = 0; index < length; index++) {
        //     const newExpression = expressions[index];
        //     const oldExpressions = cache.expressions[index];
        //     cache.actions[index](oldExpressions, newExpression);
        //     cache.expressions[index] = newExpression;
        // }

        // return cache.fragment;
        return { strings, template, expressions, symbol };
    } else {
        let data = '';

        const length = strings.length - 1;

        for (let index = 0; index < length; index++) {
            data += `${strings[index]}{{${index}}}`;
        }

        data += strings[length];

        const template = document.createElement('template');
        template.innerHTML = createHTML(data);

        cache.set(strings, template);

        return { strings, template, expressions, symbol };

        // const fragment = template.content.cloneNode(true) as DocumentFragment;
        // const expressions = [];
        // Expressions.set(fragment, expressions);

        // const actions: any = [];
        // Actions.set(fragment, actions);

        // render(fragment, expressions, actions);
        // document.adoptNode(fragment);

        // for (let index = 0; index < actions.length; index++) {
        //     const newExpression = expressions[index];
        //     actions[index](undefined, newExpression);
        // }

        // return fragment;

        // const cache = {
        // expressions,
        // actions: [] as TemplateActionsArray,
        // template: document.createElement('template')
        // fragment: template.content.cloneNode(true) as DocumentFragment
        // };

        // cache.template.innerHTML = createHTML(data);

        // Cache.set(strings, cache);

        // render(cache.fragment, cache.expressions, cache.actions);
        // document.adoptNode(cache.fragment);

        // for (let index = 0; index < cache.actions.length; index++) {
        //     const newExpression = cache.expressions[index];
        //     cache.actions[index](undefined, newExpression);
        // }

        // return cache.fragment;
    }
}

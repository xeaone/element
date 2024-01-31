import { InstanceSymbol, MarkerSymbol, TemplatesCache, TemplateSymbol, VariablesSymbol } from './global.ts';
import { Initialize, Variables } from './types.ts';
import { initialize } from './initialize.ts';
import { update } from './update.ts';
import { mark } from './tools.ts';

// const query = (node: Node, selector: Selector) => selector.reduce((n, s) => n[ s ], node);

export { update };

/**
 * @description
 * @param strings
 * @param variables
 * @returns {DocumentFragment}
 */

export const html = function (strings: TemplateStringsArray, ...variables: Variables): Initialize {
    let marker: string;
    let template: HTMLTemplateElement;

    const cache = TemplatesCache.get(strings);

    if (cache) {
        marker = cache.marker;
        template = cache.template;
    } else {
        marker = mark();

        let innerHTML = '';

        const length = strings.length - 1;
        for (let index = 0; index < length; index++) {
            innerHTML += `${strings[index]}${marker}`;
        }

        innerHTML += strings[length];

        template = document.createElement('template');
        template.innerHTML = innerHTML;

        TemplatesCache.set(strings, { template, marker });
    }

    const meta = {
        [InstanceSymbol]: true,
        [MarkerSymbol]: marker,
        [TemplateSymbol]: template,
        [VariablesSymbol]: variables,
    };

    return Object.assign(initialize.bind(meta, template, variables, marker), meta);
};

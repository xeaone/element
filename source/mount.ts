import { replaceChildren } from './poly';
import { Component } from './types';

const init = (target: typeof Component, selector: string) => {

    Object.defineProperties(target, { $mount: { value: selector } });

    if (!target.$tag) throw new Error('static tag required');
    if (!target.$mount) throw new Error('static mount required');

    const $extend = target.$extend;
    const $tag = target.$tag as string;
    const $mount = target.$mount as string;

    const ready = () => {
        const container = $mount === 'body' ? document.body : document.querySelector($mount);
        if (!container) throw new Error('XElement mount - container not found');

        const element = document.createElement($extend || $tag, $extend ? { is: $tag } : undefined);

        customElements.upgrade(element);
        replaceChildren(container, element)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('readystatechange', ready, { once: true });
    } else {
        ready();
    }

    return target;
};

export const mount = function (selector: string) {
    return <T extends typeof Component> (constructor: T, context?: ClassDecoratorContext): T => {
        if (context !== undefined) {
            return context.addInitializer(() => init(constructor, selector)) as unknown as T;
        } else {
            return init(constructor, selector) as unknown as T;
        }
    }
};

export default mount;

import dash from './dash';
import { replaceChildren } from './poly';
import { Constructor, MountInit } from './types';

export const mount = () => (constructor: Constructor, context?: ClassDecoratorContext) => {
// export const mount = (mountInit?: MountInit) => (constructor: Constructor, context?: ClassDecoratorContext) => {
    // mountInit = typeof mountInit === 'string' ? { selector: mountInit } : { ...mountInit };

    const target = constructor;
    const $selector = target.$selector;
    // const $selector = mountInit.selector ?? target.$selector;

    const init = () => {

        const ready = () => {
            const container = $selector ? document.querySelector($selector) : document.body;
            if (!container) throw new Error('XElement mount - container not found');

            const $tag = dash(target.$tag ?? target.name);
            const $extend = target.$extend;
            const element = document.createElement($extend || $tag, $extend ? { is: $tag } : undefined);

            customElements.upgrade(element);
            replaceChildren(container, element)
        };

        if (document.readyState === 'loading') {
            document.addEventListener('readystatechange', ready, { once: true });
        } else {
            ready();
        }

    };

    if (context !== undefined) {
        return context.addInitializer(init);
    } else {
        return init();
    }

};

export default mount;

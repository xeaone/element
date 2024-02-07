import { dash } from './dash.ts';

const cdc = { addInitializer(method: any) { method(); } } as ClassDecoratorContext;

export const define = function (tag: string, extend?: string) {
    return (constructor: CustomElementConstructor, context?: ClassDecoratorContext) => {
        context = context ?? cdc;
        context.addInitializer(function () {

            const $tag = dash(tag);
            const $extend = extend;
            customElements.define($tag, constructor, { extends: $extend });

        });
    };
};

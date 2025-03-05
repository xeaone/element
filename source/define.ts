import { dash } from './dash';

// export const define = function (tag: string, extend?: string) {
//     return (constructor: CustomElementConstructor, context: ClassDecoratorContext) => {
//         context.addInitializer(function () {
//             const $tag = dash(tag);
//             const $extend = extend;
//             customElements.define($tag, constructor, { extends: $extend });
//         });
//     };
// };

export const define = function (tag: string, extend?: string) {
    return function (constructor: CustomElementConstructor) {
        const $tag = dash(tag);
        const $extend = extend;
        customElements.define($tag, constructor, { extends: $extend });
    };
};

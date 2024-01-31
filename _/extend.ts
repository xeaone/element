import { Component } from './types';

const init = (target: typeof Component, tag: string) => {

    Object.defineProperties(target, {
        $extend: { value: tag },
    });

    return target;
};

export const extend = function (tag: string) {
    return <T extends typeof Component> (constructor: T, context?: ClassDecoratorContext): T => {
        if (context !== undefined) {
            return context.addInitializer(() => init(constructor, tag)) as unknown as T;
        } else {
            return init(constructor, tag) as unknown as T;
        }
    }
};

export default extend;

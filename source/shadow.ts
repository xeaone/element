import { Component, Shadow } from './types'

const init = (target: typeof Component, mode: Shadow) => {

    Object.defineProperties(target, {
        $shadow: { value: mode ?? 'open' },
    });

    return target;
};

export const shadow = function (mode: Shadow) {
    return <T extends typeof Component> (constructor: T, context?: ClassDecoratorContext): T => {
        if (context !== undefined) {
            return context.addInitializer(() => init(constructor, mode)) as unknown as T;
        } else {
            return init(constructor, mode) as unknown as T;
        }
    }
};

export default shadow;

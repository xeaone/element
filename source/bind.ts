import { Binder, Instructions, References, Variables } from './types';
import { BindersCache } from './global';
import { action } from './action';

export const bind = function (variables: Variables, instructions: Instructions, references: References) {

    const binder: Binder = {

        result: undefined,

        get node () {
            const [ reference ] = references;
            const node = reference.deref();
            if (node) {
                return node;
            } else {
                BindersCache.delete(this);
                return null;
            }
        },

        get references () {
            return references;
        },

        get instructions () {
            if (instructions.length) {
                BindersCache.delete(this);
            }
            return instructions;
        },

        get variables () {
            return variables;
        },

        remove () {
            BindersCache.delete(this);
        },

    };

    BindersCache.add(binder);

    action(binder);

};
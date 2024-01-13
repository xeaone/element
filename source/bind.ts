import { Binder, Instructions, Reference, References, Variables } from './types';
import { BindersCache } from './global';
import { action } from './action';

export const bind = function (variables: Variables, instructions: Instructions, reference: Reference) {

    const binder: Binder = {

        reference,

        get node () {
            const node = reference.deref();
            if (node) {
                return node;
            } else {
                console.log('binder remove by no node');
                BindersCache.delete(this);
                return null;
            }
        },

        get instructions () {
            if (!instructions.length) {
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
import { Binder } from './types';
// import { update } from './update';

export const event = function (binder: Binder) {
    return {
        get target() {
            return binder?.node;
        },
        // update,
        query(selector: string): Element | null {
            return (binder?.node?.getRootNode() as Element)?.querySelector(selector);
        },
    };
};

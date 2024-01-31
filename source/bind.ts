import { Binder, BinderType, ReferenceType, Variables } from './types.ts';
import { BindersCache } from './global.ts';

export const bind = function (
    type: BinderType,
    index: number,
    variables: Variables,
    // ...references: ReferenceType<unknown>[]
    referenceNode: ReferenceType<Node>,
    referenceName?: ReferenceType<any>,
    referenceValue?: ReferenceType<any>,
) {
    const binder: Binder = {
        type,

        // index,
        // variables,
        // references,
        isInitialized: false,

        get variable() {
            return variables[index];
        },

        set variable(data: any) {
            variables[index] = data;
        },

        get node() {
            const node = referenceNode.get();
            if (node) {
                return node;
            } else {
                BindersCache.delete(this);
                return undefined;
            }
        },

        get name() {
            return (referenceName as ReferenceType<any>).get();
        },

        set name(name: string) {
            (referenceName as ReferenceType<any>).set(name);
        },

        get value() {
            return (referenceValue as ReferenceType<any>).get();
        },

        set value(value: string) {
            (referenceValue as ReferenceType<any>).set(value);
        },

        remove() {
            BindersCache.delete(this);
        },

        add() {
            BindersCache.add(this);
        },
    };

    binder.add();

    return binder;
};

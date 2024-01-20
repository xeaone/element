import { Binder, BinderType, ReferenceType, Variables } from './types';
import { BindersCache } from './global';

export const bind = function (
    type: BinderType, index: number, variables: Variables,
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

        get variable () {
            return variables[ index ];
        },

        set variable (data: any) {
            variables[ index ] = data;
        },


        get node () {
            const node = referenceNode.get();
            if (node) {
                return node;
            } else {
                console.log('binder remove by no node');
                BindersCache.delete(this);
                return undefined;
            }
        },

        get name () {
            return (referenceName as ReferenceType<any>).get();
        },

        set name (name: string) {
            (referenceName as ReferenceType<any>).set(name);
        },

        get value () {
            return (referenceValue as ReferenceType<any>).get();
        },

        set value (value: string) {
            (referenceValue as ReferenceType<any>).set(value);
        },

        remove () {
            BindersCache.delete(this);
        },

        add () {
            BindersCache.add(binder);
        },

    };

    // action(binder);
    binder.add();

    return binder;
};

// export const bind = function (variables: Variables, instructions: Instructions, reference: Reference) {

//     const node = reference.deref();

//     const binder: Binder = {

//         reference,

//         get node () {
//             const node = reference.deref();
//             if (node) {
//                 return node;
//             } else {
//                 console.log('binder remove by no node');
//                 BindersCache.delete(this);
//                 return null;
//             }
//         },

//         get instructions () {
//             if (!instructions.length) {
//                 BindersCache.delete(this);
//             }
//             return instructions;
//         },

//         get variables () {
//             return variables;
//         },

//         remove () {
//             BindersCache.delete(this);
//         },

//     };

//     BindersCache.add(binder);

//     action(binder);

// };
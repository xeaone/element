import { Binder, BinderType, ReferenceType, Variables } from './types.ts';
import { BindersCache } from './global.ts';

// const mo = new MutationObserver(function (records) {
//     console.log(arguments);
//     for (const record of records) {
//         const { target } = record;
//     }
// });

// const ro = new ResizeObserver(function (entries) {
//     console.log(arguments);
//     for (const entry of entries) {
//         const { target } = entry;
//         if (target.isConnected) {
//             const childBinder = Bound.get(target);
//             const parentBinder = Bound.get(target.parentElement);
//             // console.log(childBinder, parentBinder, childBinder.value, parentBinder.value);
//             if (childBinder && parentBinder && childBinder.value === parentBinder.value) {
//                 target.selected = true;
//             }
//             ro.unobserve(target);
//         }
//     }
// });

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
            return variables[ index ];
        },

        set variable(data: any) {
            variables[ index ] = data;
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

    // if (type === 3) {
    //     const node = binder.node;
    //     const name = binder.name;

    //     if (node && node.nodeName === 'SELECT' && name === 'value') {
    //         // mo.observe(node, { childList: true, subtree: false });
    //         Bound.set(node, binder);
    //     }

    //     if (node && node.nodeName === 'OPTION' && name === 'value') {
    //         ro.observe(node as Element);
    //         Bound.set(node, binder);
    //     }
    // }

    return binder;
};

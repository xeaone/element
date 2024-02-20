import { Binder, BinderType, ReferenceType, Variables } from './types.ts';
import { BindersCache } from './global.ts';
import { update } from './update.ts';

// const mo = new MutationObserver(function (records) {
//     console.log(arguments);
//     for (const record of records) {
//         const { target } = record;
//     }
// });

// const ro = new ResizeObserver(function (entries) {
//     console.log(arguments);
//     // for (const entry of entries) {
//     //     const { target } = entry;
//     //     if (target.isConnected) {
//     //         const childBinder = Bound.get(target);
//     //         const parentBinder = Bound.get(target.parentElement);
//     //         console.log(childBinder, parentBinder, childBinder.value, parentBinder.value);
//     //         if (childBinder && parentBinder && childBinder.value === parentBinder.value) {
//     //             target.selected = true;
//     //         }
//     //         ro.unobserve(target);
//     //     }
//     // }
// });

const observed: WeakMap<Element, Binder> = new WeakMap();

const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        const { target } = entry;
        if (target.isConnected) {
            console.log(target.isConnected, target);
            // const binder = observed.get(target);
            // if (binder) {
            //     BindersCache.add(binder);
            //     // update();
            // }
        } else {
            // const binder = observed.get(target);
            // if (binder) {
            //     BindersCache.delete(binder);
            // }
        }
    }
}, {
    threshold: 1,
    // rootMargin: '100000%',
    root: document.documentElement,
});

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

    const node = binder.node;
    const parent = node?.parentElement;

    if (node instanceof Element) {
        io.observe(node as Element);
        observed.set(node, binder);
        // } else if (parent && parent instanceof Element) {
        //     io.observe(parent);
        //     observed.set(parent, binder);
        //     console.log(parent);
    } else {
        binder.add();
    }

    return binder;
};

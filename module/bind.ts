/**
* @version 10.0.0
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
import { Binder, BinderType, ReferenceType, Variables } from './types';
import { BindersCache } from './global';
// import { update } from './update';
// import { action } from './action';

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

// const observed: WeakMap<Element, Array<Binder>> = new WeakMap();
// const io = new IntersectionObserver(async (entries) => {
//     for (const entry of entries) {
//         const { target } = entry;
//         // if (target.isConnected) {
//         // } else {
//         //     console.log(target.isConnected, target);
//         // }
//         const binders = observed.get(target) as Binder[];

//         for (const binder of binders) {
//             try {
//                 await action(binder);
//             } catch (error) {
//                 console.error(error);
//             }
//         }

//     }
// }, {
//     threshold: 1,
//     // rootMargin: '100000%',
//     root: document.documentElement,
// });

export const bind = function (
    type: BinderType,
    index: number,
    variables: Variables,
    referenceNode: ReferenceType<Node>,
    referenceName?: ReferenceType<any>,
    referenceValue?: ReferenceType<any>,
) {
    const binder: Binder = {
        type,

        // index,
        // variables,
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

    // const node = binder.node;
    // const parent = node?.parentElement;

    // if (node instanceof Element) {
    //     const binders = observed.get(node);
    //     if (binders) {
    //         binders.push(binder);
    //     } else {
    //         io.observe(node);
    //         observed.set(node, [binder]);
    //     }
    // } else if (parent instanceof Element) {
    //     if (!document.contains(parent)) {
    //         console.log(parent);
    //     }

    //     const binders = observed.get(parent);
    //     if (binders) {
    //         binders.push(binder);
    //     } else {
    //         io.observe(parent);
    //         observed.set(parent, [binder]);
    //     }
    // } else {
    //     // binder.add();
    //     console.warn('top level reactive text bindings');
    // }

    binder.add();

    return binder;
};

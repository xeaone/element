import { isValue, hasOn, isLink, dangerousLink, sliceOn } from './tools.ts';
import { Binder } from './types.ts';
import { update } from './update.ts';

export const attributeValue = function (element: Element, binder: Binder, source: any, target: any): void {

    if (source === target) {
        return;
    }

    if (isValue(binder.name)) {
        binder.value = target;
        // binder.value = display(target);
        // if (!binder.name) return;
        element.setAttribute(binder.name, binder.value);
        Reflect.set(element, binder.name, binder.value);
    } else if (isLink(binder.name)) {
        binder.value = encodeURI(target);
        // if (!binder.name) return;

        if (dangerousLink(binder.value)) {
            element.removeAttribute(binder.name);
            console.warn(`XElement - attribute name "${binder.name}" and value "${binder.value}" not allowed`);
            return;
        }

        element.setAttribute(binder.name, binder.value);
    } else if (hasOn(binder.name)) {
        console.log(binder);

        if (element.hasAttribute(binder.name)) {
            element.removeAttribute(binder.name);
        }

        if (typeof source === 'function') {
            element.removeEventListener(sliceOn(binder.name), source, true);
        }

        if (typeof target !== 'function') {
            return console.warn(`XElement - attribute name "${binder.name}" expected a function`);
        }

        binder.value = function () {
            const result = target.call(this, ...arguments);
            if (binder.result !== result) {
                binder.result = result;
                update();
            }
            return result;
        };

        element.addEventListener(sliceOn(binder.name), binder.value, true);

    } else {
        binder.value = target;
        // if (!binder.name) return;
        element.setAttribute(binder.name, binder.value);
        Reflect.set(element, binder.name, binder.value);
    }
};


// const attribute = function (node: Attr, binder: Binder, source: any, target: any) {
//     const name = node.name;
//     const value = node.value;

//     if (hasOn(name)) {

//         if (isAnimation(name)) {
//             // const variable = binder.result;
//             const isArray = Array.isArray(binder.result);
//             const method = isArray ? binder.result[ 0 ] : binder.result;
//             const handle = async () => {
//                 if (binder.owner?.isConnected) {
//                     const result = method();
//                     if (binder.result === result) {
//                         requestAnimationFrame(handle);
//                     } else {
//                         binder.result = result;
//                         await update();
//                         requestAnimationFrame(handle);
//                     }
//                 } else {
//                     requestAnimationFrame(handle);
//                 }
//             };
//             requestAnimationFrame(handle);
//         } else if (isTimeout(name)) {
//             // const variable = binder.variable;
//             // const isArray = Array.isArray(variable);
//             // const method = isArray ? variable[ 0 ] : variable;
//             // const time = isArray ? variable[ 1 ] : undefined;

//             const isArray = Array.isArray(binder.result);
//             const method = isArray ? binder.result[ 0 ] : binder.result;
//             const time = isArray ? binder.result[ 1 ] : undefined;
//             const handle = async () => {
//                 const result = method();
//                 if (binder.result === result) {
//                     return;
//                 } else {
//                     binder.result = result;
//                     await update();
//                 }
//             };
//             setTimeout(handle, time);
//         } else {
//             const owner = binder.owner;
//             if (owner) {
//                 const eventName = name.substring(2);
//                 const isArray = Array.isArray(result);
//                 const [ method, options ] = isArray ? result : [ result, undefined ];
//                 if (typeof method === 'function') {
//                     // owner.removeEventListener(eventName, result);
//                     owner.addEventListener(eventName, async function (event) {
//                         const returned = method(event);
//                         if (binder.meta.returned !== returned) {
//                             binder.meta.returned = returned;
//                             await update();
//                         }
//                     }, options);
//                     intersectionObserver.observe(owner);
//                 } else {
//                     console.error(`${name} requiures function or array with function`);
//                 }
//             }
//         }

//         const owner = binder.owner;
//         if (owner) {
//             owner.removeAttributeNode(node);
//         }

//     // } else if (isMarker(name)) {
//     } else if (value === '') {
//         if (name === result) {
//             if (!binder.owner?.hasAttribute(result)) {
//                 addAttribute(binder.owner as Element, node);
//                 Reflect.set(binder.owner as Element, result, true);
//             }
//         } else {
//             if (result) {
//                 removeAttribute(node);
//                 binder.replace(createAttribute(binder.owner as Element, result));
//                 Reflect.set(binder.owner as Element, result, true);
//             } else {
//                 removeAttribute(node);
//                 Reflect.set(binder.owner as Element, result, false);
//             }
//         }
//     } else if (result instanceof Attr) {

//     } else {
//         node.value = result;
//     }
// };
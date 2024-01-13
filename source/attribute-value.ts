import { isValue, hasOn, isLink, dangerousLink, sliceOn } from './tools.ts';
import { update } from './update.ts';

export const attributeValue = function (element: Element, data: any, source: any, target: any): void {
    console.log(element, source, target);

    if (source === target) {
        return;
    }

    if (isValue(data.name)) {
        data.value = target;
        // data.value = display(target);
        // if (!data.name) return;
        element.setAttribute(data.name, data.value);
        Reflect.set(element, data.name, data.value);
    } else if (isLink(data.name)) {
        data.value = encodeURI(target);
        // if (!data.name) return;

        if (dangerousLink(data.value)) {
            element.removeAttribute(data.name);
            console.warn(`XElement - attribute name "${data.name}" and value "${data.value}" not allowed`);
            return;
        }

        element.setAttribute(data.name, data.value);
    } else if (hasOn(data.name)) {
        console.log(data);


        if (element.hasAttribute(data.name)) {
            element.removeAttribute(data.name);
        }

        if (typeof data.value === 'function') {
            element.removeEventListener(sliceOn(data.name), data.value, true);
        }

        if (typeof target !== 'function') {
            return console.warn(`XElement - attribute name "${data.name}" and value "${data.value}" not allowed`);
        }

        data.value = function () {
            const result = target.call(this, ...arguments);
            if (data.result !== result) {
                data.result = result;
                update();
            }
            return result;
        };

        element.addEventListener(sliceOn(data.name), data.value, true);

    } else {
        data.value = target;
        // if (!data.name) return;
        element.setAttribute(data.name, data.value);
        Reflect.set(element, data.name, data.value);
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
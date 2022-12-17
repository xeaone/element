import clone from './clone.ts';
import parse from './parse.ts';

const HtmlCache = new WeakMap();

export default function html(strings: string[], ...values: any[]) {
    const cache = HtmlCache.get(strings);
    if (cache) return clone(cache, values);

    let data = '';

    const length = strings.length;
    const last = strings.length - 1;

    for (let index = 0; index < length; index++) {
        if (index === last) {
            data += strings[index];
        } else {
            data += `${strings[index]}{{${index}}}`;
        }
    }

    const parsed = parse(data);
    console.log(data, parsed);

    HtmlCache.set(strings, parsed);

    return clone(parsed, values);
}

// const upgrade = function (node: Node, values:any[]) {
//     if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
//         let child = node.firstChild;
//         while(child) {
//             upgrade(child, values);
//             child = child.nextSibling;
//         }
//     } else if (node.nodeType === Node.TEXT_NODE) {

//         const start = node.nodeValue?.indexOf('x-x-') ?? -1;
//         if (start === -1) return;
//         if (start !== 0) node = (node as Text).splitText(start);

//         const end = node.nodeValue?.indexOf('-x-x') ?? -1;
//         if (end === -1) return;

//         if (end + 4 !== node.nodeValue?.length) {
//             upgrade((node as Text).splitText(end + 4), values);
//         }

//         const value = values.shift();
//         if (value instanceof Array) {
//             for (const item of value) {
//                 node.parentNode?.insertBefore(
//                     item instanceof Node ? item : document.createTextNode(`${item}`), node
//                 );
//             }
//             node.parentNode?.removeChild(node);
//         } else {
//             node.parentNode?.replaceChild(
//                 value instanceof Node ? value : document.createTextNode(`${value}`), node
//             );
//         }

//         // if (node.textContent) {
//         //     for (const key in values) {
//         //         console.log(values, values[key])
//         //         node.textContent = node.textContent.replace(key, values[key]);
//         //     }
//         // }
//     } else if (node.nodeType === Node.ELEMENT_NODE) {
//         if ((node as Element).hasAttributes()) {
//             const attributes = (node as Element).getAttributeNames();
//             // const attributes = [...(node as Element).attributes];
//             for (const attribute of attributes) {
//                 const name = attribute.replace(/x-x-[0-9]+-x-x/g, () => values.shift());

//                 if (name.startsWith('on')) {
//                     // (node as Element).addEventListener(attribute.name, value)
//                     // (node as Element).removeAttributeNode(attribute);
//                     Reflect.set(node, name, values.shift());
//                     continue;
//                 }

//                 const value = ((node as Element).getAttribute(attribute) as string).replace(/x-x-[0-9]+-x-x/g, () => values.shift());

//                 if (attribute !== name) {
//                     (node as Element).removeAttribute(attribute);
//                 }

//                 Reflect.set(node, name, value);
//                 (node as Element).setAttribute(name, value);
//             }
//         }
//         let child = node.firstChild;
//         while(child) {
//             upgrade(child, values);
//             child = child.nextSibling;
//         }
//     }
// }

// export default function html(strings: string[], ...values: any[]) : DocumentFragment {

//     const cache = HtmlCache.get(strings);
//     if (cache) {
//         const clone = cache.content.cloneNode(true) as DocumentFragment;
//         upgrade(clone, values);
//         console.log('cache',cache.innerHTML);
//         return clone;
//     }

//     let data = '';

//     for (let index = 0; index < strings.length; index++) {
//         if (index >= values.length) {
//             data += strings[index];
//             continue;
//         }

//         data += `${strings[index]}x-x-${index}-x-x`;
//     }

//     const template = document.createElement('template');
//     template.innerHTML = data;
//     HtmlCache.set(strings, template);

//     const clone = template.content.cloneNode(true) as DocumentFragment;
//     upgrade(clone, values);

//     return clone;
// }

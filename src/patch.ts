import { BooleanAttributes } from './tool.ts';
import { FragmentNode, VirtualNode } from './types.ts';
import display from './display.ts';

const clean = 7;
// const OnCache = new WeakMap();

const attribute = function (element: Element, name: string, value: string, properties: any) {
    console.log(arguments);
    if (name.startsWith('data-x-')) {
        const property = properties[name.slice(clean)];

        if (property.name === 'value') {
            // if (element.getAttribute('value') === ) continue;
            element.setAttribute(property.name, property.value);
            Reflect.set(element, property.name, property.value);
        } else if (property.name.startsWith('on')) {
            // if (OnCache.get(element) === property.value) continue;
            console.log(property);
            element.removeAttribute(property.name);
            element.addEventListener(property.name, property.value);
        } else if (BooleanAttributes.includes(property.name)) {
            const result = property.value ? true : false;
            const has = element.hasAttribute(property.name);
            if (has === result) return;
            if (result) element.setAttribute(property.name, '');
            else element.removeAttribute(property.name);
            Reflect.set(element, property.name, result);
        }

        if (element.getAttribute(property.name) === property.value) return;
        element.setAttribute(property.name, property.value);
        Reflect.set(element, property.name, property.value);
    } else {
        if (element.getAttribute(name) === value) return;
        element.setAttribute(name, value);
        Reflect.set(element, name, value);
    }
};

// const attributes = function (source: Element, target: Element, bindings: any) {
//     const targetAttributeNames = target.hasAttributes() ? [...target.getAttributeNames()] : [];
//     const sourceAttributeNames = source.hasAttributes() ? [...source.getAttributeNames()] : [];

//     for (const name of targetAttributeNames) {
//         if (name === 'data-x-value') {
//             const { value } = bindings[target.getAttribute(name) as string];
//             const result = `${value == undefined ? '' : value}`;
//             if (source.getAttribute('value') === result) continue;
//             Reflect.set(source, 'value', result);
//             source.setAttribute('value', result);
//         } else if (name.startsWith('data-x-on')) {
//             const { value } = bindings[target.getattribute(name) as string];
//             if (OnCache.get(source) === value) continue;
//             source.addeventlistener(name.slice(9), value);
//         } else if (BooleanAttributes.includes(name.slice(7))) {
//             const { value } = bindings[target.getAttribute(name) as string];
//             const slice = name.slice(7);
//             const result = value ? true : false;
//             const has = source.hasAttribute(slice);
//             if (has === result) continue;
//             Reflect.set(source, name, result);
//             if (result) source.setAttribute(slice, '');
//             else source.removeAttribute(slice);
//         } else if (name.startsWith('data-x')) {
//             const { value } = bindings[target.getAttribute(name) as string];
//             const slice = name.slice(7);
//             const result = display(value);
//             console.log(result, value, source);
//             if (source.getAttribute(slice) === result) continue;
//             source.setAttribute(slice, result);
//         } else {
//             const sourceAttributeValue = source.getAttribute(name);
//             const targetAttributeValue = target.getAttribute(name);
//             if (sourceAttributeValue !== targetAttributeValue) {
//                 source.setAttribute(name, targetAttributeValue as string);
//                 Reflect.set(source, name, targetAttributeValue);
//             }
//         }
//     }

//     for (const name of sourceAttributeNames) {
//         if (targetAttributeNames.includes(`data-x-${name}`)) continue;
//         if (!targetAttributeNames.includes(name)) source.removeAttribute(name);
//     }
// };

// const children = function (node: Node, bindings: any) {
//     if (node instanceof Element) {
//         const nodeAttributeNames = node.hasAttributes() ? [...node.getAttributeNames()] : [];

//         for (const name of nodeAttributeNames) {
//             if (name === 'data-x-value') {
//                 const { value } = bindings[node.getAttribute(name) as string];
//                 const result = `${value == undefined ? '' : value}`;
//                 Reflect.set(node, 'value', result);
//                 node.setAttribute('value', result);
//                 node.removeAttribute(name);
//             } else if (name.startsWith('data-x-on')) {
//                 const { value } = bindings[node.getAttribute(name) as string];
//                 OnCache.set(node, value);
//                 node.addEventListener(name.slice(9), value);
//                 node.removeAttribute(name);
//             } else if (BooleanAttributes.includes(name.slice(7))) {
//                 const { value } = bindings[node.getAttribute(name) as string];
//                 const slice = name.slice(7);
//                 const result = value ? true : false;
//                 Reflect.set(node, name, result);
//                 if (result) node.setAttribute(slice, '');
//                 else node.removeAttribute(slice);
//                 node.removeAttribute(name);
//             } else if (name.startsWith('data-x')) {
//                 const { value } = bindings[node.getAttribute(name) as string];
//                 const slice = name.slice(7);
//                 const result = display(value);
//                 node.setAttribute(slice, result);
//                 node.removeAttribute(name);
//             }
//         }
//     }

//     let child = node.firstChild;
//     while (child) {
//         children(child, bindings);
//         child = child.nextSibling;
//     }
// };
// const append = function (parent: Node, child: Node, bindings: any) {
//     children(child, bindings);
//     parent.appendChild(child);
// };

const attributes = function (source: Element, target: VirtualNode, properties: any) {
    // const parameters = target[ParametersSymbol];
    const attributes = target.attributes;

    // if (attributes['type']) {
    //     const value = attributes['type'];
    //     attribute(source, 'type', value, parameters['type']);
    // }

    for (const name in attributes) {
        // if (name === 'type') continue;
        const value = attributes[name];
        attribute(source, name, value, properties);
    }

    if (source.hasAttributes()) {
        const names = source.getAttributeNames();
        for (const name of names) {
            if (!(name in attributes)) {
                source.removeAttribute(name);
            }
        }
    }
};

const create = function (owner: Document, node: VirtualNode, properties: any): Element {
    const element = owner.createElement(node.name);

    const children = node.children;
    for (const child of children) {
        append(element, child, properties);
    }

    const attributes = node.attributes;
    for (const name in attributes) {
        const value = attributes[name];
        attribute(element, name, value, properties);
    }

    return element;
};

const append = function (parent: Node, child: VirtualNode, properties: any) {
    const owner = parent.ownerDocument as Document;
    if (child.type === Node.ELEMENT_NODE) {
        console.log(parent, child);
        parent.appendChild(create(owner, child, properties));
    } else if (child.type === Node.COMMENT_NODE) {
        parent.appendChild(owner.createComment(child.value));
    } else if (child.type === Node.CDATA_SECTION_NODE) {
        parent.appendChild(owner.createCDATASection(child.value));
    } else {
        parent.appendChild(owner.createTextNode(display(child.value)));
    }
};

const remove = function (parent: Node) {
    const child = parent.lastChild;
    if (child) parent.removeChild(child);
};

const common = function (source: Node, target: VirtualNode, properties: any) {
    console.log(source, target);
    if (!source.parentNode) throw new Error('source parent node not found');

    const owner = source.ownerDocument as Document;

    if (source.nodeName !== target.name) {
        // if (source.nodeName !== target.nodeName) {
        // source.parentNode?.replaceChild(target, source);
        source.parentNode?.replaceChild(create(owner, target, properties), source);
        return;
    }

    if (target.name === '#text') {
        // if (target.nodeName === '#text') {
        // if (source.nodeValue !== target.nodeValue) {
        //     source.nodeValue = target.nodeValue;
        // }

        if (source.nodeValue !== target.value) {
            source.nodeValue = target.value;
        }

        return;
    }

    if (target.nodeName === '#comment') {
        if (source.nodeValue !== target.value) {
            // source.nodeValue = target.nodeValue;
            source.nodeValue = target.value;
        }

        return;
    }

    if (!(source instanceof Element)) throw new Error('source node not valid');
    // if (!(target instanceof Element)) throw new Error('target node not valid');

    const targetChildren = target.children;
    // const targetChildren = [...target.childNodes];
    const targetLength = targetChildren.length;
    const sourceChildren = [...source.childNodes];
    const sourceLength = sourceChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);

    let index;

    for (index = 0; index < commonLength; index++) {
        common(sourceChildren[index], targetChildren[index], properties);
    }

    if (sourceLength > targetLength) {
        for (index = targetLength; index < sourceLength; index++) {
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for (index = sourceLength; index < targetLength; index++) {
            append(source, targetChildren[index], properties);
        }
    }

    attributes(source, target, properties);
};

export default function patch(source: Element, target: FragmentNode, properties: any) {
    let index;

    const targetChildren = target.children;
    // const targetChildren = [...target.childNodes];
    const targetLength = targetChildren.length;

    const sourceChildren = [...source.childNodes];
    const sourceLength = sourceChildren.length;

    const commonLength = Math.min(sourceLength, targetLength);

    for (index = 0; index < commonLength; index++) {
        common(sourceChildren[index], targetChildren[index], properties);
    }

    if (sourceLength > targetLength) {
        for (index = targetLength; index < sourceLength; index++) {
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for (index = sourceLength; index < targetLength; index++) {
            append(source, targetChildren[index], properties);
        }
    }
}

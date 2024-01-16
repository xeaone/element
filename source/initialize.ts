import { ELEMENT_NODE, SHOW_ELEMENT, SHOW_TEXT, TEXT_NODE, dangerousLink, hasMarker, hasOn, isLink, matchMarker, replaceChildren } from './tools';
import { Marker, Template, Variables, Container, ReferenceType } from './types';
import { Reference } from './reference';
import { update } from './update';
import { bind } from './bind';
import { action } from './action';

const FILTER = SHOW_ELEMENT + SHOW_TEXT;

// type ReferenceId = symbol;
// type ReferenceNode = WeakRef<Element | Attr | Text>;
// const References: Map<ReferenceKey, ReferenceValue> = new Map();

export const initialize = function (template: Template, variables: Variables, marker: Marker, container?: Container): Element | DocumentFragment {

    // if (typeof container === 'string') {
    //     const selection = document.querySelector(container);
    //     if (!selection) throw new Error('query not found');
    //     const cache = ContainersCache.get(selection);
    //     if (cache && cache === template) {
    //         update();
    //         return selection;
    //     } else {
    //         ContainersCache.set(selection, template);
    //     }
    // } else if (container instanceof Element) {
    //     const cache = ContainersCache.get(container);
    //     if (cache && cache === template) {
    //         update();
    //         return container;
    //     } else {
    //         ContainersCache.set(container, template);
    //     }
    //     console.log(ContainersCache)
    // }

    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const walker = document.createTreeWalker(fragment, FILTER, null);
    const virtuals = [];

    // let text: Text;
    // let attribute: Attr;
    // let element: Element;

    // let type: number;
    // let name: string;
    // let value: string;
    // let names: string[];
    let node: Node | null;

    let startIndex: number;
    let endIndex: number;

    let index = 0;

    while (walker.nextNode()) {
        node = walker.currentNode;
        const type = node.nodeType;

        if (type === TEXT_NODE) {
            let text = node as Text;

            startIndex = text.nodeValue?.indexOf(marker) ?? -1;
            if (startIndex === -1) continue;

            if (startIndex !== 0) {
                text.splitText(startIndex);
                node = walker.nextNode() as Node | null;
                text = node as Text;
            }

            endIndex = marker.length;
            if (endIndex !== text.nodeValue?.length) {
                text.splitText(endIndex);
            }

            const referenceNode = Reference<Node>(text);
            const binder = bind(4, index++, variables, referenceNode);
            action(binder);

        } else if (type === ELEMENT_NODE) {
            const element = node as Element;
            const tag = element.tagName.toLowerCase();

            if (tag === 'STYLE' || tag === 'SCRIPT') {
                walker.nextSibling();
            }

            let referenceNode: ReferenceType<Node> | undefined;
            // let virtual: any;

            if (matchMarker(tag, marker)) {
                referenceNode = Reference(node);
                // virtuals.push(virtual);
                const binder = bind(1, index++, variables, referenceNode);
                action(binder);
            }

            const names = element.getAttributeNames();
            for (const name of names) {
                const value = element.getAttribute(name) ?? '';
                const matchMarkerName = matchMarker(name, marker);
                const hasMarkerValue = hasMarker(value, marker);

                if (matchMarkerName || hasMarkerValue) {
                    referenceNode = referenceNode ?? Reference(node);

                    const referenceName = Reference<string>(name);
                    const referenceValue = Reference<string>(value);

                    if (matchMarkerName) {
                        const binder = bind(2, index++, variables, referenceNode, referenceName, referenceValue);
                        action(binder);
                    }

                    if (hasMarkerValue) {
                        const binder = bind(3, index++, variables, referenceNode, referenceName, referenceValue);
                        action(binder);
                    }

                    element.removeAttribute(name);
                } else {
                    if (isLink(name)) {
                        if (dangerousLink(value)) {
                            element.removeAttribute(name);
                            console.warn(`attribute name "${name}" and value "${value}" not allowed`);
                        }
                    } else if (hasOn(name)) {
                        element.removeAttribute(name);
                        console.warn(`attribute name "${name}" not allowed`);
                    }
                }

            }

        } else {
            console.warn(`walker node type "${type}" not handled`);
        }
    }

    if (typeof container === 'string') {
        const selection = document.querySelector(container);
        if (!selection) throw new Error('query not found');
        replaceChildren(selection, fragment);
        return selection;
    } else if (container instanceof Element) {
        replaceChildren(container, fragment)
        return container;
    } else {
        return fragment;
    }

};

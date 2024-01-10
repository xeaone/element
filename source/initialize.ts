import { ELEMENT_NODE, SHOW_ELEMENT, SHOW_TEXT, TEXT_NODE, dangerousLink, hasMarker, hasOn, isLink, isMarker, replaceChildren } from './tools';
import { Marker, Template, Variables, Container } from './types';
import { ContainersCache } from './global';
import { update } from './update';
import { bind } from './bind';

const FILTER = SHOW_ELEMENT + SHOW_TEXT;

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

    let text: Text;
    let attribute: Attr;
    let element: Element;

    let type: number;
    let name: string;
    let value: string;
    let names: string[];
    let node: Node | null;

    let startIndex: number;
    let endIndex: number;

    let index = 0;

    while (walker.nextNode()) {
        node = walker.currentNode;
        type = node.nodeType;

        if (type === TEXT_NODE) {
            text = node as Text;

            startIndex = text.nodeValue?.indexOf(marker) ?? -1;
            if (startIndex === -1) continue;

            if (startIndex !== 0) {
                text.splitText(startIndex);
                node = walker.nextNode();
                text = node as Text;
            }

            endIndex = marker.length;
            if (endIndex !== text.nodeValue?.length) {
                text.splitText(endIndex);
            }

            bind(text, variables, index++);

        } else if (type === ELEMENT_NODE) {
            element = node as Element;

            if (element.nodeName === 'SCRIPT' || element.nodeName === 'STYLE') {
                walker.nextSibling();
            }

            if (isMarker(element.nodeName, marker)) {
                bind(element, variables, index++);
            }

            names = element.getAttributeNames();
            for (name of names) {
                value = element.getAttribute(name) ?? '';

                if (hasMarker(name, marker) || hasMarker(value, marker)) {
                    attribute = element.getAttributeNode(name) as Attr;

                    if (hasMarker(name, marker)) {
                        bind(attribute, variables, index++);
                    }

                    if (hasMarker(value, marker)) {
                        bind(attribute, variables, index++);
                    }

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

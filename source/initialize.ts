import { ELEMENT_NODE, SHOW_ELEMENT, SHOW_TEXT, TEXT_NODE, dangerousLink, hasMarker, hasOn, isLink, matchMarker, replaceChildren } from './tools';
import { Marker, Template, Variables, Container, Instructions, Reference } from './types';
import { ContainersCache } from './global';
import { update } from './update';
import { bind } from './bind';

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

            const reference: Reference = new WeakRef(text);
            const instructions: Instructions = [{ type: 4, index: index++, data: {} }];
            bind(variables, instructions, reference);

        } else if (type === ELEMENT_NODE) {
            const element = node as Element;
            const tag = element.tagName.toLowerCase();

            if (tag === 'STYLE' || tag === 'SCRIPT') {
                walker.nextSibling();
            }

            let instructions: Instructions | undefined;
            let reference: Reference | undefined;

            if (matchMarker(tag, marker)) {
                reference = new WeakRef(element);
                instructions = [{ type: 1, index: index++, data: { tag } }];
            }

            const names = element.getAttributeNames();
            for (const name of names) {
                const value = element.getAttribute(name) ?? '';
                const matchMarkerName = matchMarker(name, marker);
                const hasMarkerValue = hasMarker(value, marker);

                if (matchMarkerName || hasMarkerValue) {

                    reference = reference ?? new WeakRef(element);
                    instructions = instructions ?? [];

                    const data = { name, value };

                    if (matchMarkerName) {
                        data.name = '';
                        instructions.push({ type: 2, index: index++, data });
                    }

                    if (hasMarkerValue) {
                        data.value = '';
                        instructions.push({ type: 3, index: index++, data });
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

            if (instructions && reference) {
                bind(variables, instructions, reference);
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

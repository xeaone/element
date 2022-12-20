// import patch from './patch.ts';
import patch from './patch-dom.ts';
import html from './html.ts';
import parse from './parse.ts';
import booleans from './booleans.ts';
import { VirtualNode } from './types.ts';

(window as any).x = {};

export default async function render(root: Element, context: any, component: any) {
    if (context.upgrade) await context.upgrade()?.catch?.(console.error);

    const { strings, values } = component(html, context);

    let data = '';
    const length = strings.length - 1;

    for (let index = 0; index < length; index++) {
        // const value = values[index];
        data += `${strings[index]}{{${index}}}`;

        // if (value?.constructor === Array) {
        //     data += `${strings[index]}`;
        //     for (const child of value) {
        //         for (let ii = 0; ii < child.strings.length; ii++) {
        //             data += `${child.strings[ii]}${child.values[ii] ?? ''}`;
        //         }
        //     }
        // } else if (value?.constructor === Function) {
        //         // const id = ID++;
        //         const id = index;
        //         (window as any).x[id] = value;
        //         data += `${strings[index]}window.x[${id}](event)`;
        // } else {
        //     data += `${strings[index]}${value}`;
        //     // data += `${strings[index]}{{${index}}}`;
        // }
    }

    data += strings[strings.length - 1];

    // parse(root, values, data);

    const template = document.createElement('template');
    template.innerHTML = data;
    // const clone = template.content.cloneNode(true) as DocumentFragment;

    const bound = [];
    const walker = document.createTreeWalker(document, 5, null);
    walker.currentNode = template.content;
    let node:Node|null = template.content.firstChild;
    while ((node = walker.nextNode()) !== null) {
        if (node.nodeType === Node.TEXT_NODE) {

            const start = node.nodeValue?.indexOf('{{') ?? -1;
            if (start == -1) continue;
            if (start != 0) {
                (node as Text).splitText(start);
                node = walker.nextNode() as Node;
            }

            const end = node.nodeValue?.indexOf('}}') ?? -1;
            if (end == -1) continue;

            if (end + 2 != node.nodeValue?.length) {
                (node as Text).splitText(end + 2);
            }

            bound.push(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {

            const attributes = [ ...(node as Element).attributes ];
            for (const attribute of attributes) {
                if (attribute.value.includes('{{') && attribute.value.includes('}}')) {
                    bound.push(attribute);
                }
            }

        }
    }
    console.log(bound);


    // const query = `//*[contains(text(), '{{')]`;
    // const query = `//comment()[contains(., '{{') and contains(., '}}')]`;
    // const query = `//*[@*[contains(., '{{') and contains(., '}}')]]`;
    // const query = `//*[contains(text(), '{{') and contains(text(), '}}')]`;
    // const result = document.evaluate(query, (template.content as any).firstChild, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    // let node = null;
    // let records = [];
    // while (node = result.iterateNext()) {
    //     console.log(node);
    //     records.push(node);
    // }

    patch(root, template.content);

    // const cloned = clone(parsed, result.values);
    // patch(root, cloned);
    // patch(root, parsed);

    // patch(root, template);
    // patch(root, template.content, bindings);
    if (context.upgraded) await context.upgraded()?.catch(console.error);
}

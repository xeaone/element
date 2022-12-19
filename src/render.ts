import patch from './patch.ts';
import html from './html.ts';
import parse from './parse.ts';
import booleans from './booleans.ts';
import { VirtualNode } from './types.ts';

// (window as any).x = {};
// const template = document.createElement('template');

export default async function render(root: Element, context: any, component: any) {
    if (context.upgrade) await context.upgrade()?.catch?.(console.error);

    const { strings, values } = component(html, context);

    let data = '';
    const length = strings.length - 1;

    for (let index = 0; index < length; index++) {
        const value = values[index];

        if (value?.constructor === Array) {
            data += `${strings[index]}`;
            for (const child of value) {
                for (let ii = 0; ii < child.strings.length; ii++) {
                    data += `${child.strings[ii]}${child.values[ii] ?? ''}`;
                }
            }
            // } else if (value?.constructor === Function) {
            //     const id = ID++;
            //     (window as any).x[id] = value;
            //     data += `${strings[index]}window.x[${id}](event)`;
        } else {
            // data += `${strings[index]}${value}`;
            data += `${strings[index]}{{${index}}}`;
        }
    }

    data += strings[strings.length - 1];

    const parsed = parse(root, values, data);
    console.log(parsed);

    // i think this might be faster
    // template.innerHTML = data;

    // const cloned = clone(parsed, result.values);
    // patch(root, cloned);
    // patch(root, parsed);

    // patch(root, template);
    // patch(root, template.content, bindings);
    if (context.upgraded) await context.upgraded()?.catch(console.error);
}

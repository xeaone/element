import { Item } from './types.ts';
import Attribute from './attribute.ts';
import Text from './text.ts';

export default function Create(item: Item): Element {
    const element = document.createElement(item.name);

    for (const name in item.attributes) {
        const value = item.attributes[name];
        Attribute(element, name, value);
        // if (name.startsWith('on')) {
        //     Reflect.set(element, `x${name}`, value);
        //     element.addEventListener(name.slice(2), value);
        // } else {
        //     element.setAttribute(name, value);
        // }
    }

    for (const child of item.children) {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(Create(child));
        }
    }

    return element;
}

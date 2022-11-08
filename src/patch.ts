import { Item } from './types.ts';
import Attribute from './attribute.ts';
import Create from './create.ts';
import Text from './text.ts';
import { ChildrenSymbol, ElementSymbol, TypeSymbol } from './tool.ts';

const PatchNode = function (source: Node, target: any) {
    //

    if (target?.[TypeSymbol] !== ElementSymbol) {
        const value = Text(target);
        if (source.textContent !== value) source.textContent = value;
        return;
    }

    if (source.nodeName !== target.name.toUpperCase()) {
        source.parentNode?.replaceChild(Create(target), source);
        return;
    }

    if (!(source instanceof Element)) throw new Error('Patch - source type not handled');

    for (const name in target.attributes) {
        const value = target.attributes[name];
        Attribute(source as Element, name, value);
    }

    if (source.hasAttributes()) {
        const names = source.getAttributeNames();
        for (const name of names) {
            if (!(name in target.attributes)) {
                source.removeAttribute(name);
            }
        }
    }

    const targetChildren = target.children;
    const sourceChildren = source.childNodes;
    const sourceLength = sourceChildren.length;
    const targetLength = targetChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);

    for (let index = 0; index < commonLength; index++) { // patch common nodes
        PatchNode(sourceChildren[index], targetChildren[index]);
    }

    if (sourceLength > targetLength) { // remove additional nodes
        let child;
        for (let index = targetLength; index < sourceLength; index++) {
            child = source.lastChild;
            if (child) source.removeChild(child);
        }
    } else if (sourceLength < targetLength) { // append additional nodes
        let child;
        for (let index = sourceLength; index < targetLength; index++) {
            child = targetChildren[index];
            if (child && child[TypeSymbol] === ElementSymbol) {
                source.appendChild(Create(child));
            } else {
                source.appendChild(document.createTextNode(Text(child)));
            }
        }
    }
};

export default function Patch(source: Element, fragment: Array<Item>) {
    const targetChildren = fragment;
    const sourceChildren = source.childNodes;
    const sourceLength = sourceChildren.length;
    const targetLength = targetChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);

    for (let index = 0; index < commonLength; index++) { // patch common nodes
        PatchNode(sourceChildren[index], targetChildren[index]);
    }

    if (sourceLength > targetLength) { // remove additional nodes
        let child;
        for (let index = targetLength; index < sourceLength; index++) {
            child = source.lastChild;
            if (child) source.removeChild(child);
        }
    } else if (sourceLength < targetLength) { // append additional nodes
        let child;
        for (let index = sourceLength; index < targetLength; index++) {
            child = targetChildren[index];
            if (child && child[TypeSymbol] === ElementSymbol) {
                source.appendChild(Create(child));
            } else {
                source.appendChild(document.createTextNode(Text(child)));
            }
        }
    }
}

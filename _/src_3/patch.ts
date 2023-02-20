import Attribute from './attribute.ts';
import Display from './display.ts';

import { Item, Items } from './types.ts';
import { AttributesSymbol, CdataSymbol, ChildrenSymbol, CommentSymbol, ElementSymbol, NameSymbol, ParametersSymbol, TypeSymbol } from './tool.ts';

const PatchAttributes = function (source: Element, target: Item) {
    const parameters = target[ParametersSymbol];
    const attributes = target[AttributesSymbol];

    if (attributes['type']) {
        const value = attributes['type'];
        Attribute(source, 'type', value, parameters['type']);
    }

    for (const name in attributes) {
        if (name === 'type') continue;
        const value = attributes[name];
        Attribute(source, name, value, parameters[name]);
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

const PatchCreateElement = function (owner: Document, item: Item): Element {
    const element = owner.createElement(item[NameSymbol]);
    const parameters = item[ParametersSymbol];
    const attributes = item[AttributesSymbol];
    const children = item[ChildrenSymbol];

    if (attributes['html']) {
        PatchAttributes(element, item);
        return element;
    }

    for (const child of children) {
        PatchAppend(element, child);
    }

    for (const name in attributes) {
        const value = attributes[name];
        Attribute(element, name, value, parameters[name]);
    }

    return element;
};

const PatchAppend = function (parent: Element, child: any) {
    const owner = parent.ownerDocument as Document;
    if (child?.[TypeSymbol] === ElementSymbol) {
        parent.appendChild(PatchCreateElement(owner, child));
    } else if (child?.[TypeSymbol] === CommentSymbol) {
        parent.appendChild(owner.createComment(child.value));
    } else if (child?.[TypeSymbol] === CdataSymbol) {
        parent.appendChild(owner.createCDATASection(child.value));
    } else {
        parent.appendChild(owner.createTextNode(Display(child)));
    }
};

const PatchRemove = function (parent: Element) {
    const child = parent.lastChild;
    if (child) parent.removeChild(child);
};

const PatchCommon = function (source: Node, target: any) {
    const owner = source.ownerDocument as Document;
    const virtualType = target?.[TypeSymbol];
    const virtualName = target?.[NameSymbol];
    const virtualAttributes = target?.[AttributesSymbol];

    if (virtualType === CommentSymbol) {
        const value = Display(target);

        if (source.nodeName !== '#comment') {
            source.parentNode?.replaceChild(owner?.createComment(value) as Comment, source);
        } else if (source.nodeValue !== value) {
            source.nodeValue = value;
        }

        return;
    }

    if (virtualType === CdataSymbol) {
        const value = Display(target);

        if (source.nodeName !== '#cdata-section') {
            source.parentNode?.replaceChild(owner?.createCDATASection(value) as CDATASection, source);
        } else if (source.nodeValue !== value) {
            source.nodeValue = value;
        }

        return;
    }

    if (virtualType !== ElementSymbol) {
        const value = Display(target);

        if (source.nodeName !== '#text') {
            source.parentNode?.replaceChild(owner?.createTextNode(value) as Text, source);
        } else if (source.nodeValue !== value) {
            source.nodeValue = value;
        }

        return;
    }

    if (source.nodeName !== virtualName) {
        source.parentNode?.replaceChild(PatchCreateElement(owner, target), source);
        return;
    }

    if (!(source instanceof Element)) {
        throw new Error('Patch - node type not handled');
    }

    if (virtualAttributes['html']) {
        PatchAttributes(source, target);
        return;
    }

    const targetChildren = target[ChildrenSymbol];
    const targetLength = targetChildren.length;

    const sourceChildren = [...source.childNodes];
    const sourceLength = sourceChildren.length;

    const commonLength = Math.min(sourceLength, targetLength);

    let index;

    for (index = 0; index < commonLength; index++) {
        PatchCommon(sourceChildren[index], targetChildren[index]);
    }

    if (sourceLength > targetLength) {
        for (index = targetLength; index < sourceLength; index++) {
            PatchRemove(source);
        }
    } else if (sourceLength < targetLength) {
        for (index = sourceLength; index < targetLength; index++) {
            PatchAppend(source, targetChildren[index]);
        }
    }

    PatchAttributes(source, target);
};

export default function Patch(source: Element, target: Items) {
    let index;

    const targetChildren = target;
    const targetLength = targetChildren.length;

    const sourceChildren = [...source.childNodes];
    const sourceLength = sourceChildren.length;

    const commonLength = Math.min(sourceLength, targetLength);

    for (index = 0; index < commonLength; index++) {
        PatchCommon(sourceChildren[index], targetChildren[index]);
    }

    if (sourceLength > targetLength) {
        for (index = targetLength; index < sourceLength; index++) {
            PatchRemove(source);
        }
    } else if (sourceLength < targetLength) {
        for (index = sourceLength; index < targetLength; index++) {
            PatchAppend(source, targetChildren[index]);
        }
    }
}

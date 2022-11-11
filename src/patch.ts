import Attribute from './attribute.ts';
import Display from './display.ts';

import { Item, Items } from './types.ts';
import { CdataSymbol, ChildrenSymbol, CommentSymbol, ElementSymbol, NameSymbol, TypeSymbol } from './tool.ts';

const PatchCreateElement = function (owner: Document, item: Item): Element {
    const element = owner.createElement(item[NameSymbol]);

    for (const child of item.children) {
        PatchAppend(element, child);
    }

    for (const name in item.attributes) {
        const value = item.attributes[name];
        Attribute(element, name, value);
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

const PatchCommon = function (node: Node, target: any) {
    const owner = node.ownerDocument as Document;
    const virtualType = target?.[TypeSymbol];
    const virtualName = target?.[NameSymbol];

    if (virtualType === CommentSymbol) {
        const value = Display(target);

        if (node.nodeName != '#comment') {
            node.parentNode?.replaceChild(owner?.createComment(value) as Comment, node);
        } else if (node.nodeValue != value) {
            node.nodeValue = value;
        }

        return;
    }

    if (virtualType === CdataSymbol) {
        const value = Display(target);

        if (node.nodeName != '#cdata-section') {
            node.parentNode?.replaceChild(owner?.createCDATASection(value) as CDATASection, node);
        } else if (node.nodeValue != value) {
            node.nodeValue = value;
        }

        return;
    }

    if (virtualType !== ElementSymbol) {
        const value = Display(target);

        if (node.nodeName != '#text') {
            node.parentNode?.replaceChild(owner?.createTextNode(value) as Text, node);
        } else if (node.nodeValue != value) {
            node.nodeValue = value;
        }

        return;
    }

    if (!(node instanceof Element)) throw new Error('Patch - node type not handled');

    if (node.localName !== virtualName) {
        node.parentNode?.replaceChild(PatchCreateElement(owner, target), node);
        return;
    }

    let index;

    const targetChildren = target.children;
    const targetLength = targetChildren.length;

    const nodeChildren = node.childNodes;
    const nodeLength = nodeChildren.length;

    const commonLength = Math.min(nodeLength, targetLength);

    for (index = 0; index < commonLength; index++) {
        PatchCommon(nodeChildren[index], targetChildren[index]);
    }

    if (nodeLength > targetLength) {
        for (index = targetLength; index < nodeLength; index++) {
            PatchRemove(node);
        }
    } else if (nodeLength < targetLength) {
        for (index = nodeLength; index < targetLength; index++) {
            PatchAppend(node, targetChildren[index]);
        }
    }

    for (const name in target.attributes) {
        const value = target.attributes[name];
        Attribute(node as Element, name, value);
    }

    if (node.hasAttributes()) {
        const names = node.getAttributeNames();
        for (const name of names) {
            if (!(name in target.attributes)) {
                node.removeAttribute(name);
            }
        }
    }
};

export default function Patch(root: Element, fragment: Items) {
    let index;

    const virtualChildren = fragment;
    const virtualLength = virtualChildren.length;

    const rootChildren = root.childNodes;
    const rootLength = rootChildren.length;

    // const owner = root.ownerDocument;
    const commonLength = Math.min(rootLength, virtualLength);

    for (index = 0; index < commonLength; index++) {
        PatchCommon(rootChildren[index], virtualChildren[index]);
    }

    if (rootLength > virtualLength) {
        for (index = virtualLength; index < rootLength; index++) {
            PatchRemove(root);
        }
    } else if (rootLength < virtualLength) {
        for (index = rootLength; index < virtualLength; index++) {
            PatchAppend(root, virtualChildren[index]);
        }
    }
}

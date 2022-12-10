//

const attributes = function (source: Element, target: Element) {
    const targetAttributeNames = target.hasAttributes() ? [...target.getAttributeNames()] : [];
    const sourceAttributeNames = source.hasAttributes() ? [...source.getAttributeNames()] : [];

    for (const name of targetAttributeNames) {
        source.setAttribute(name, target.getAttribute(name) ?? '');
    }

    for (const name of sourceAttributeNames) {
        if (!targetAttributeNames.includes(name)) {
            source.removeAttribute(name);
        }
    }
};

const append = function (parent: Node, child: Node) {
    parent.appendChild(child);
};

const remove = function (parent: Node) {
    const child = parent.lastChild;
    if (child) parent.removeChild(child);
};

const common = function (source: Node, target: Node) {
    if (!source.parentNode) throw new Error('source parent node not found');

    if (source.nodeName !== target.nodeName) {
        source.parentNode?.replaceChild(target, source);
    }

    if (target.nodeName === '#text') {
        if (source.nodeValue !== target.nodeValue) {
            source.nodeValue = target.nodeValue;
        }

        return;
    }

    if (target.nodeName === '#comment') {
        if (source.nodeValue !== target.nodeValue) {
            source.nodeValue = target.nodeValue;
        }

        return;
    }

    if (!(source instanceof Element)) throw new Error('source node not valid');
    if (!(target instanceof Element)) throw new Error('target node not valid');

    const targetChildren = [...target.childNodes];
    const targetLength = targetChildren.length;
    const sourceChildren = [...source.childNodes];
    const sourceLength = sourceChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);

    let index;

    for (index = 0; index < commonLength; index++) {
        common(sourceChildren[index], targetChildren[index]);
    }

    if (sourceLength > targetLength) {
        for (index = targetLength; index < sourceLength; index++) {
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for (index = sourceLength; index < targetLength; index++) {
            append(source, targetChildren[index]);
        }
    }

    attributes(source, target);
};

export default function patch(source: Element, target: DocumentFragment) {
    let index;

    const targetChildren = [...target.childNodes];
    const targetLength = targetChildren.length;

    const sourceChildren = [...source.childNodes];
    const sourceLength = sourceChildren.length;

    const commonLength = Math.min(sourceLength, targetLength);

    for (index = 0; index < commonLength; index++) {
        common(sourceChildren[index], targetChildren[index]);
    }

    if (sourceLength > targetLength) {
        for (index = targetLength; index < sourceLength; index++) {
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for (index = sourceLength; index < targetLength; index++) {
            append(source, targetChildren[index]);
        }
    }
}

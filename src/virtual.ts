//

class VText {
    name: string;
    node?: Text;
    value: string;
    constructor(name: string, value: string | null) {
        this.name = name ?? '';
        this.value = value ?? '';
    }

    mount(parent: ParentNode) {
        this.node = document.createTextNode(this.value);
        parent.appendChild(this.node);
    }

    unmount() {
        this.node?.parentNode?.removeChild(this.node);
    }
}

class VElement {
    name: string;
    node?: Element;
    value: Set<VText | VElement> = new Set();
    attributes: Map<string, string> = new Map();

    constructor(name: string) {
        this.name = name ?? '';
    }

    append(node: VText | VElement) {
        this.value.add(node);
    }

    setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
    }

    mount(parent: ParentNode) {
        this.node = document.createElement(this.name);
        this.attributes.forEach((name, value) => this.node?.setAttribute(name, value));
        this.value.forEach((child) => child.mount(this.node as Element));
        parent.appendChild(this.node);
    }

    unmount() {
        this.node?.parentNode?.removeChild(this.node);
    }
}

const Patch = function (source: VElement, target: VElement) {
    const node = (target.node = source.node);
    const parent = node?.parentNode;

    if (!parent) throw new Error('parent node missing');

    // Case where the nodes are of different tags
    if (source.name !== target.name) {
        source.unmount();
        target.mount(parent);
    } else {
        // Case where the nodes are of the same tag

        // New virtual node has string children
        if (typeof target.value === 'string') {
            node.textContent = target.value;
        } else {
            // New virtual node has array children

            // Old virtual node has string children
            if (typeof source.value === 'string') {
                node.textContent = '';
                target.value.forEach((child) => child.mount(node));
            } else {
                // Case where the new virtual node has string children

                const c1 = source.value;
                const c2 = target.value;

                const commonLength = Math.min(c1.length, c2.length);

                // Patch the children both nodes have in common
                for (let i = 0; i < commonLength; i++) {
                    Patch(c1[i], c2[i]);
                }

                // Old children was longer
                // Remove the children that are not "there" anymore
                if (c1.length > c2.length) {
                    c1.slice(c2.length).forEach((child: any) =>  unmount(child));
                } else if (c2.length > c1.length) {
                    // Old children was shorter
                    // Add the newly added children
                    c2.slice(c1.length).forEach((child: any) => mount(child, node));
                }
            }
        }
    }
};

export const Virtualize = function (root: Node) {
    let source, target;

    const rootType = root.nodeType;
    const rootName = root.nodeName.toLowerCase();

    if (rootType === Node.ELEMENT_NODE) {
        source = new VElement(rootName);
        target = new VElement(rootName);

        if ((root as Element).hasAttributes()) {
            for (const { name, value } of (root as Element).attributes) {
                source.attributes.set(name, value);
                target.attributes.set(name, value);
            }
        }

        if ((root as Element).hasChildNodes()) {
            let child = root.firstChild;

            while (child) {
                const virtual = Virtualize(child);
                source.append(virtual.source);
                target.append(virtual.target);
                child = child.nextSibling;
            }
        }
    } else {
        source = new VText(rootName, root.textContent);
        target = new VText(rootName, root.textContent);
    }

    return { source, target };
};

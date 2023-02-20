
export const replaceChildren = function (element: Element | Document | DocumentFragment, ...nodes: (Node | string)[]): void {

    while (element.lastChild) {
        element.removeChild(element.lastChild);

    }

    if (nodes?.length) {
        for (const node of nodes) {
            element.appendChild(
                typeof node === 'string' ?
                (element.ownerDocument as Document).createTextNode(node) :
                node
            );
        }
    }

};
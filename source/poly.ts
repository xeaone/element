
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

const policy =
    'trustedTypes' in window ?
        (window as any).trustedTypes.createPolicy('x-element', { createHTML: (data: any) => data }) :
        undefined;

export const createHTML = function (data: string) {
    if (policy) {
        return policy.createHTML(data);
    } else {
        return data;
    }
};

export const hasOwn = function (object: any, key: any) {
    return Object.prototype.hasOwnProperty.call(object, key);
};
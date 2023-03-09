
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

export const includes = function (item: string | Array<any>, search: any) {
    return item.indexOf(search) !== -1;
};


const policy = 'trustedTypes' in window ? (window as any).trustedTypes.createPolicy('default', { createHTML: (data:string) => data }) : null;
export const createHTML = function (data: string) {
    if (policy) {
        return policy.createHTML(data);
    } else {
        return data;
    }
}

export const getOwnPropertyDescriptors = function (object:any) {
    if (Object.hasOwnProperty('getOwnPropertyDescriptors')) {
        return Reflect.get(Object, 'getOwnPropertyDescriptors')(object);
    } else {
        return Reflect.ownKeys(object).reduce((descriptors, key) => {
            return Object.defineProperty(descriptors, key, {
                configurable: true,
                enumerable: true,
                writable: true,
                value: Object.getOwnPropertyDescriptor(object, key)
            });
        });
    }
}
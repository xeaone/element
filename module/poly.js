export const replaceChildren = function (element, ...nodes) {
    while (element.lastChild) {
        element.removeChild(element.lastChild);
    }
    if (nodes?.length) {
        for (const node of nodes) {
            element.appendChild(typeof node === 'string' ?
                element.ownerDocument.createTextNode(node) :
                node);
        }
    }
};
export const includes = function (item, search) {
    return item.indexOf(search) !== -1;
};
const policy = 'trustedTypes' in window ?
    window.trustedTypes.createPolicy('x-element', { createHTML: (data) => data }) :
    undefined;
export const createHTML = function (data) {
    if (policy) {
        return policy.createHTML(data);
    }
    else {
        return data;
    }
};
export const hasOwn = function (object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
};
//# sourceMappingURL=poly.js.map
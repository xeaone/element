export var replaceChildren = function (element) {
    var nodes = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        nodes[_i - 1] = arguments[_i];
    }
    while (element.lastChild) {
        element.removeChild(element.lastChild);
    }
    if (nodes === null || nodes === void 0 ? void 0 : nodes.length) {
        for (var _a = 0, nodes_1 = nodes; _a < nodes_1.length; _a++) {
            var node = nodes_1[_a];
            element.appendChild(typeof node === 'string' ?
                element.ownerDocument.createTextNode(node) :
                node);
        }
    }
};
var policy = 'trustedTypes' in window ?
    window.trustedTypes.createPolicy('x-element', { createHTML: function (data) { return data; } }) :
    undefined;
export var createHTML = function (data) {
    if (policy) {
        return policy.createHTML(data);
    }
    else {
        return data;
    }
};
export var hasOwn = function (object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
};

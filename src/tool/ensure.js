
export default function Ensure (data = {}) {
    data.scope = data.scope || document.body;
    data.position = data.position || 'beforeend';

    const { name, query, scope, position, attributes } = data;

    let element;

    if (query) {
        element = scope.querySelector(query);
    }

    if (!element) {
        element = document.createElement(name);
        scope.insertAdjacentElement(position, element);
    }

    for (let i = 0; i < attributes.length; i++) {
        const { name, value } = attributes[i];
        element.setAttribute(name, value);
    }

    return element;
}

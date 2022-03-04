
const htmlRender = function (binder) {
    let data = binder.compute();

    if (typeof data !== 'string') {
        data = '';
        console.warn('html binder requires a string');
    }

    let removeChild;
    while (removeChild = binder.owner.lastChild) {
        binder.owner.removeChild(removeChild);
        binder.binder.remove(removeChild);
    }

    const template = document.createElement('template');
    template.innerHTML = data;

    let addChild = template.content.firstChild;
    while (addChild) {
        binder.container.binds(addChild, binder.container);
        addChild = addChild.nextSibling;
    }

    binder.owner.appendChild(template.content);
};

const htmlUnrender = function (binder) {
    let node;
    while (node = binder.owner.lastChild) {
        binder.container.unbinds(node);
        binder.owner.removeChild(node);
    }
};

export default { render: htmlRender, unrender: htmlUnrender };
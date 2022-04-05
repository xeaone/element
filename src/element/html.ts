
const htmlRender = function (binder: any) {
    let data = binder.compute();

    if (typeof data !== 'string') {
        data = '';
        console.warn('html binder requires a string');
    }

    let removeChild;
    while (removeChild = binder.owner.lastChild) {
        binder.owner.removeChild(removeChild);
        binder.removes(removeChild);
    }

    const template = document.createElement('template');
    template.innerHTML = data;

    let addChild = template.content.firstChild;
    while (addChild) {
        binder.adds(addChild);
        addChild = addChild.nextSibling;
    }

    binder.owner.appendChild(template.content);
};

const htmlUnrender = function (binder: any) {
    let node;
    while (node = binder.owner.lastChild) {
        binder.removes(node);
        binder.owner.removeChild(node);
    }
};

export default { render: htmlRender, unrender: htmlUnrender };
const tick = Promise.resolve();

const htmlRender = async function (binder) {
    let data = await binder.compute();

    if (typeof data !== 'string') {
        data = '';
        console.warn('html binder requires a string');
    }

    while (binder.owner.firstChild) {
        const node = binder.owner.removeChild(binder.owner.firstChild);
        binder.binder.remove(node);
    }

    const template = document.createElement('template');
    template.innerHTML = data;

    let node = template.content.firstChild;
    while (node) {
        tick.then(binder.binder.add.bind(binder.binder, node, binder.container));
        node = node.nextSibling;
    }

    binder.owner.appendChild(template.content);
};

const htmlUnrender = async function (binder) {
    let node = binder.owner.firstChild;
    while (node) binder.owner.removeChild(node);
};

export default { render: htmlRender, unrender: htmlUnrender };
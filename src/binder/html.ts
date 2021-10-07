const tick = Promise.resolve();

const html = async function (binder) {
    if (binder.cancel) return binder.cancel();

    let data = await binder.compute();

    if (binder.cancel) return binder.cancel();

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

export default html;
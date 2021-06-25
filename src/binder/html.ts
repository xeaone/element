
const write = async function (binder) {
    let data = await binder.compute();

    if (typeof data !== 'string') {
        data = '';
        console.warn('html binder requires a string');
    }

    while (binder.owner.firstChild) {
        const node = binder.owner.removeChild(binder.owner.firstChild);
        binder.remove(node);
    }

    const template = document.createElement('template');
    template.innerHTML = data;

    await Promise.all(Array.prototype.map.call(template.content.childNodes, async node =>
        binder.add(node, binder.container, true))).then(() =>
            binder.owner.appendChild(template.content));

};

export default { write };
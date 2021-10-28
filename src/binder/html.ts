const tick = Promise.resolve();

const htmlRender = async function (binder) {
    const tasks = [];
    let data = await binder.compute();

    if (typeof data !== 'string') {
        data = '';
        console.warn('html binder requires a string');
    }

    let removeChild;
    while (removeChild = binder.owner.lastChild) {
        binder.owner.removeChild(removeChild);
        tasks.push(binder.binder.remove(removeChild));
    }

    const template = document.createElement('template');
    template.innerHTML = data;

    let addChild = template.content.firstChild;
    while (addChild) {
        tasks.push(binder.binder.add.bind(binder.binder, addChild, binder.container));
        addChild = addChild.nextSibling;
    }

    await Promise.all(tasks);
    binder.owner.appendChild(template.content);
};

const htmlUnrender = async function (binder) {
    const tasks = [];
    let node;
    while (node = binder.owner.lastChild) {
        tasks.push(binder.binder.remove(node));
        binder.owner.removeChild(node);
    }
    await Promise.all(tasks);
};

export default { render: htmlRender, unrender: htmlUnrender };
const htmlRender = async function (binder) {
    const data = await binder.compute() ?? '';
    binder.node.innerHTML = data;

    // const tasks = [];
    // let data = await binder.compute();

    // if (typeof data !== 'string') {
    //     data = '';
    //     console.warn('html binder requires a string');
    // }

    // let removeChild;
    // while (removeChild = binder.node.lastChild) {
    //     binder.node.removeChild(removeChild);
    //     tasks.push(binder.binder.remove(removeChild));
    // }

    // const template = document.createElement('template');
    // template.innerHTML = data;

    // let addChild = template.content.firstChild;
    // while (addChild) {
    //     tasks.push(binder.binder.add.bind(binder.binder, addChild, binder.container));
    //     addChild = addChild.nextSibling;
    // }

    // await Promise.all(tasks);
    // binder.node.appendChild(template.content);
};

const htmlDerender = async function (binder) {
    // const tasks = [];
    // let node;
    // while (node = binder.node.lastChild) {
    //     tasks.push(binder.binder.remove(node));
    //     binder.node.removeChild(node);
    // }
    // await Promise.all(tasks);

    binder.node.innerHTML = '';
};

export default { render: htmlRender, derender: htmlDerender };
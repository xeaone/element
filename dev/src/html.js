const htmlRender = function (binder) {
    const data = binder.compute() ?? '';

    let node;
    while (node = binder.node.lastChild) {
        binder.node.removeChild(node);
        binder.container.remove(node);
    }

    const template = document.createElement('template');
    template.innerHTML = data;

    // node = template.content.firstChild;
    // while (node) {
    //     binder.container.add(node);
    //     node = node.nextSibling;
    // }

    binder.container.add(template.content);
    binder.node.appendChild(template.content);
};

const htmlDerender = function (binder) {
    let node;
    while (node = binder.node.lastChild) {
        binder.node.removeChild(node);
        binder.container.remove(node);
    }
};

export default { render: htmlRender, derender: htmlDerender };
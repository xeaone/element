const htmlRender = function (binder) {
    const data = binder.compute() ?? '';
    let node;

    while (node = binder.node.lastChild) {
        binder.node.removeChild(node);
        binder.unbind(node);
    }

    const template = document.createElement('template');
    template.innerHTML = data;

    node = template.content.firstChild;
    while (node) {
        binder.bind(node);
        node = node.nextSibling;
    }

    binder.node.appendChild(template.content);
};

const htmlDerender = function (binder) {
    let node;
    while (node = binder.node.lastChild) {
        binder.node.removeChild(node);
        binder.unbind(node);
    }
};

export default { render: htmlRender, derender: htmlDerender };
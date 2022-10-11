import { BinderType } from './types.ts';
import { BinderHandle } from './binder.ts';

const htmlRender = async function (binder: BinderType) {
    const data = await binder.compute();

    let fragment, node, tasks = [];

    if (typeof data == 'string') {
        const template = document.createElement('template');
        template.innerHTML = data;
        fragment = template.content;
    } else if (data instanceof HTMLTemplateElement) {
        fragment = data.content.cloneNode(true);
    } else {
        return console.error(`XElement - Html Binder ${binder.name} ${binder.value} requires a string or Template`);
    }

    node = binder.owner.lastChild;
    while (node) {
        binder.owner.removeChild(node);
        // binder.container.release(node);
        node = binder.owner.lastChild;
    }

    node = fragment.firstChild;
    while (node) {
        // tasks.push(binder.container.register(node, binder.context));
        tasks.push(BinderHandle(binder.context, binder.binders, node));
        node = node.nextSibling;
    }

    await Promise.all(tasks);
    binder.owner.appendChild(fragment);
};

const htmlReset = function (binder: BinderType) {
    let node = binder.owner.lastChild;
    while (node) {
        binder.owner.removeChild(node);
        binder.container.release(node);
        node = binder.owner.lastChild;
    }
};

const htmlDefault = { render: htmlRender, reset: htmlReset };

export default htmlDefault;

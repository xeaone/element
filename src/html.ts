import { BinderType } from './types.ts';
import { BinderHandle } from './binder.ts';

const htmlRender = async function (binder: BinderType) {
    // console.log('html render', binder.owner);

    const data = await binder.compute();
    const tasks = [];

    let fragment: DocumentFragment;
    if (typeof data == 'string') {
        const template = document.createElement('template');
        template.innerHTML = data;
        fragment = template.content;
    } else if (data instanceof HTMLTemplateElement) {
        // const clone = data.cloneNode(true) as HTMLTemplateElement;
        // fragment = clone.content;
        fragment = data.content.cloneNode(true) as DocumentFragment;
    } else {
        return console.error(`XElement - Html Binder ${binder.name} ${binder.value} requires a string or Template`);
    }

    let node = binder.owner.lastChild;
    while (node) {
        binder.owner.removeChild(node);
        // binder.container.release(node);
        node = binder.owner.lastChild;
    }

    let element = fragment.firstChild;
    while (element) {
        tasks.push(BinderHandle(binder.context, binder.binders, binder.rewrites, element));
        element = element.nextSibling;
    }

    await Promise.all(tasks);
    binder.owner.appendChild(fragment);
};

const htmlReset = function (binder: BinderType) {
    // console.log('html reset');

    let node = binder.owner.lastChild;
    while (node) {
        binder.owner.removeChild(node);
        // binder.container.release(node);
        node = binder.owner.lastChild;
    }
};

const htmlDefault = { render: htmlRender, reset: htmlReset };

export default htmlDefault;

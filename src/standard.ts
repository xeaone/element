import tool from './tool.ts';
import booleans from './boolean.ts';
import { BinderType } from './types.ts';

const standardSetup = function (binder: BinderType) {
    binder.meta.boolean = booleans.includes(binder.name);
};

const standardRender = async function (binder: BinderType) {
    if (binder.name == 'text') {
        let data = await binder.compute();
        data = tool.display(data);
        binder.node.textContent = data;
    } else if (binder.meta.boolean) {
        const data = await binder.compute() ? true : false;
        if (data) binder.owner.setAttributeNode(binder.node);
        else binder.owner.removeAttribute(binder.name);
    } else {
        let data = await binder.compute();
        data = tool.display(data);
        binder.owner[binder.name] = data;
        binder.owner.setAttribute(binder.name, data);
    }
};

const standardReset = function (binder: BinderType) {
    if (binder.name == 'text') {
        binder.node.textContent = '';
    } else if (binder.meta.boolean) {
        binder.owner.removeAttribute(binder.name);
    } else {
        binder.owner[binder.name] = undefined;
        binder.owner?.setAttribute(binder.name, '');
    }
};

const standardDefault = { setup: standardSetup, render: standardRender, reset: standardReset };

export default standardDefault;

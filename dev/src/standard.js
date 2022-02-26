import booleans from './booleans.js';
import format from './format.js';

const standardRender = async function (binder) {
    let data = await binder.compute();

    const boolean = booleans.includes(binder.name);

    // binder.node.value = '';

    if (boolean) {
        data = data ? true : false;
        if (data) binder.node.setAttributeNode(binder.node);
        else binder.node.removeAttribute(binder.name);
    } else {
        data = format(data);
        binder.node[ binder.name ] = data;
        binder.node.setAttribute(binder.name, data);
    }

};

const standardDerender = async function (binder) {
    const boolean = booleanTypes.includes(binder.name);

    if (boolean) {
        binder.node.removeAttribute(binder.name);
    } else {
        binder.node.setAttribute(binder.name, '');
    }

};

export default { render: standardRender, derender: standardDerender };
import booleans from './boolean.ts';
import format from './format.ts';

const standardRender = function (binder: any) {
    let data = binder.compute();

    const boolean = booleans.includes(binder.name);

    binder.node.value = '';

    if (boolean) {
        data = data ? true : false;
        if (data) binder.owner.setAttributeNode(binder.node);
        else binder.owner.removeAttribute(binder.name);
    } else {
        data = format(data);
        binder.owner[ binder.name ] = data;
        binder.owner.setAttribute(binder.name, data);
    }

};

const standardUnrender = function (binder: any) {
    const boolean = booleans.includes(binder.name);

    if (boolean) {
        binder.owner.removeAttribute(binder.name);
    } else {
        binder.owner.setAttribute(binder.name, '');
    }

};

export default { render: standardRender, unrender: standardUnrender };


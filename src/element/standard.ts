import booleans from './boolean';
import format from './format';

const standardRender = function (binder) {
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

const standardUnrender = function (binder) {
    const boolean = booleans.includes(binder.name);

    if (boolean) {
        binder.owner.removeAttribute(binder.name);
    } else {
        binder.owner.setAttribute(binder.name, '');
    }

};

export default { render: standardRender, unrender: standardUnrender };


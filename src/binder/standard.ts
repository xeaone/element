import booleanTypes from '../types/boolean';
import format from '../format';

const standardRender = async function (binder) {
    let data = await binder.compute();

    const boolean = booleanTypes.includes(binder.name);

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

const standardUnrender = async function (binder) {
    const boolean = booleanTypes.includes(binder.name);

    if (boolean) {
        binder.owner.removeAttribute(binder.name);
    } else {
        binder.owner.setAttribute(binder.name, '');
    }

};



export default { render: standardRender, unrender: standardUnrender };


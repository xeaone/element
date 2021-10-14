import booleanTypes from '../types/boolean';
import format from '../format';

const standardRender = async function (binder) {
    const { name, owner, node } = binder;

    let data = await binder.compute();

    const boolean = booleanTypes.includes(name);

    if (boolean) {
        data = data ? true : false;
        if (data) owner.setAttributeNode(node);
        else owner.removeAttribute(name);
    } else {
        data = format(data);
        owner[ name ] = data;
        owner.setAttribute(name, data);
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


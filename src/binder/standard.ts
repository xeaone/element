import booleanTypes from '../types/boolean';
import format from '../format';

const standard = async function (binder) {
    if (binder.cancel) return binder.cancel();

    const { name, owner, node } = binder;

    let data = await binder.compute();
    if (binder.cancel) return binder.cancel();

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

export default standard;


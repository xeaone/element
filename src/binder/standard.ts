import format from '../format';

const booleans = [
    'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'compact', 'controls', 'declare', 'default',
    'defaultchecked', 'defaultmuted', 'defaultselected', 'defer', 'disabled', 'draggable', 'enabled', 'formnovalidate',
    'indeterminate', 'inert', 'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nohref', 'noresize', 'noshade', 'hidden',
    'novalidate', 'nowrap', 'open', 'pauseonexit', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected',
    'sortable', 'spellcheck', 'translate', 'truespeed', 'typemustmatch', 'visible'
];

const write = async function (binder) {
    const { name, owner, node } = binder;

    let data = await binder.compute();
    const boolean = booleans.includes(name);

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

export default { write };


import { isNone, toString } from '../tool';

const booleans = [
    'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'compact', 'controls', 'declare', 'default',
    'defaultchecked', 'defaultmuted', 'defaultselected', 'defer', 'disabled', 'draggable', 'enabled', 'formnovalidate',
    'indeterminate', 'inert', 'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nohref', 'noresize', 'noshade', 'hidden',
    'novalidate', 'nowrap', 'open', 'pauseonexit', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected',
    'sortable', 'spellcheck', 'translate', 'truespeed', 'typemustmatch', 'visible'
];

export default {
    async write (binder) {
        let data = await binder.compute();
        const boolean = booleans.includes(binder.name);

        if (boolean) {
            data = data ? true : false;
            if (data) binder.target.setAttribute(binder.name, '');
            else binder.target.removeAttribute(binder.name);
        } else {
            data = isNone(data) ? '' : toString(data);
            // binder.target[ binder.name ] = data;
            binder.target.setAttribute(binder.name, data);
        }

    }
};


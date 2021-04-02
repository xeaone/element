// import { toString } from '../tool';

const bools = [
    'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'compact', 'controls', 'declare', 'default',
    'defaultchecked', 'defaultmuted', 'defaultselected', 'defer', 'disabled', 'draggable', 'enabled', 'formnovalidate',
    'indeterminate', 'inert', 'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nohref', 'noresize', 'noshade', 'hidden',
    'novalidate', 'nowrap', 'open', 'pauseonexit', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected',
    'sortable', 'spellcheck', 'translate', 'truespeed', 'typemustmatch', 'visible'
];

export default function (binder) {
    let data, bool;
    return {
        async read () {
            data = await binder.data;
            bool = bools.includes(binder.type);

            if (bool) {
                data = data ? true : false;
            } else {
                data = data === null || data === undefined ? '' : data;
                // data = toString(data);
                data = binder.display(data);
            }

        },
        async write () {
            binder.target[binder.type] = data;

            if (bool) {
                if (data) binder.target.setAttribute(binder.type, '');
                else binder.target.removeAttribute(binder.type);
            } else {
                binder.target.setAttribute(binder.type, data);
            }

        }
    };
}

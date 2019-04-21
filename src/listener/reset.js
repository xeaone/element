import Binder from '../binder.js';

export default async function (event) {

    const elements = event.target.querySelectorAll('[o-value], [value], select[name], input[name], textarea[name]');

    for (let i = 0, l = elements.length; i < l; i++) {
        const element = elements[i];

        if (
            element.type === 'submit' ||
            element.type === 'button' ||
            element.nodeName === 'BUTTON' ||
            element.nodeName === 'OPTION' ||
            element.nodeName.indexOf('-BUTTON') !== -1 ||
            element.nodeName.indexOf('-OPTION') !== -1
        ) {
            continue;
        }

        const type = element.type;
        const name = element.nodeName;
        const binder = Binder.get('attribute', element, 'o-value');

        if (!binder) {
            element.value = '';
            continue;
        }

        if (name === 'SELECT' || name.indexOf('-SELECT') !== -1) {
            if (binder.target.multiple) {
                binder.data = [];
            } else {
                binder.data = '';
            }
        } else if (type === 'radio' || name.indexOf('-RADIO') !== -1) {
            //
        } else if (type === 'checkbox' || name.indexOf('-CHECKBOX') !== -1) {
            binder.data = false;
        } else {
            binder.data = '';
        }

    }

}

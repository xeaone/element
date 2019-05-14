import Binder from '../binder.js';

export default async function (event) {

    if (event.target.hasAttribute('o-reset') === false) {
        return;
    }

    event.preventDefault();

    const elements = event.target.querySelectorAll('*');

    for (let i = 0, l = elements.length; i < l; i++) {
        const element = elements[i];
        const name = element.nodeName;
        const type = element.type;

        if (
			(!type && name !== 'TEXTAREA') ||
            type === 'submit' ||
            type === 'button' ||
			!type
            // element.nodeName === 'BUTTON' ||
            // element.nodeName === 'OPTION' ||
            // element.nodeName.indexOf('-BUTTON') !== -1 ||
            // element.nodeName.indexOf('-OPTION') !== -1
        ) {
            continue;
        }

        const binder = Binder.get('attribute', element, 'o-value');

        if (!binder) {
			if (type === 'select-one' || type === 'select-multiple') {
            	element.selectedIndex = null;
        	} else if (type === 'radio' || type === 'checkbox') {
            	element.checked = false;
	        } else {
            	element.value = null;
	        }
        } else if (type === 'select-one') {
            binder.data = null;
        } else if (type === 'select-multiple') {
			// might want better defaults
            binder.data = [];
        } else if (type === 'radio' || type === 'checkbox') {
            binder.data = false;
        } else {
            binder.data = '';
        }

    }

}

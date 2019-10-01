
const reset = async function (binder, event) {

    event.preventDefault();

    const elements = event.target.querySelectorAll('*');

    for (let i = 0, l = elements.length; i < l; i++) {
        const element = elements[i];
        const name = element.nodeName;
        const type = element.type;

        if (
            !type && name !== 'TEXTAREA' ||
            type === 'submit' ||
            type === 'button' ||
            !type
        ) {
            continue;
        }

        const binder = this.get(element, 'o-value');

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
            binder.data = [];
        } else if (type === 'radio' || type === 'checkbox') {
            binder.data = false;
        } else {
            binder.data = '';
        }

    }

    let method = binder.data;
    if (typeof method === 'function') {
        await method.call(binder.container, event);
    }

};

export default function (binder) {
    if (binder.meta.method) {
        binder.target.removeEventListener('reset', binder.meta.method, false);
    } else {
        binder.meta.method = reset.bind(this, binder);
        binder.target.addEventListener('reset', binder.meta.method, false);
    }
}

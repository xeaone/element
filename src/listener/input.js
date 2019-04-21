import Binder from '../binder.js';

export default function (event) {
    if (
        event.target.type !== 'radio' &&
		event.target.type !== 'option' &&
        event.target.type !== 'checkbox' &&
		event.target.nodeName !== 'SELECT' &&
        'attributes' in event.target &&
        'o-value' in event.target.attributes
    ) {
        const binder = Binder.get('attribute', event.target, 'o-value');
        Binder.render(binder, 'view');
    }
}

import Global from './global.js';

export default function (e) {
	let element = e.target;
	let submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

	let binder = Global.binder.get({
		name: 'o-submit',
		element: element
	});

	let scope = binder.scope;

	if (submit) {
		let elements = element.querySelectorAll('[o-value]');
		let i = elements.length;

		while (i--) {
			let path = elements[i].getAttribute('o-value');
			let keys = [scope].concat(path.split('.'));

			Global.model.set(keys, '');

			Global.binder.unrender({
				name: 'o-value',
				element: elements[i]
			}, 'view');

		}

	}

}

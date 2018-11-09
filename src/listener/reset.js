import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (e) {
	let element = e.target;
	let reset = element.hasAttribute('o-reset') || element.hasAttribute('data-o-reset');

	if (!reset) return;
	else e.preventDefault();

	let binder = Binder.elements.get(element).get('submit');
	let elements = element.querySelectorAll('[o-value]');
	let model = Model.get(binder.scope);

	Utility.formReset(element, model);
}

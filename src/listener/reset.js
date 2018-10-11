import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (e) {
	const element = e.target;
	const reset = element.hasAttribute('o-reset') || element.hasAttribute('data-o-reset');

	if (!reset) return;
	else e.preventDefault();

	const binder = Binder.elements.get(element).get('submit');
	const elements = element.querySelectorAll('[o-value]');
	const model = Model.get(binder.scope);

	Utility.formReset(element, model);
}

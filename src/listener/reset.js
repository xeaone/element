import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (e) {
	var element = e.target;
	var reset = element.hasAttribute('o-reset') || element.hasAttribute('data-o-reset');

	if (!reset) return;
	else e.preventDefault();

	var binder = Binder.elements.get(element).get('submit');
	var elements = element.querySelectorAll('[o-value]');
	var model = Model.get(binder.scope);

	Utility.formReset(element, model);
}

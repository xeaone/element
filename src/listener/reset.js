import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default async function (event) {
	var element = event.target;
	var binder = Binder.elements.get(element).get('submit');
	var model = Model.get(binder.scope);
	Utility.formReset(element, model);
};

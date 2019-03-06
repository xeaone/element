import Utility from '../utility.js';
import Model from '../model.js';
import View from '../view.js';

export default async function (event) {
	var element = event.target;
	var binder = View.get(element, 'submit');
	var model = Model.get(binder.scope);
	Utility.formReset(element, model);
};

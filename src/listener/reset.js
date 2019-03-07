import Utility from '../utility.js';
import Model from '../model.js';
import View from '../view.js';

export default async function (event) {
	let node = event.target;
	let binder = View.get(node, 'submit');
	let model = Model.get(binder.scope);
	Utility.formReset(node, model);
};

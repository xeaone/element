import Utility from '../utility.js';
import View from '../view.js';
import Model from '../model.js';

export default async function (event) {
	const node = event.target;
	const binder = View.get(node, 'o-submit');
	const model = Model.get(binder.scope);
	Utility.formReset(node, model);
};

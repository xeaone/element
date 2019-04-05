import Utility from '../utility.js';
import Model from '../model.js';
// import View from '../view.js';
import Binder from '../binder.js';

export default async function (event) {
	const node = event.target;
	const binder = Binder.get(node, 'o-submit');
	// const binder = View.get(node, 'o-submit');
	const model = Model.get(binder.scope);
	Utility.formReset(node, model);
};

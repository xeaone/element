import Binder from '../binder.js';
import Utility from '../utility.js';

export default async function (event) {
	const node = event.target;
	const binder = Binder.get('attribute', node, 'o-submit');
	Utility.formReset(node, binder.model);
};

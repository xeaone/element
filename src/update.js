import Batcher from './batcher.js';
import Utility from './utility.js';
import Model from './model.js';
import View from './view.js';

export default async function (node, attribute) {
	console.log('update');

	if (!node) throw new Error('Oxe.update - requires node argument');
	if (!attribute) throw new Error('Oxe.update - requires attribute argument');

	const binder = View.get('attribute', node, attribute);

	const read = function () {
		const type = binder.target.type;
	 	const name = binder.target.nodeName;
		// let data = Utility.value(binder.target, binder.container.model);

		if (name === 'SELECT' || name.indexOf('-SELECT') !== -1) {
			const value = Utility.value(binder.target, binder.container.model);
			binder.data = value;
			// const nodes = binder.target.options;
			// const multiple = Utility.multiple(binder.target);
			//
		 	// let result = multiple ? [] : undefined;
			//
			// for (let i = 0, l = nodes.length; i < l; i++) {
			// 	const node = nodes[i];
			//
			// 	if (!Utility.selected(node)) continue;
			//
			// 	const value = Utility.value(node, binder.container.model);
			//
			// 	if (multiple) {
			// 		result.push(value);
			// 	} else {
			// 		result = value;
			// 		break;
			// 	}
			//
			// }
			//
			// binder.data = result;
		} else if (type === 'radio') {
			const query = 'input[type="radio"][o-value="' + binder.value + '"]';
			const nodes = binder.container.querySelectorAll(query);

			for (let i = 0, l = nodes.length; i < l; i++) {
				const node = nodes[i];

				if (binder.target === node) {
					console.log(i);
					// data = i;
				}

			}

		} else if (type === 'checkbox' || name.indexOf('-CHECKBOX') !== -1) {
			binder.data = binder.target.checked || false;
		} else {
			binder.data = binder.target.value || '';
		}
	};

	Batcher.batch({ read });
};

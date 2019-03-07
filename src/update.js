import Model from './model.js';
import View from './view.js';
import Batcher from './batcher.js';
import Utility from './utility.js';

export default async function (node, attribute) {

	if (!node) throw new Error('Oxe.update - requires node argument');
	if (!attribute) throw new Error('Oxe.update - requires attribute argument');

	const binder = View.get(node, attribute);

	const read = function () {
		const type = binder.target.type;
	 	const name = binder.target.nodeName;

		let data = Utility.value(binder.target);
		// console.log(data);

		// if (name === 'SELECT' || name.indexOf('-SELECT') !== -1) {
		// 	const nodes = binder.target.options;
		// 	const multiple = Utility.multiple(binder.target);
		//
		// 	data = multiple ? [] : undefined;
		//
		// 	for (let i = 0, l = nodes.length; i < l; i++) {
		// 		const node = nodes[i];
		//
		// 		if (Utility.selected(node)) {
		//
		// 			if (multiple) {
		// 				data.push(Utility.value(node));
		// 			} else {
		// 				data = Utility.value(node);
		// 				break;
		// 			}
		//
		// 		}
		//
		// 	}
		//
		// } else if (type === 'radio') {
		// 	const query = 'input[type="radio"][o-value="' + binder.value + '"]';
		// 	const nodes = binder.container.querySelectorAll(query);
		//
		// 	for (let i = 0, l = nodes.length; i < l; i++) {
		// 		const node = nodes[i];
		//
		// 		if (binder.target === node) {
		// 			data = i;
		// 		}
		//
		// 	}
		//
		// } else if (type === 'checkbox') {
		// 	data = binder.target.checked;
		// } else {
		// 	data = binder.target.value;
		// }

		if (data !== undefined) {
			const original = Model.get(binder.keys);

			if (
				data &&
				typeof data === 'object' &&
				data.constructor === original.constructor
			) {
				// for (const key in data) {
					// if (data[key] !== original[key]) {
						Model.set(binder.keys, data);
						// break;
					// }
				// }
			} else if (original !== data) {
				Model.set(binder.keys, data);
			}

		}

	};

	Batcher.batch({ read });
};

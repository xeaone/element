import Utility from '../utility.js';
import Piper from '../piper.js';
import Model from '../model.js';
import View from '../view.js';

export default function (binder, data) {
	let self = this;
	let type = binder.target.type;
	let name = binder.target.nodeName;

	// let data;

	if (name === 'SELECT' || name.indexOf('-SELECT') !== -1) {
		let nodes, multiple;

		return {
			read () {

				nodes = binder.target.options;
				multiple = Utility.multiple(binder.target);

				if (multiple && data.constructor !== Array) {
					throw new Error(`Oxe - invalid multiple select value type ${binder.keys.join('.')} array required`);
				}

			},
			write () {
				let selected = false;

				// NOTE might need to handle disable
				for (let i = 0, l = nodes.length; i < l; i++) {
					const node = nodes[i];
					const value = Utility.value(node);

					if (multiple) {
						if (data.indexOf(value) !== -1) {
							selected = true;
							node.selected = true;
							node.setAttribute('selected', '');
						} else if (Utility.selected(node)) {
							Model.get(binder.keys).push(value);
						} else {
							node.selected = false;
							node.removeAttribute('selected');
						}
					} else {
						if (data === value) {
							selected = true;
							node.selected = true;
							node.setAttribute('selected', '');
						} else if (!selected && Utility.selected(node)) {
							selected = true;
							Model.set(binder.keys, value);
						} else {
							node.selected = false;
							node.removeAttribute('selected');
						}
					}

				}

			}
		};
	} else if (type === 'radio') {
		let nodes;

		return {
			read () {

				if (data === undefined) {
					Model.set(binder.keys, 0);
					return false;
				}

				nodes = binder.container.querySelectorAll(
					'input[type="radio"][o-value="' + binder.value + '"]'
				);
			},
			write () {
				let checked = false;

				for (let i = 0, l = nodes.length; i < l; i++) {
					let node = nodes[i];

					if (i === data) {
						checked = true;
						node.checked = true;
					} else {
						node.checked = false;
					}

				}

				if (!checked) {
					nodes[0].checked = true;
					Model.set(binder.keys, 0);
				}

			}
		};

	} else if (type === 'checkbox') {
		return {
			read () {

				if (typeof data !== 'boolean') {
					Model.set(binder.keys, false);
					return false;
				}

				if (data === binder.target.checked) {
					return false;
				}
			},
			write () {
				binder.target.checked = data;
			}
		};
	} else {
		return {
			read () {

				// if (name === 'OPTION' && binder.target.selected) {
				if (name.indexOf('OPTION') !== -1 && binder.target.selected) {
					const parent = binder.target.parentElement.nodeName.indexOf('SELECT') !== -1 ? binder.target.parentElement :  binder.target.parentElement.parentElement;
					const select = View.get(parent, 'value');
					if (select) {
						self.default(select);
					}
				}

				data = Model.get(binder.keys);

				if (data === undefined || data === null) {
					return false;
				}

				if (data === binder.target.value) {
					return false;
				}

			},
			write () {
				binder.target.value = data;
			}
		};
	}
};

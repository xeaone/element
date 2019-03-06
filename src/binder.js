import Utility from './utility.js';
import Methods from './methods.js';
// import Render from './render.js';
import Piper from './piper.js';
import Model from './model.js';

import Batcher from './batcher.js';

import Class from './render-attribute/class.js';
import Css from './render-attribute/css.js';
// import Default from './render-attribute/default.js';
import Disable from './render-attribute/disable.js';
import Each from './render-attribute/each.js';
import Enable from './render-attribute/enable.js';
import Hide from './render-attribute/hide.js';
import Html from './render-attribute/html.js';
import On from './render-attribute/on.js';
import Read from './render-attribute/read.js';
import Required from './render-attribute/required.js';
import Show from './render-attribute/show.js';
import Style from './render-attribute/style.js';
import Text from './render-attribute/text.js';
import Value from './render-attribute/value.js';
import Write from './render-attribute/write.js';

export default {

	data: {},
	binders: {
		class: Class,
		css: Css,
		// default: Default,
		disable: Disable,
		disabled: Disable,
		each: Each,
		enable: Enable,
		enabled: Enable,
		hide: Hide,
		html: Html,
		on: On,
		read: Read,
		required: Required,
		show: Show,
		style: Style,
		text: Text,
		value: Value,
		write: Write
	},

	async setup (options) {
		options = options || {};
	},

	create (data) {
		let binder = {};

		if (data.name === undefined) throw new Error('Oxe.binder.create - missing name');
		if (data.value === undefined) throw new Error('Oxe.binder.create - missing value');
		if (data.scope === undefined) throw new Error('Oxe.binder.create - missing scope');
		if (data.element === undefined) throw new Error('Oxe.binder.create - missing element');
		if (data.container === undefined) throw new Error('Oxe.binder.create - missing container');

		binder.name = data.name;
		binder.value = data.value;
		binder.scope = data.scope;
		binder.element = data.element;
		binder.container = data.container;

		binder.names = data.names || Utility.binderNames(data.name);
		binder.pipes = data.pipes || Utility.binderPipes(data.value);
		binder.values = data.values || Utility.binderValues(data.value);

		binder.cache = {};
		binder.context = {};
		binder.path = binder.values.join('.');
		binder.type = binder.type || binder.names[0];
		binder.keys = [binder.scope].concat(binder.values);

		return binder;
	},

	get (data) {
		let binder;

		if (typeof data === 'string') {
			binder = {};
			binder.scope = data.split('.').slice(0, 1).join('.');
			binder.path = data.split('.').slice(1).join('.');
		} else {
			binder = data;
		}

		if (!(binder.scope in this.data)) {
			return null;
		}

		if (!(binder.path in this.data[binder.scope])) {
			return null;
		}

		let items = this.data[binder.scope][binder.path];

		for (let i = 0, l = items.length; i < l; i++) {
			let item = items[i];

			if (item.element === binder.element && item.name === binder.name) {
				return item;
			}

		}

		return null;
	},

	add (binder) {
		//
		// if (!this.elements.has(binder.element)) {
		// 	this.elements.set(binder.element, new Map());
		// }
		//
		// if (!this.elements.get(binder.element).has(binder.names[0])) {
		// 	this.elements.get(binder.element).set(binder.names[0], binder);
		// // } else {
		// 	// console.warn(`Oxe - duplicate attribute ${binder.scope} ${binder.names[0]} ${binder.value}`);
		// 	// throw new Error(`Oxe - duplicate attribute ${binder.scope} ${binder.names[0]} ${binder.value}`);
		// 	// return false;
		// }

		if (!(binder.scope in this.data)) {
			this.data[binder.scope] = {};
		}

		if (!(binder.path in this.data[binder.scope])) {
			this.data[binder.scope][binder.path] = [];
		}

		this.data[binder.scope][binder.path].push(binder);
	},

	remove (binder) {

		// if (this.elements.has(binder.element)) {
		//
		// 	if (this.elements.get(binder.element).has(binder.names[0])) {
		// 		this.elements.get(binder.element).delete(binder.names[0]);
		// 	}
		//
		// 	if (!this.elements.get(binder.element).size) {
		// 		this.elements.delete(binder.element);
		// 	}
		//
		// }

		if (!(binder.scope in this.data)) {
			return;
		}

		if (!(binder.path in this.data[binder.scope])) {
			return;
		}

		let items = this.data[binder.scope][binder.path];

		for (let i = 0, l = items.length; i < l; i++) {

			if (items[i].element === binder.element) {
				return items.splice(i, 1);
			}

		}

	},

	render (binder, data) {
		let render;

		if (binder.type in this.binders) {
			render = this.binders[binder.type](binder, data);
		} else {
			render = {
				read () {

					if (data === undefined || data === null) {
						return false;
					} else if (typeof data === 'object') {
						data = JSON.stringify(data);
					} else if (typeof data !== 'string') {
						data = data.toString();
					}

					if (data === binder.element[binder.type]) {
						return false;
					}

				},
				write () {
					binder.element[binder.type] = data;
				}
			};
		}

		if (render) {
			Batcher.batch(render);
		}
	},

	unbind (node, attribute, container) {

		const binder = this.create({
			element: node,
			container: container,
			name: attribute.name,
			value: attribute.value,
			scope: container.scope
		});

		this.remove(binder);
		this.render(binder, undefined);

		return binder;
	},

	// bind (binder, data) {
	bind (node, attribute, container, type) {


		const binder = this.create({
			element: node,
			container: container,
			name: attribute.name,
			value: attribute.value,
			scope: container.scope
		});

		let data;

		if (binder.type === 'on') {
			data = Methods.get(binder.keys);
		} else {
			data = Model.get(binder.keys);
			data = Piper(binder, data);
		}

		this.add(binder);
		this.render(binder, data);

		return binder;

		// if (result !== false) {
			// let data;
			//
			// if (binder.type === 'on') {
			// 	data = Methods.get(binder.keys);
			// } else {
			// 	data = Model.get(binder.keys);
			// 	data = Piper(binder, data);
			// }
			//
			// this.render(binder, data);
		// }

	}

};

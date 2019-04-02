import Piper from './piper.js';
import Binder from './binder.js';
import Utility from './utility.js';
import Batcher from './batcher.js';

const DATA = new Map();

export default {

	get data () { return DATA; },

	target: document.body,
	emptyPattern: /^\s+$/,

	async setup (options) {
		options = options || {};

		this.data.set('target', new Map());
		this.data.set('location', new Map());
		this.data.set('attribute', new Map());

		this.target = options.target || document.body;

		// const observer = new MutationObserver(this.listener.bind(this));
		//
		// observer.observe(this.target, {
		// 	subtree: true,
		// 	childList: true
		// });

	},

	get (type) {
		let result = this.data.get(type);

		for (let i = 1, l = arguments.length; i < l; i++) {
			const argument = arguments[i];
			result = result.get(argument);
		}

		return result;
	},

	removeData (node) {
		const binders = this.data.get('target').get(node);

		if (!binders) return;

		for (let i = 0, l = binders.length; i < l; i++) {
			const binder = binders[i];
			const locations = this.data.get('location').get(binder.location);

			if (!locations) continue;

			const index = locations.indexOf(binder);

			if (index !== -1) {
				locations.splice(index, 1);
			}

			if (locations.length === 0) {
				this.data.get('location').delete(binder.location);
			}

		}

		this.data.get('target').delete(node);
		this.data.get('attribute').delete(node);
	},

	addData (binder) {

		if (this.data.get('location').has(binder.location)) {
			this.data.get('location').get(binder.location).push(binder);
		} else {
			this.data.get('location').set(binder.location, [binder]);
		}

		if (this.data.get('target').has(binder.target)) {
			this.data.get('target').get(binder.target).push(binder);
		} else {
			this.data.get('target').set(binder.target, [binder]);
		}

		if (!this.data.get('attribute').has(binder.target)) {
			this.data.get('attribute').set(binder.target, new Map());
		}

		this.data.get('attribute').get(binder.target).set(binder.name, binder);
	},

	render (node, attribute, container) {

		const binder = Binder.create({
			target: node,
			container: container,
			name: attribute.name,
			value: attribute.value,
			scope: container.scope
		});

		this.addData(binder);

		let data;

		if (binder.type === 'on') {
			data = Utility.getByPath(container.methods, binder.values);
		} else {
			data = Utility.getByPath(container.model, binder.values);
			data = Piper(binder, data);
		}

		Binder.render(binder, data);
	},

	remove (node) {

		this.removeData(node);

		for (let i = 0; i < node.childNodes.length; i++) {
			this.remove(node.childNodes[i]);
		}

	},

	add (node, context) {
		if (node.nodeType === Node.TEXT_NODE) {

		 	if (node.textContent.indexOf('{{') === -1) return;

			const start = node.textContent.indexOf('{{');
			if (start !== -1 && start !== 0) {
				node = node.splitText(start);
			}

			const end = node.textContent.indexOf('}}');
			const length = node.textContent.length;
			if (end !== -1 && end !== length-2) {
				const split = node.splitText(end+2);
				this.add(split, context);
			}

			let text = node.textContent;

			if (
				text === `{{$${context.variable}.$key}}` ||
				text === `{{$${context.variable}.$index}}`
			) {
				Batcher.batch({
					context: {
						node: node,
						key: context.key,
						variable: context.variable
					},
					read () { this.text = this.node.textContent; },
					write () { this.node.textContent = this.key; }
				});
			} else {

				if (context.variable && context.path && context.key) {
					const pattern = new RegExp(`{{\\$${context.variable}(,|\\s+|\\.|\\|)?(.*)?}}`, 'ig');
					text = text.replace(pattern, `${context.path}.${context.key}$1$2`);
				} else {
					text = text.slice(2, -2);
				}

				this.render(node, { name: 'o-text', value: text }, context.container);
			}

		} else if (node.nodeType === Node.ELEMENT_NODE) {
			let skipChildren = false;

			const attributes = node.attributes;
			for (let i = 0, l = attributes.length; i < l; i++) {
				const attribute = attributes[i];

				if (
					attribute.name === 'o-html' ||
					attribute.name === 'o-scope' ||
					attribute.name.indexOf('o-each') === 0
				) {
					skipChildren = true;
				}

				if (
					attribute.name === 'o-scope' ||
					attribute.name === 'o-reset' ||
					attribute.name === 'o-action' ||
					attribute.name === 'o-method' ||
					attribute.name === 'o-enctype' ||
					attribute.name.indexOf('o-') !== 0
				) {
					continue
				}

				if (attribute.value.indexOf('$') !== -1) {
					// attribute.value = attribute.value.replace(, `${context.key}`);
					const pattern = new RegExp(`\\$${context.variable}(,|\\s+|\\.|\\|)?(.*)?$`, 'ig');
					attribute.value = attribute.value.replace(pattern, `${context.path}.${context.key}$1$2`);
				}

				this.render(node, attribute, context.container);
			}

			if (skipChildren) return;

			for (let i = 0; i < node.childNodes.length; i++) {
				this.add(node.childNodes[i], context);
			}

		}
	},

	// addNodes (nodes) {
	// 	for (let i = 0; i < nodes.length; i++) {
	// 		const node = nodes[i];
	// 	}
	// },

	// removeNodes (nodes) {
	// 	for (let i = 0; i < nodes.length; i++) {
	// 		const node = nodes[i];
	// 		this.remove(node);
	// 		this.data.get('context').delete(node);
	// 		this.removeNodes(node.childNodes);
	// 	}
	// },

	// hasAttribute (node, name) {
	// 	const attributes = node.attributes;
	// 	for (let i = 0, l = attributes.length; i < l; i++) {
	// 		const attribute = attributes[i];
	// 		if (attribute.name.indexOf(name) === 0) {
	// 			return true;
	// 		}
	// 	}
	// 	return false;
	// },

	// listener (records) {
	// 	for (let i = 0, l = records.length; i < l; i++) {
	// 		const record = records[i];
	//
	// 		this.addNodes(record.addedNodes);
	//
	// 		if (record.target.nodeName !== 'O-ROUTER') {
	// 			this.removeNodes(record.removedNodes);
	// 		}
	//
	// 	}
	// }

};

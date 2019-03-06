import Utility from './utility.js';
import Methods from './methods.js';
// import Render from './render.js';
import Binder from './binder.js';
import Piper from './piper.js';
import Model from './model.js';

export default {

	data: {},
	observer: null,
	elements: new Map(),
	target: document.body,

	async setup (options) {
		options = options || {};

		this.target = options.target || document.body;
		this.observer = new MutationObserver(this.listener.bind(this));

		this.observer.observe(this.target, {
			subtree: true,
			childList: true,
			// attributeFilter: [],
			// attributes: true,
			// attributeOldValue: true,
			// characterData: true,
			// characterDataOldValue: true
		});

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

		if (!this.elements.has(binder.element)) {
			this.elements.set(binder.element, new Map());
		}

		if (!this.elements.get(binder.element).has(binder.names[0])) {
			this.elements.get(binder.element).set(binder.names[0], binder);
		// } else {
			// console.warn(`Oxe - duplicate attribute ${binder.scope} ${binder.names[0]} ${binder.value}`);
			// throw new Error(`Oxe - duplicate attribute ${binder.scope} ${binder.names[0]} ${binder.value}`);
			// return false;
		}

		// if (!(binder.scope in this.data)) {
		// 	this.data[binder.scope] = {};
		// }
		//
		// if (!(binder.path in this.data[binder.scope])) {
		// 	this.data[binder.scope][binder.path] = [];
		// }
		//
		// this.data[binder.scope][binder.path].push(binder);
	},

	remove (binder) {

		if (this.elements.has(binder.element)) {

			if (this.elements.get(binder.element).has(binder.names[0])) {
				this.elements.get(binder.element).delete(binder.names[0]);
			}

			if (!this.elements.get(binder.element).size) {
				this.elements.delete(binder.element);
			}

		}

		// if (!(binder.scope in this.data)) {
		// 	return;
		// }
		//
		// if (!(binder.path in this.data[binder.scope])) {
		// 	return;
		// }
		//
		// let items = this.data[binder.scope][binder.path];
		//
		// for (let i = 0, l = items.length; i < l; i++) {
		//
		// 	if (items[i].element === binder.element) {
		// 		return items.splice(i, 1);
		// 	}
		//
		// }

	},

	node (node, target, type, container) {

		if (!type) throw new Error('Oxe.binder.bind - type argument required');
		if (!node) throw new Error('Oxe.binder.bind - node argument required');

		if (
			node.nodeName === 'SLOT' ||
			node.nodeName === 'TEMPLATE' ||
			node.nodeName === 'O-ROUTER' ||
			node.nodeType === Node.TEXT_NODE ||
			node.nodeType === Node.DOCUMENT_NODE ||
			node.nodeType === Node.DOCUMENT_FRAGMENT_NODE
		) {
			return;
		}

		// if (node.nodeType === Node.TEXT_NODE) {
		// 	return this.rewrite(node);
		// }

		const attributes = node.attributes;

		for (let i = 0, l = attributes.length; i < l; i++) {
			const attribute = attributes[i];

			if (
				attribute.name.indexOf('o-') === 0
				&& attribute.name !== 'o-scope'
				&& attribute.name !== 'o-reset'
				&& attribute.name !== 'o-action'
				&& attribute.name !== 'o-method'
				&& attribute.name !== 'o-enctype'
			) {
				// cloudflare charge

				// if (attribute.name.indexOf('o-each') === 0) {
				// 	contexts[attribute.name.toLowerCase()] = node;
				// }
				//
				// if (attribute.value.indexOf('$') !== -1) {
				// 	const variable = attribute.value.split('.')[0].replace('$', '').toLowerCase();
				// 	const contextNode = contexts['o-each-' + variable];
				// 	if (contextNode) {
				// 		const binder = this.elements.get(contextNode).get('each');
				// 		if (binder.cache.keys) {
				// 			const key = binder.cache.keys[contextNode.children.length-1];
				// 			console.log(key);
				// 			const contextAttribute = contextNode.attributes['o-each-' + variable];
				// 			const pattern = new RegExp('(^|(\\|+|\\,+|\\s))' + variable + '(?:)', 'ig');
				// 			attribute.value = attribute.value.replace(pattern, `$1${contextAttribute.value}.${key}`);
				// 		}
				// 	}
				// }

				switch (type) {
					case 'remove':
						this.remove(Binder.unbind(node, attribute, container));
						break;
					case 'add':
						this.add(Binder.bind(node, attribute, container));
						break;
				}

				// const binder = Binder.create({
				// 	element: node,
				// 	container: container,
				// 	name: attribute.name,
				// 	value: attribute.value,
				// 	scope: container.scope
				// });
				//
				// const result = Binder[type](binder);
				//
				// if (result !== false) {
				// 	let data;
				//
				// 	if (binder.type === 'on') {
				// 		data = Methods.get(binder.keys);
				// 	} else {
				// 		data = Model.get(binder.keys);
				// 		data = Piper(binder, data);
				// 	}
				//
				// 	Binder.render(binder, data);
				// }

			}

		}

	},

	nodes (nodes, target, type, container) {
		for (let i = 0, l = nodes.length; i <l; i++) {
			const node = nodes[i];

			if (node.nodeType !== 1) continue;

			const childContainer = node.scope || 'o-scope' in node.attributes ? node : container;

			this.node(node, target, type, container);
			this.nodes(node.childNodes, target, type, childContainer);
		}
	},

	listener (records) {
		for (let i = 0, l = records.length; i < l; i++) {
			const record = records[i];
			switch (record.type) {
				case 'childList':
					let container;
					let parent = record.target;

					while (parent) {
						if (parent.scope || 'o-scope' in parent.attributes) {
							container = parent;
							break;
						} else {
							parent = parent.parentElement;
						}
					}

					this.nodes(record.addedNodes, record.target, 'add', container);
					this.nodes(record.removedNodes, record.target, 'remove', container);
				break;
				// case 'attributes':
					// console.log(record);
				// break;
				// case 'characterData':
				// break;
			}
		}
	}

};

import Utility from './utility.js';
import Methods from './methods.js';
import Render from './render.js';
import Piper from './piper.js';
import Model from './model.js';

export default {

	data: {},
	observer: null,
	elements: new Map(),
	target: document.body,

	async setup (options) {
		const self = this;

		options = options || {};

		self.target = options.target || document.body;

		self.observer = new MutationObserver(function (records) {
			for (let i = 0, l = records.length; i < l; i++) {
				const record = records[i];
				console.log(record);
				switch (record.type) {
					case 'childList':
						self.eachElement(record.addedNodes, record.target, 'add');
						self.eachElement(record.removedNodes, record.target, 'remove');
					break;
					case 'attributes':
						const target = record.target;
						const attribute = target.attributes[record.attributeName];
						// if (attribute) self.emit('attribute:add', attribute, record);
						// else self.emit('attribute:remove', attribute, record);
					break;
					// case 'characterData':
					// break;
				}
			}
		});

		self.observer.observe(self.target, {
			subtree: true,
			childList: true,
			// attributeFilter: [],
			attributes: true,
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
		} else {
			console.warn(`Oxe - duplicate attribute ${binder.scope} ${binder.names[0]} ${binder.value}`);
			// throw new Error(`Oxe - duplicate attribute ${binder.scope} ${binder.names[0]} ${binder.value}`);
			return false;
		}

		if (!(binder.scope in this.data)) {
			this.data[binder.scope] = {};
		}

		if (!(binder.path in this.data[binder.scope])) {
			this.data[binder.scope][binder.path] = [];
		}

		this.data[binder.scope][binder.path].push(binder);
	},

	remove (binder) {

		if (this.elements.has(binder.element)) {

			if (this.elements.get(binder.element).has(binder.names[0])) {
				this.elements.get(binder.element).remove(binder.names[0]);
			}

			if (this.elements.get(binder.elements).length === 0) {
				this.elements.remove(binder.elements);
			}

		}

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

	oneElement (element, container, scope, type) {

		if (!type) throw new Error('Oxe.binder.bind - type argument required');
		if (!element) throw new Error('Oxe.binder.bind - element argument required');

		if (
			!element ||
			element.nodeName === 'SLOT' ||
			element.nodeName === 'O-ROUTER' ||
			element.nodeName === 'TEMPLATE' ||
			element.nodeName === '#document-fragment'
		) {
			return;
		}

		const attributes = element.attributes;

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

				const binder = this.create({
					scope: scope,
					element: element,
					container: container,
					name: attribute.name,
					value: attribute.value
				});

				const result = this[type](binder);

				if (result !== false) {
					let data;

					if (binder.type === 'on') {
						data = Methods.get(binder.keys);
					} else {
						data = Model.get(binder.keys);
						data = Piper(binder, data);
					}

					Render.default(binder, data);
				}

			}

		}

	},

	eachElement (nodes, target, type) {
		for (let i = 0, l = nodes.length; i <l; i++) {
			const node = nodes[i];
			const nodeType = node.nodeType;

			if (nodeType !== 1) continue;

			let count = 0;
			let container, scope;
			let parent = node.parentElement

			while (parent) {
				if (parent.scope || 'o-scope' in parent.attributes) {
					container = parent;
					scope = container.scope;
					break;
				} else if (!parent.parentElement && type === 'remove') {
					parent = target;
				} else {
					parent = parent.parentElement;
				}
			}

			this.oneElement(node, container, scope, type);
			this.eachElement(node.children, target, type);

		}
	}

};

import Utility from './utility.js';
import Methods from './methods.js';
import Binder from './binder.js';
import Piper from './piper.js';
import Model from './model.js';

const PathPattern = '(\\$)(\\w+)($|,|\\s+|\\.|\\|)';
const KeyPattern = '({{\\$)(\\w+)((-(key|index))?}})';

export default {

	data: new Map(),
	target: document.body,
	whitespacePattern: /^\s+$/g,

	keyPattern: new RegExp(KeyPattern, 'i'),
	keyPatternGlobal: new RegExp(KeyPattern, 'ig'),

	pathPattern: new RegExp(PathPattern, 'i'),
	pathPatternGlobal: new RegExp(PathPattern, 'ig'),

	async setup (options) {
		options = options || {};

		this.target = options.target || document.body;

		const observer = new MutationObserver(this.listener.bind(this));

		observer.observe(this.target, {
			subtree: true,
			childList: true,
			// attributeFilter: [],
			// attributes: true,
			// attributeOldValue: true,
			// characterData: true,
			// characterDataOldValue: true
		});

	},

	get () {
		let data = this.data;

		for (let i = 0, l = arguments.length; i < l; i++) {
			data = data.get(arguments[i]);
			// console.warn(`Oxe.view.get - argument ${arguments[i]} not found`);
			if (!data) return null;
		}

		return data;
	},

	add (binder) {

		if (!this.data.has(binder.target)) {
			this.data.set(binder.target, new Map());
		}

		if (!this.data.get(binder.target).has(binder.names[0])) {
			this.data.get(binder.target).set(binder.names[0], binder);
		// } else {
			// console.warn(`Oxe.view.add - binder o-scope="${binder.scope}" ${binder.name}="${binder.value}" exists`);
		}

	},

	remove (binder) {

		if (!this.data.has(binder.target)) {
			// console.warn(`Oxe.view.remove - binder o-scope="${binder.scope}" ${binder.name}="${binder.value}" not exist`);
			return;
		}

		if (this.data.get(binder.target).has(binder.names[0])) {
			this.data.get(binder.target).delete(binder.names[0]);

			if (!this.data.get(binder.target).size) {
				this.data.delete(binder.target);
			}

		}

	},

	each (node, variable) {
		let child = node;
		let parent = node.parentElement;
		while (parent) {
			if (`o-each-${variable}` in parent.attributes) {
				const binder = this.data.get(parent).get('each');
				let index = 0;
				let previous = child;
				while (previous = previous.previousElementSibling) index++;
				const key = Object.keys(binder.data)[index];
				return {
					key: key,
					child: child,
					parent: parent,
					path: binder.path,
				};
			} else {
				child = parent;
				parent = parent.parentElement;
			}
		}
	},

	node (node, target, type, container) {

		if (!type) throw new Error('Oxe.binder.bind - type argument required');
		if (!node) throw new Error('Oxe.binder.bind - node argument required');

		if (
			node.nodeName === 'SLOT' ||
			node.nodeName === 'TEMPLATE' ||
			node.nodeName === 'O-ROUTER' ||
			// node.nodeType === Node.TEXT_NODE ||
			node.nodeType === Node.DOCUMENT_NODE ||
			node.nodeType === Node.DOCUMENT_FRAGMENT_NODE
		) {
			return;
		}

		// rewrite dynamic text keys or indexs
		if (node.nodeType === Node.TEXT_NODE) {
			const match = node.nodeValue.match(this.keyPattern);
			if (match) {
				const variable = match[2].toLowerCase();
				const each = this.each(node, variable);
				if (each) {
					node.nodeValue = node.nodeValue.replace(this.keyPatternGlobal, `${each.key}`);
				}
			}
			return;
		}

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

				// rewrite dynamic binder paths
				const match = attribute.value.match(this.pathPattern);
				if (match) {
					const variable = match[2].toLowerCase();
					const each = this.each(node, variable);
					if (each) {
						attribute.value = attribute.value.replace(this.keyPatternGlobal, `${each.key}`);
						attribute.value = attribute.value.replace(this.pathPatternGlobal, `${each.path}.${each.key}$3`);
					}
				}

				let data;

				const binder = Binder.create({
					target: node,
					container: container,
					name: attribute.name,
					value: attribute.value,
					scope: container.scope
				});

				// this.data.get(node).set(binder.names[0], binder);

				if (type === 'remove') {
					this.remove(binder);
					data = undefined;
					Binder.remove(binder);
				} else if (type === 'add') {
					this.add(binder);

					if (binder.type === 'on') {
						data = Methods.get(binder.keys);
					} else {
						data = Model.get(binder.keys);
						data = Piper(binder, data);
					}

					Binder.add(binder);
				}

				Binder.render(binder, data);
			}
		}

	},

	nodes (nodes, target, type, container) {
		for (let i = 0, l = nodes.length; i <l; i++) {
			const node = nodes[i];

			// filter out white space nodes
			if (node.nodeType === 3 && this.whitespacePattern.test(node.nodeValue)) {
				continue;
			}

			const childContainer = node.nodeType === 1 && (node.scope || 'o-scope' in node.attributes) ? node : container;

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

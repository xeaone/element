import Piper from './piper.js';
import Binder from './binder.js';
import Utility from './utility.js';
import EachAdd from './each-add.js';

const DATA = new Map();
const EACH = new Map();
const CONTAINER = new Map();

const PathPattern = new RegExp('(\\$)(\\w+)($|,|\\s+|\\.|\\|)', 'ig');
const KeyPattern = new RegExp('({{\\$)(\\w+)((-(key|index))?}})', 'ig');

export default {

	get data () { return DATA; },
	get each () { return EACH; },
	get container () { return CONTAINER; },

	target: document.body,
	// whitespacePattern: /^\s+$/,

	async setup (options) {
		options = options || {};

		this.data.set('node', new Map());
		this.data.set('location', new Map());
		this.data.set('attribute', new Map());
		// this.data.set('pointer', new Map());

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

	get (type) {
		let result = this.data.get(type);

		for (let i = 1, l = arguments.length; i < l; i++) {
			const argument = arguments[i];
			result = result.get(argument);
		}

		return result;
	},

	remove (node) {
		const binders = this.data.get('node').get(node);

		for (let i = 0, l = binders.length; i < l; i++) {
			const binder = binders[i];
			const index = this.data.get('location').get(binder.location).indexOf(binder);
			this.data.get('location').get(binder.location).splice(index, 1);
		}

		this.data.get('node').delete(node);
		this.data.get('attribute').delete(node);
	},

	add (binder) {
		// this.data.get('pointer').set(binder.pointer, binder);

		if (this.data.get('location').has(binder.location)) {
			this.data.get('location').get(binder.location).push(binder);
		} else {
			this.data.get('location').set(binder.location, [binder]);
		}

		if (this.data.get('node').has(binder.target)) {
			this.data.get('node').get(binder.target).push(binder);
		} else {
			this.data.get('node').set(binder.target, [binder]);
		}

		if (!this.data.get('attribute').has(binder.target)) {
			this.data.get('attribute').set(binder.target, new Map());
		}

		this.data.get('attribute').get(binder.target).set(binder.name, binder);

	},

	addContainerNode (type, node, container) {
		this.container.set(node, container);
	},

	addContainerNodes (type, nodes, container) {
		for (let i = 0, l = nodes.length; i <l; i++) {
			const node = nodes[i];
			this.addContainerNode(type, node, container);
			this.addContainerNodes(type, node.children, container);
		}
	},

	// node (type, node) {
	//
	// 	if (node.nodeType === 1) {
	// 		for (let i = 0, l = node.attributes.length; i < l; i++) {
	// 			const attribute = node.attributes[i];
	//
	// 			if (
	// 				attribute.name.indexOf('o-') !== 0 ||
	// 				attribute.name === 'o-scope' ||
	// 				attribute.name === 'o-reset' ||
	// 				attribute.name === 'o-action' ||
	// 				attribute.name === 'o-method' ||
	// 				attribute.name === 'o-enctype'
	// 			) {
	// 				continue
	// 			}
	//
	// 			if (type === 'remove') {
	// 				this.remove(node);
	// 				break;
	// 			}
	//
	// 		}
	// 	}
	//
	// 	let child = node.firstChild;
	//
	// 	while (child) {
	// 	    this.node(child);
	// 	    child = child.nextSibling;
	// 	}
	// },

	nodes (type, nodes, target, container) {

		const eachAttribute = this.getAttribute(target, 'o-each');
		const eachBinder = eachAttribute ? this.get('attribute', target, eachAttribute.name) : null;

		// console.log(target);
		// console.log(container);
		// console.log(eachBinder);
		// console.log(eachAttribute);

		for (let i = 0, l = nodes.length; i < l; i++) {
			const node = nodes[i];

			// if (eachBinder) {
			// 	console.log(node);
			// 	console.log(eachBinder.meta.children.get(node));
			// }

			const eachMeta = eachBinder ? eachBinder.meta.children.get(node) : null;

			if (node.nodeType === Node.TEXT_NODE) {
				if (eachMeta) {
					node.nodeValue = node.nodeValue.replace(KeyPattern, `${eachMeta.key}`);
				}
				continue;
			}

			// if (!node.children) continue;
			// if (node.nodeType !== Node.ELEMENT_NODE) return;

			if (eachAttribute) {
				container = this.each.get(node);
			} else if (!container) {
				container = this.container.get(node);
			}

			// if (!container) {
			// 	console.log(node);
			// 	this.nodes(type, node.children, target, container)
			// 	continue;
			// }

			const attributes = node.attributes;

			for (let i = 0, l = attributes.length; i < l; i++) {
				const attribute = attributes[i];

				if (
					attribute.name.indexOf('o-') !== 0 ||
					attribute.name === 'o-scope' ||
					attribute.name === 'o-reset' ||
					attribute.name === 'o-action' ||
					attribute.name === 'o-method' ||
					attribute.name === 'o-enctype'
				) {
					continue
				}

				if (eachBinder) {
					console.log(eachBinder.path);
					// container = eachBinder.container;
					attribute.value = attribute.value.replace(KeyPattern, `${eachMeta.key}`);
					attribute.value = attribute.value.replace(PathPattern, `${eachBinder.path}.${eachMeta.key}$3`);
				}

				const binder = Binder.create({
					target: node,
					container: container,
					name: attribute.name,
					value: attribute.value,
					scope: container.scope
				});

				this.add(binder);

				let data;

				if (binder.type === 'on') {
					data = Utility.getByPath(container.methods, binder.values);
				} else {
					data = Utility.getByPath(container.model, binder.values);
					data = Piper(binder, data);
				}

				Binder.render(binder, data);
			}

			if (node.scope) container = undefined;

			this.nodes(type, node.children, target, container);
		}
	},

	getAttribute (node, name) {
		if ('attributes' in node === false) return null;
		const attributes = node.attributes;
		for (let i = 0, l = attributes.length; i < l; i++) {
			const attribute = attributes[i];
			if (attribute.name.indexOf(name) === 0) {
				return attribute;
			}
		}
		return null;
	},

	listener (records) {
		for (let i = 0, l = records.length; i < l; i++) {
			const record = records[i];
			switch (record.type) {
				case 'childList':

					this.nodes('add', record.addedNodes, record.target);

					// let container;
					// let parent = record.target;
					//
					// while (parent) {
					// 	if (parent.scope || 'o-scope' in parent.attributes) {
					// 		container = parent;
					// 		break;
					// 	} else {
					// 		parent = parent.parentElement;
					// 	}
					// }
					//
					// this.nodes(record.addedNodes, record.target, 'add', container);
					// this.nodes(record.removedNodes, record.target, 'remove', container);
				break;
				// case 'attributes':
				// break;
				// case 'characterData':
				// break;
			}
		}
	}

};

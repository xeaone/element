import Piper from './piper.js';
import Binder from './binder.js';
import Utility from './utility.js';
// import EachAdd from './each-add.js';

const DATA = new Map();
const CONTEXT = new Map();
const CONTAINER = new Map();

const PathPattern = new RegExp('(\\$)(\\w+)($|,|\\s+|\\.|\\|)', 'ig');
const KeyPattern = new RegExp('({{\\$)(\\w+)((-(key|index))?}})', 'ig');
// const KeyPattern = new RegExp('({{\\$)(\\w+)((-(key|index))}})', 'ig');

export default {

	get data () { return DATA; },
	get context () { return CONTEXT; },
	get container () { return CONTAINER; },

	target: document.body,
	// whitespacePattern: /^\s+$/,

	async setup (options) {
		options = options || {};

		this.data.set('target', new Map());
		this.data.set('location', new Map());
		this.data.set('attribute', new Map());

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

	addContextNode (node, context) {

		if (node.nodeType === Node.TEXT_NODE && !/\S/.test(node.nodeValue)) {
			return;
		}

		this.context.set(node, context);

		if (node.nodeType === Node.ELEMENT_NODE && this.hasAttribute(node, 'o-each')) {
			return;
		}

		this.addContextNodes(node.childNodes, context);
	},

	addContextNodes (nodes, context) {
		for (let i = 0, l = nodes.length; i <l; i++) {
			this.addContextNode(nodes[i], context);
		}
	},

	nodes (type, nodes, target, container) {
		for (let i = 0, l = nodes.length; i < l; i++) {
			const node = nodes[i];

			if (
				(node.nodeType !== Node.TEXT_NODE &&
				node.nodeType !== Node.ELEMENT_NODE) ||
				this.data.get('target').has(node)
			) {
				continue;
			}

			if (node.nodeType === Node.TEXT_NODE) {

				if (!/\S/.test(node.nodeValue)) {
					continue;
				}

				const context = this.context.get(node);

				if (context && context.key && context.path) {
					node.nodeValue = node.nodeValue.replace(KeyPattern, context.key);
					// node.nodeValue = node.nodeValue.replace(PathPattern, `${context.path}.${context.key}$3`);
				}

				continue;
			}

			// if (node.nodeType !== Node.ELEMENT_NODE) return;
			// if (!container) {}
			// container = container || this.container.get(node);
			const context = this.context.get(node);
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
					// attribute.name === 'o-context'
				) {
					continue
				}

				if (context && context.key && context.path) {
					container = context.binder.container;
					attribute.value = attribute.value.replace(KeyPattern, `${context.key}`);
					attribute.value = attribute.value.replace(PathPattern, `${context.path}.${context.key}$3`);
				} else {
					container = container || context;
				}

				const binder = Binder.create({
					target: node,
					container: container,
					name: attribute.name,
					value: attribute.value,
					scope: container.scope
				});

				if (this.data.get('attribute').has(binder.target)) {
					const b = this.data.get('attribute').get(binder.target).get(binder.name);
					if (b) {
						console.log(b);
					}
				}

				// if (attribute.name.indexOf('o-each') === 0) {
					// console.log(binder);
					// console.log(b === binder);
				// }

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

			this.nodes(type, node.childNodes, target, container);
		}
	},

	hasAttribute (node, name) {
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
		// console.log(records);
		// const targets = [];
		for (let i = 0, l = records.length; i < l; i++) {
			const record = records[i];
			// if (targets.indexOf(record.target) !== -1) {
			// 	continue;
			// } else {
			//
			// }
			switch (record.type) {
				case 'childList':

					this.nodes('add', record.addedNodes, record.target);
					// this.nodes('add', record.addedNodes, record.target, {});

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

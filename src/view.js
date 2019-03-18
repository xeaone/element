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

	addContainerNode (node, container) {
		this.container.set(node, container);
	},

	addContainerNodes (nodes, container) {
		for (let i = 0, l = nodes.length; i <l; i++) {
			const node = nodes[i];
			this.addContainerNode(node, container);
			this.addContainerNodes(node.children, container);
		}
	},

	nodes (type, nodes, target, container) {

		for (let i = 0, l = nodes.length; i < l; i++) {
			const node = nodes[i];

			if (
				node.nodeType !== Node.TEXT_NODE &&
				node.nodeType !== Node.ELEMENT_NODE
			) {
				continue;
			}

			if (node.nodeType === Node.TEXT_NODE) {

				if (!/\S/.test(node.nodeValue)) continue;

				const context = this.context.get(node);

				if (context) {
					node.nodeValue = node.nodeValue.replace(KeyPattern, context.key);
					// node.nodeValue = node.nodeValue.replace(PathPattern, `${context.path}.${context.key}$3`);
				}

				continue;
			}

			// if (node.nodeType !== Node.ELEMENT_NODE) return;

			// if (!container) {}
			container = container || this.container.get(node);

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

				const context = this.context.get(node);

				if (context) {
					container = context.binder.container;
					// console.log(context);
					// console.log(container);
					attribute.value = attribute.value.replace(KeyPattern, `${context.key}`);
					attribute.value = attribute.value.replace(PathPattern, `${context.path}.${context.key}$3`);
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

			this.nodes(type, node.childNodes, target, container);
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

					this.nodes('add', record.addedNodes, record.target, {});

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

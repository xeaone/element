import Piper from './piper.js';
import Binder from './binder.js';
import Utility from './utility.js';
// import EachAdd from './each-add.js';

const DATA = new Map();
const CONTEXT = new Map();
// const CONTAINER = new Map();

const PathPattern = new RegExp('(\\$)(\\w+)($|,|\\s+|\\.|\\|)', 'ig');
const KeyPattern = new RegExp('({{\\$)(\\w+)((-(key|index))?}})', 'ig');

export default {

	get data () { return DATA; },

	target: document.body,
	// whitespacePattern: /^\s+$/,

	async setup (options) {
		options = options || {};

		this.data.set('context', new Map());
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

	removeContextNode (node) {

		if (node.nodeType === Node.TEXT_NODE && !/\S/.test(node.nodeValue)) {
			return;
		}

		this.get('context').delete(node);

		this.removeContextNodes(node.childNodes);
	},

	removeContextNodes (nodes) {
		for (let i = 0, l = nodes.length; i <l; i++) {
			this.removeContextNode(nodes[i]);
		}
	},

	addContextNode (node, context) {
		// if (node.nodeType === Node.TEXT_NODE && /{{\$.*}}/.test(node.nodeValue)) {
		if (node.nodeType === Node.TEXT_NODE) {
			console.log(/{{\$.*}}/.test(node.nodeValue));
			console.log(node.nodeValue);

			// this.data.get('context').set(node, Object.assign({ target: node }, context));

		} else if (node.nodeType === Node.ELEMENT_NODE && this.hasAttribute(node, 'o-')) {

			this.data.get('context').set(node, Object.assign({ target: node }, context));

			if (this.hasAttribute(node, 'o-each') || this.hasAttribute(node, 'o-html')) {
				return;
			}

			this.addContextNodes(node.childNodes, context);
		}
	},

	addContextNodes (nodes, context) {
		for (let i = 0, l = nodes.length; i <l; i++) {
			this.addContextNode(nodes[i], context);
		}
	},

	// nodes (type, nodes, target, container) {
	nodes (nodes, target) {
		for (let i = 0, l = nodes.length; i < l; i++) {
			const node = nodes[i];

			if (
				node.nodeType !== Node.TEXT_NODE &&
				node.nodeType !== Node.ELEMENT_NODE
			) {
				continue;
			}

			if (node.nodeType === Node.TEXT_NODE) {

				console.log(/{{\$.*}}/.test(node.nodeValue));
				console.log(node.nodeValue);

				if (!/{{\$.*}}/.test(node.nodeValue)) continue;

				const context = this.data.get('context').get(node);

				if (context && context.type === 'dynamic') {
					Binder.render(context);
				}

				continue;
			}

			const context = this.data.get('context').get(node);
			if (!context) continue;

			if (context.type === 'dynamic') Binder.render(context);

			const container = context.container;

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

			// if (node.scope) container = undefined;
			// this.nodes(node.childNodes, target, container);
			this.nodes(node.childNodes, target);
		}
	},

	hasAttribute (node, name) {
		const attributes = node.attributes;
		for (let i = 0, l = attributes.length; i < l; i++) {
			const attribute = attributes[i];
			if (attribute.name.indexOf(name) === 0) {
				return true;
			}
		}
		return false;
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

					this.nodes(record.addedNodes, record.target);
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

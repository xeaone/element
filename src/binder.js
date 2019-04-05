import Utility from './utility.js';
import Batcher from './batcher.js';

import Piper from './piper.js';

import Class from './binders/class.js';
import Css from './binders/css.js';
import Default from './binders/default.js';
import Disable from './binders/disable.js';
import Each from './binders/each.js';
import Enable from './binders/enable.js';
import Hide from './binders/hide.js';
import Html from './binders/html.js';
import Label from './binders/label.js';
import On from './binders/on.js';
import Read from './binders/read.js';
import Require from './binders/require.js';
import Show from './binders/show.js';
import Style from './binders/style.js';
import Text from './binders/text.js';
import Value from './binders/value.js';
import Write from './binders/write.js';

const DATA = new Map();

const BINDERS = {
	get class () { return Class; },
	get css () { return Css; },
	get default () { return Default; },
	get disable () { return Disable; },
	get disabled () { return Disable; },
	get each () { return Each; },
	get enable () { return Enable; },
	get enabled () { return Enable; },
	get hide () { return Hide; },
	get hidden () { return Hide; },
	get html () { return Html; },
	get label () { return Label; },
	get on () { return On; },
	get read () { return Read; },
	get require () { return Require; },
	get required () { return Require; },
	get show () { return Show; },
	get showed () { return Show; },
	get style () { return Style; },
	get text () { return Text; },
	get value () { return Value; },
	get write () { return Write; }
};

export default {

	// _data: {},

	get data () { return DATA; },
	get binders () { return BINDERS; },

	async setup (options) {
		options = options || {};

		// this.data.set('target', new Map());
		// this.data.set('location', new Map());
		this.data.set('location', new Map());
		this.data.set('attribute', new Map());

		if (options.binders) {
			for (let i = 0, l = options.binders.length; i < l; i++) {
				const binder = options.binders[i];
				this.binders[binder.name] = binder;
			}
		}

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

		this.data.get('location').forEach(function (scopes) {
			scopes.forEach(function (binders) {
				binders.forEach(function (binder, index) {
					if (binder.target === node) {
						binders.splice(index, 1);
					}
				});
			});
		});

		// for (let i = 0, l = binders.length; i < l; i++) {
		// 	const binder = binders[i];
		// 	const locations = this.data.get('location').get(binder.location);
		//
		// 	if (!locations) continue;
		//
		// 	const index = locations.indexOf(binder);
		//
		// 	if (index !== -1) {
		// 		locations.splice(index, 1);
		// 	}
		//
		// 	if (locations.length === 0) {
		// 		this.data.get('location').delete(binder.location);
		// 	}
		//
		// }

		this.data.get('attribute').delete(node);
	},

	addData (binder) {

		// if (binder.scope in this._data === false) {
		// 	this._data[binder.scope] = {};
		// }
		//
		// if (binder.path in this._data[binder.scope] === false) {
		// 	this._data[binder.scope][binder.path] = [binder];
		// } else {
		// 	this._data[binder.scope][binder.path].push(binder);
		// }

		if (!this.data.get('attribute').has(binder.target)) {
			this.data.get('attribute').set(binder.target, new Map());
		}

		if (!this.data.get('location').has(binder.scope)) {
			this.data.get('location').set(binder.scope, new Map());
		}

		if (!this.data.get('location').get(binder.scope).has(binder.path)) {
			this.data.get('location').get(binder.scope).set(binder.path, []);
		}

		this.data.get('attribute').get(binder.target).set(binder.name, binder);
		this.data.get('location').get(binder.scope).get(binder.path).push(binder);
	},

	create (data) {

		if (data.name === undefined) throw new Error('Oxe.binder.create - missing name');
		if (data.value === undefined) throw new Error('Oxe.binder.create - missing value');
		if (data.target === undefined) throw new Error('Oxe.binder.create - missing target');
		if (data.container === undefined) throw new Error('Oxe.binder.create - missing container');

		const scope = data.container.scope;
		const names = data.names || Utility.binderNames(data.name);
		const pipes = data.pipes || Utility.binderPipes(data.value);
		const values = data.values || Utility.binderValues(data.value);

		const type = names[0];
		const path = values.join('.');
		const keys = [scope].concat(values);
		const location = keys.join('.');

		const meta = data.meta || {};
		const context = data.context || {};

		return {
			get location () { return location; },

			get type () { return type; },
			get path () { return path; },
			get scope () { return scope; },

			get name () { return data.name; },
			get value () { return data.value; },
			get target () { return data.target; },
			get container () { return data.container; },
			get model () { return data.container.model; },

			get keys () { return keys; },
			get names () { return names; },
			get pipes () { return pipes; },
			get values () { return values; },

			get meta () { return meta; },
			get context () { return context; },

			// get data () {
			// 	const source = this.type === 'on' ? this.container.methods : this.container.model;
			// 	const data = Utility.getByPath(source, this.values);
			// 	return Piper(this, data);
			// },

			get data () { return Utility.getByPath(data.container.model, values); },
			set data (value) { return Utility.setByPath(data.container.model, values, value); },
		};
	},

	render (binder, data) {

		const type = binder.type in this.binders ? binder.type : 'default';
		const render = this.binders[type](binder, data);

		Batcher.batch(render);
	},

	renderData (node, attribute, container, context) {

		const binder = this.create({
			target: node,
			context: context,
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
			data = data === null || data === undefined ? binder.value : Piper(binder, data);
		}

		this.render(binder, data);
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

				this.renderData(node, { name: 'o-text', value: text }, context.container);
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

				if (attribute.value.indexOf('$') !== -1 && context.variable && context.path && context.key) {
					if (
						attribute.value === `$${context.variable}.$key` ||
						attribute.value === `$${context.variable}.$index`
					) {
						attribute.value = context.key;
					} else {
						const pattern = new RegExp(`\\$${context.variable}(,|\\s+|\\.|\\|)?(.*)?$`, 'ig');
						attribute.value = attribute.value.replace(pattern, `${context.path}.${context.key}$1$2`);
					}
				}

				this.renderData(node, attribute, context.container, context);
			}

			if (skipChildren) return;

			for (let i = 0; i < node.childNodes.length; i++) {
				this.add(node.childNodes[i], context);
			}

		}
	},

};

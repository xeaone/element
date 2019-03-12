import Utility from './utility.js';

import Batcher from './batcher.js';
import Class from './binders/class.js';
import Css from './binders/css.js';
import Default from './binders/default.js';
import Disable from './binders/disable.js';
import Each from './binders/each.js';
import Enable from './binders/enable.js';
import Hide from './binders/hide.js';
import Html from './binders/html.js';
import On from './binders/on.js';
import Read from './binders/read.js';
import Require from './binders/require.js';
import Show from './binders/show.js';
import Style from './binders/style.js';
import Text from './binders/text.js';
import Value from './binders/value.js';
import Write from './binders/write.js';

const DATA = {};

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

	get data () { return DATA; },
	get binders () { return BINDERS; },

	async setup (options) {
		options = options || {};

		if (options.binders) {
			for (let i = 0, l = options.binders.length; i < l; i++) {
				const binder = options.binders[i];
				this.binders[binder.name] = binder;
			}
		}

	},

	names (data) {
		data = data.split(this.PREFIX)[1];
		return data ? data.split('-') : [];
	},

	values (data) {
		data = data.split(this.PIPE)[0];
		return data ? data.split('.') : [];
	},

	pipes (data) {
		data = data.split(this.PIPE)[1];
		return data ? data.split(this.PIPES) : [];
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

		const meta = {};
		const context = {};

		return {
			get type () { return type; },
			get path () { return path; },
			get scope () { return scope; },

			get name () { return data.name; },
			get value () { return data.value; },
			get target () { return data.target; },
			get container () { return data.container; },

			get keys () { return keys; },
			get names () { return names; },
			get pipes () { return pipes; },
			get values () { return values; },

			get meta () { return meta; },
			get context () { return context; },

			get data () { return Utility.getByPath(data.container.model, values); },
			set data (value) { return Utility.setByPath(data.container.model, values, value); },
		};
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

			if (item.target === binder.target && item.name === binder.name) {
				return item;
			}

		}

		return null;
	},

	add (binder) {

		if (!(binder.scope in this.data)) {
			this.data[binder.scope] = {};
		}

		if (!(binder.path in this.data[binder.scope])) {
			this.data[binder.scope][binder.path] = [];
		}

		this.data[binder.scope][binder.path].push(binder);
	},

	remove (binder) {

		if (!(binder.scope in this.data)) {
			return;
		}

		if (!(binder.path in this.data[binder.scope])) {
			return;
		}

		const binders = this.data[binder.scope][binder.path];

		for (let i = 0; i < binders.length; i++) {
			if (binders[i].target === binder.target) {
				binders.splice(i, 1);
			}
		}

		if (binder.path in this.data[binder.scope] && !this.data[binder.scope][binder.path].length) {
			delete this.data[binder.scope][binder.path];
		}

	},

	render (binder, data) {
		const type = binder.type in this.binders ? binder.type : 'default';
		const render = this.binders[type](binder, data);

		Batcher.batch(render);
	}

};

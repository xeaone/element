import Utility from './utility.js';
// import Collection from './collection.js';
import Data from './data.js';

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

const POINTER = 0;
const DATA = new Map();

DATA.set('node', new Map());
DATA.set('location', new Map());
DATA.set('pointer', new Map());

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
		const location = keys.join('.');

		const meta = {};
		const context = {};
		const pointer = POINTER++;

		return {
			get pointer () { return pointer; },
			get location () { return location; },

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

			// get data () {
			// 	const source = this.type === 'on' ? this.container.methods : this.container.model;
			// 	const data = Utility.getByPath(source, this.values);
			// 	return Piper(this, data);
			// },

			get data () { return Utility.getByPath(data.container.model, values); },
			set data (value) { return Utility.setByPath(data.container.model, values, value); },
		};
	},

	get (type, data) {
		if (type === 'location') {
			return this.data.get('location').get(data);
		}
	},

	remove () {
	},

	add (binder) {
		this.data.get('pointer').set(binder.pointer, binder);

		if (this.data.get('location').has(binder.location)) {
			this.data.get('location').get(binder.location).push(binder.pointer);
		} else {
			this.data.get('location').set(binder.location, [binder.pointer]);
		}

		if (!this.data.get('attribute').has(binder.name)) {
			this.data.get('attribute').set(binder.name, new Map());
		}

		this.data.get('attribute').get(binder.name).set(binder.target, binder.pointer);

		if (!this.data.get('remove').has(binder.target)) {
			this.data.get('remove').set(binder.target, new Map());
		}

		this.data.get('remove').get(binder.target).set(binder.pointer, [
				// push all data things to remove
		]);

		// if (!this.data.get('location').has(binder.location)) {
		// 	this.data.get('location').set(binder.location, new Map());
		// }

		// this.data.get('location').get(binder.location).set(binder.target, binder.pointer);
	},

	render (binder, data) {
		const type = binder.type in this.binders ? binder.type : 'default';
		const render = this.binders[type](binder, data);

		Batcher.batch(render);
	}

};

import Utility from './utility.js';
import Batcher from './batcher.js';
import Class from './binders/class.js';
import Css from './binders/css.js';
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

export default {

	data: {},
	binders: {
		get class () {
			return Class;
		},
		get css () {
			return Css;
		},
		get disable () {
			return Disable;
		},
		get disabled () {
			return Disable;
		},
		get each () {
			return Each;
		},
		get enable () {
			return Enable;
		},
		get enabled () {
			return Enable;
		},
		get hide () {
			return Hide;
		},
		get hidden () {
			return Hide;
		},
		get html () {
			return Html;
		},
		get on () {
			return On;
		},
		get read () {
			return Read;
		},
		get require () {
			return Require;
		},
		get required () {
			return Require;
		},
		// required: Required,
		get show () {
			return Show;
		},
		get style () {
			return Style;
		},
		get text () {
			return Text;
		},
		get value () {
			return Value;
		},
		get write () {
			return Write;
		}
	},

	async setup (options) {
		options = options || {};
	},

	create (data) {
		const binder = {};

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

		let items = this.data[binder.scope][binder.path];

		for (let i = 0, l = items.length; i < l; i++) {

			if (items[i].element === binder.element) {
				return items.splice(i, 1);
			}

		}

	},

	render (binder, data) {
		let render;

		if (binder.type in this.binders) {
			render = this.binders[binder.type](binder, data);
		} else {
			render = {
				read () {

					if (data === undefined || data === null) {
						return false;
					} else if (typeof data === 'object') {
						data = JSON.stringify(data);
					} else if (typeof data !== 'string') {
						data = data.toString();
					}

					if (data === binder.element[binder.type]) {
						return false;
					}

				},
				write () {
					binder.element[binder.type] = data;
				}
			};
		}

		if (render) {
			Batcher.batch(render);
		}
	}

};

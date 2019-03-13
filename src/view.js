// import Utility from './utility.js';
// import Methods from './methods.js';
// import Binder from './binder.js';
// import Piper from './piper.js';
// import Model from './model.js';

const DATA = new Map();

export default {

	get data () { return DATA; },

	// target: document.body,
	// whitespacePattern: /^\s+$/g,

	async setup (options) {
		options = options || {};

		// this.target = options.target || document.body;

		// const observer = new MutationObserver(this.listener.bind(this));
		//
		// observer.observe(this.target, {
		// 	subtree: true,
		// 	childList: true,
		// 	// attributeFilter: [],
		// 	// attributes: true,
		// 	// attributeOldValue: true,
		// 	// characterData: true,
		// 	// characterDataOldValue: true
		// });

	},

	get (target, name) {
		return this.data.get(target).get(name);
	},

	remove (target, name) {
		if (this.data.has(target)) {
			if (this.data.get(target).has(name)) {
				this.data.get(target).delete(name);

				if (this.data.get(target).size === 0) {
					this.data.delete(target);
				}

			}
		}
	},

	add (binder) {

		if (!this.data.has(binder.target)) {
			this.data.set(binder.target, new Map());
		}

		this.data.get(binder.target).set(binder.name, binder);
	},

	// listener (records) {
	// 	for (let i = 0, l = records.length; i < l; i++) {
	// 		const record = records[i];
	// 		switch (record.type) {
	// 			case 'childList':
	// 				let container;
	// 				let parent = record.target;
	//
	// 				while (parent) {
	// 					if (parent.scope || 'o-scope' in parent.attributes) {
	// 						container = parent;
	// 						break;
	// 					} else {
	// 						parent = parent.parentElement;
	// 					}
	// 				}
	//
	// 				this.nodes(record.addedNodes, record.target, 'add', container);
	// 				this.nodes(record.removedNodes, record.target, 'remove', container);
	// 			break;
	// 			// case 'attributes':
	// 			// break;
	// 			// case 'characterData':
	// 			// break;
	// 		}
	// 	}
	// }

};

// import Events from './events.js';
import Binder from './binder.js';
import Utility from './utility.js';

// const events = Object.create(Events);

export default {

	// on: events.on.bind(events),
	// off: events.off.bind(events),
	// emit: events.emit.bind(events),

	observer: null,
	target: document.body,

	binder (nodes, target, type) {

		let container = Utility.getScope(target);
		let scope = container.scope;

		for (let i = 0, l = nodes.length; i <l; i++) {
			const node = nodes[i];
			const nodeType = node.nodeType;

			if (nodeType === 1) {

				if (node.parentElement !== target) {
					let parent = node.parentElement;
					while (parent) {
						if (parent.nodeType === 1 && (parent.scope || 'o-scope' in parent.attributes)) {
							container = parent;
							scope = container.scope;
							break;
						} else {
							parent = parent.parentElement;
							if (!parent) {
								container = target;
								scope = container.scope;
								break;
							}
						}
					}
				}

				Binder.b(node, container, scope, type);
				this.binder(node.children, target, type);
			}

		}
	},

	async setup (options) {
		const self = this;

		options = options || {};

		self.observer = new MutationObserver(function (records) {
			for (let i = 0, l = records.length; i < l; i++) {
				const record = records[i];
				console.log(record);
				switch (record.type) {
					case 'childList':
						self.binder(record.addedNodes, record.target, 'add');
						self.binder(record.removedNodes, record.target, 'remove');
						// if (record.addedNodes) self.emit('node:add', record);
						// if (record.removedNodes) self.emit('node:remove', record);
					break;
					case 'attributes':
						const target = record.target;
						const attribute = target.attributes[record.attributeName];
						// if (attribute) self.emit('attribute:add', attribute, record);
						// else self.emit('attribute:remove', attribute, record);
						// self.emit('attribute', record);
					break;
					// case 'characterData':
					// 	self.emit('text:update', record.target, record);
					// break;
				}
			}
		});

		this.observer.observe(self.target, {
			subtree: true,
			childList: true,
			// attributeFilter: [],
			attributes: true,
			// attributeOldValue: true,
			// characterData: true,
			// characterDataOldValue: true
		});

	}

};

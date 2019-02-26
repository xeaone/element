import Events from './events.js';
import Binder from './binder.js';

const events = Object.create(Events);

export default {

	on: events.on.bind(events),
	off: events.off.bind(events),
	emit: events.emit.bind(events),

	observer: null,
	target: document.body,

	binder (nodes, type) {
		for (let i = 0, l = nodes.length; i <l; i++) {
			const node = nodes[i];
			const nodeType = node.nodeType;

			if (nodeType === 1) {
				Binder.b(node, type);
				this.binder(node.children, type);
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
						self.binder(record.addedNodes, 'add');
						self.binder(record.addedNodes, 'remove');
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

import Events from './events.js';

const events = Object.create(Events);

export default {

	on: events.on.bind(events),
	off: events.off.bind(events),
	emit: events.emit.bind(events),

	target: document.body,

	async setup (options) {
		const self = this;

		options = options || {};

		const mutation = new MutationObserver(function (mutations) {
			for (var i = 0, l = mutations.length; i < l; i++) {
				const events = mutations[i];
				switch (events.type) {
					case 'childList':
							if (events.addedNodes) self.emit('add', events);
							if (events.removedNodes) self.emit('remove', events);
						break;
				}
			}
		});

		mutation.observe(self.target, {
			subtree: true,
			childList: true,
			attributes: false,
			characterData: false
		});
	}

};

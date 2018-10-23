import Batcher from '../batcher.js';
import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	const self = this;

	if (!binder.cache) binder.cache = binder.element.removeChild(binder.element.firstElementChild);

	return {
		write () {
			let key, keys, data, length;

			data = Model.get(binder.keys);

			if (!data || typeof data !== 'object') return;

			data = Binder.piper(binder, data);

			if (!data || typeof data !== 'object') return;

			if (data.constructor === Array) {
				length = data.length;
			}

			if (data.constructor === Object) {
				keys = Object.keys(data);
				length = keys.length;
			}

			if (binder.element.children.length > length) {
				binder.element.removeChild(binder.element.lastElementChild);
			} else if (binder.element.children.length < length) {
				const clone = binder.cache.cloneNode(true);

				if (data.constructor === Array) key = binder.element.children.length;
				if (data.constructor === Object) key = keys[binder.element.children.length];

				Utility.replaceEachVariable(clone, binder.names[1], binder.path, key);
				Binder.bind(clone, binder.container);
				binder.element.appendChild(clone);
			}

			if (binder.element.children.length !== data.length) {
				self.default(binder);
			}

		}
	};
};

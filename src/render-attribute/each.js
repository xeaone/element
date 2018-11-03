import Batcher from '../batcher.js';
import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	const self = this;

	if (binder.length === undefined) binder.length = 0;
	if (!binder.cache) binder.cache = binder.element.removeChild(binder.element.firstElementChild);

	let data, add, remove, fragment;

	return {
		read () {
			data = Model.get(binder.keys);
			data = Binder.piper(binder, data);

			if (!data || typeof data !== 'object') return false;

			if (data.length === binder.length) {
				return false;
			} else if (binder.length > data.length) {
				remove = binder.length - data.length;
				binder.length = data.length;
			} else if (binder.length < data.length) {
				add = data.length - binder.length;
				fragment = document.createDocumentFragment();

				for (binder.length; binder.length < data.length; binder.length++) {
					const clone = binder.cache.cloneNode(true);
					Utility.replaceEachVariable(clone, binder.names[1], binder.path, binder.length);
					Binder.bind(clone, binder.container, binder.scope);
					fragment.appendChild(clone);
				}

			}

		},
		write () {
			if (remove) {
				while (remove--) {
					binder.element.removeChild(binder.element.lastElementChild);
				}
			} else if (add) {
				binder.element.appendChild(fragment);
			}
		}
	};
};

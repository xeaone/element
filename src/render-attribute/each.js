import Batcher from '../batcher.js';
import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let self = this;

	if (!binder.fragment) binder.fragment = document.createDocumentFragment();
	if (!binder.cache) binder.cache = binder.element.removeChild(binder.element.firstElementChild);

	let data, add, remove;

	return {
		read () {
			data = Model.get(binder.keys);
			data = Binder.piper(binder, data);

			if (!data || typeof data !== 'object') return false;

			let length = binder.fragment.children.length + binder.element.children.length;

			if (length === data.length) {
				return false;
			} else if (length > data.length) {
				remove = true;
				length--;
			} else if (length < data.length) {
				let clone = binder.cache.cloneNode(true);

				Utility.replaceEachVariable(clone, binder.names[1], binder.path, length);
				Binder.bind(clone, binder.container, binder.scope);
				binder.fragment.appendChild(clone);
				length++;

				if (length === data.length) {
					add = true;
				}
			}

			if (length < data.length) {
				self.default(binder);
				return false;
			}

		},
		write () {
			if (remove) {
				binder.element.removeChild(binder.element.lastElementChild);
			} else if (add) {
				binder.element.appendChild(binder.fragment);
			}
		}
	};
};

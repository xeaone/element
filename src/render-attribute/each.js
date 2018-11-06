import Batcher from '../batcher.js';
import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

const FPS = 1000/30;

export default function (binder) {
	const self = this;

	// if (binder.length === undefined) binder.length = 0;
	if (!binder.fragment) binder.fragment = document.createDocumentFragment();
	if (!binder.cache) binder.cache = binder.element.removeChild(binder.element.firstElementChild);

	let data, add, remove;

	return {
		read () {
			data = Model.get(binder.keys);
			data = Binder.piper(binder, data);

			if (!data || typeof data !== 'object') return false;

			const length = binder.fragment.children.length + binder.element.children.length;

			// console.log('data: ', data.length);
			// console.log('fragment+element: ', length);

			if (length === data.length) {
				return false;
			} else if (length > data.length) {
				remove = true;
			} else if (length < data.length) {
				const clone = binder.cache.cloneNode(true);

				Utility.replaceEachVariable(clone, binder.names[1], binder.path, length);
				Binder.bind(clone, binder.container, binder.scope);
				binder.fragment.appendChild(clone);

				if (length + 1 === data.length) {
					add = true;
				} else if (length + 1 < data.length) {
					self.default(binder);
					return false;
				}

			}

		},
		write () {
			// console.log('each write');

			if (remove) {
				// console.log('each write remove');
				binder.element.removeChild(binder.element.lastElementChild);
			} else if (add) {
				// console.log('each write add');
				binder.element.appendChild(binder.fragment);
			}
		}
	};
};

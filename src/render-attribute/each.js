// import Batcher from '../batcher.js';
import Utility from '../utility.js';
// import View from '../view.js';
// import Model from '../model.js';

// const TIME = 15;

export default function (binder, data) {

	if (!binder.cache.template && !binder.element.children.length) {
		return;
	}

	if (!binder.cache.fragment) {
		binder.cache.fragment = document.createDocumentFragment();
	}

	if (!binder.cache.template) {
		binder.cache.template = binder.element.removeChild(binder.element.firstElementChild);
	}

	let add, remove;
	const self = this;

	return {
		read () {

			if (!data || typeof data !== 'object') data = [];

			const keys = Object.keys(data);
			let dataLength = keys.length;
			let elementLength = binder.cache.fragment.children.length + binder.element.children.length;

			// const time = window.performance.now();

			if (elementLength === dataLength) {
				return false;
			} else if (elementLength > dataLength) {
				remove = elementLength - dataLength;

				while (binder.cache.fragment.children.length && remove--) {
					binder.cache.fragment.removeChild(binder.cache.fragment.lastElementChild);
					// if (performance.now() - time > TIME) return;
				}

			} else if (elementLength < dataLength) {
				add = dataLength - elementLength;

				while (elementLength < dataLength) {

					const clone = document.importNode(binder.cache.template, true);
					const variable = keys[elementLength];
					Utility.replaceEachVariable(clone, binder.names[1], binder.path, keys[elementLength]);
					binder.cache.fragment.appendChild(clone);
					elementLength++;

					// if (performance.now() - time > TIME) return;
				}

			}

		},
		write () {

			if (remove) {
				// const time = window.performance.now();
				while (binder.element.children.length && remove--) {
					binder.element.removeChild(binder.element.lastElementChild);
					// if (performance.now() - time > TIME) break;
				}
			} else if (add) {
				binder.element.appendChild(binder.cache.fragment);
			}

			// console.log(data.length);
			// console.log(binder.element.children.length);

			if (binder.element.children.length !== data.length) {
				self.default(binder, data);
			}

		}
	};
};

import Batcher from '../batcher.js';
import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

const TIME = 15;

export default function (binder) {

	if (!binder.cache && !binder.element.children.length) {
		return;
	}

	if (!binder.fragment) {
		binder.fragment = document.createDocumentFragment();
	}

	if (!binder.cache) {
		binder.cache = binder.element.removeChild(binder.element.firstElementChild);
	}

	let self = this, data, add, remove;

	return {
		read () {
			data = Model.get(binder.keys);
			data = Binder.piper(binder, data);

			if (!data || typeof data !== 'object') return false;

			let isArray = data.constructor === Array;
			let keys = isArray ? [] : Object.keys(data);
			let dataLength = isArray ? data.length : keys.length;
			let elementLength = binder.fragment.children.length + binder.element.children.length;

			const time = window.performance.now();

			if (elementLength === dataLength) {
				return false;
			} else if (elementLength > dataLength) {
				remove = elementLength - dataLength;

				while (binder.fragment.children.length && remove--) {
					binder.fragment.removeChild(binder.fragment.lastElementChild);
					if (performance.now() - time > TIME) return;
				}

			} else if (elementLength < dataLength) {
				add = dataLength - elementLength;

				while (elementLength < dataLength) {

					const clone = document.importNode(binder.cache, true);
					const variable = isArray ? elementLength : keys[elementLength];
					Utility.replaceEachVariable(clone, binder.names[1], binder.path, variable);
					// Binder.bind(clone, binder.container, binder.scope);
					binder.fragment.appendChild(clone);
					elementLength++;

					if (performance.now() - time > TIME) return;
				}

			}

		},
		write () {
			if (remove) {
				const time = window.performance.now();
				while (binder.element.children.length && remove--) {
					binder.element.removeChild(binder.element.lastElementChild);
					if (performance.now() - time > TIME) break;
				}
			} else if (add) {
				binder.element.appendChild(binder.fragment);
			}

			if (binder.element.children.length !== data.length) {
				self.default(binder);
			} else if (binder.element.nodeName.indexOf('SELECT') !== -1 && binder.element.attributes['o-value']) {
				/*
					perform a re-render of the o-value becuase of o-each is async
				*/
				self.default(Binder.elements.get(binder.element).get('value'));
			}

		}
	};
};

import Batcher from '../batcher.js';
import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

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

			if (elementLength === dataLength) {
				return false;
			} else if (elementLength > dataLength) {
				remove = true;
				elementLength--;
			} else if (elementLength < dataLength) {
				let clone = document.importNode(binder.cache, true);
				let variable = isArray ? elementLength : keys[elementLength];

				Utility.replaceEachVariable(clone, binder.names[1], binder.path, variable);
				Binder.bind(clone, binder.container, binder.scope);
				binder.fragment.appendChild(clone);
				elementLength++;

				if (elementLength === dataLength) {
					add = true;
				}

				/*
					check if select element with o-value
					perform a re-render of the o-value
					becuase of o-each is async
				*/

				if (binder.element.nodeName === 'SELECT' && binder.element.attributes['o-value']) {
					var name = binder.element.attributes['o-value'].name;
					var value = binder.element.attributes['o-value'].value;
					var select = Binder.create({
						name: name,
						value: value,
						scope: binder.scope,
						element: binder.element,
						container: binder.container
					});
					self.default(select);
				}

			}

			if (elementLength < dataLength) {
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

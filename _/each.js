import Batcher from '../batcher.js';
import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	const self = this;

	if (binder.length === undefined) binder.length = 0;
	if (!binder.cache) binder.cache = binder.element.removeChild(binder.element.firstElementChild);

	let key, keys, data;
	let ADD, REMOVE, REPEAT;
	let lastElement, dataLength, binderLength;

	data = Model.get(binder.keys);
	data = Binder.piper(binder, data);

	if (!data || typeof data !== 'object') return;

	binderLength = binder.length;

	if (data.constructor === Array) {
		dataLength = data.length;
		key = binderLength;
	}

	if (data.constructor === Object) {
		keys = Object.keys(data);
		dataLength = keys.length;
		key = keys[binderLength];
	}

	if (binderLength > dataLength) {
		ADD = false;
		REMOVE = true;
		REPEAT = binderLength - dataLength > 1;
		binder.length--;
		lastElement = binder.element.lastElementChild;
	} else if (binderLength < dataLength) {
		ADD = true;
		REMOVE = false;
		REPEAT = dataLength - binderLength > 1;
		binder.length++;
	}

	return {
		read () {
			if (REMOVE) {
				lastElement = binder.element.lastElementChild;
			} else if (!REMOVE && !ADD) {
				return false;
			}
		},
		write () {

			if (REMOVE) {
				binder.element.removeChild(lastElement);
			} else if (ADD) {
				const clone = binder.cache.cloneNode(true);
				Utility.replaceEachVariable(clone, binder.names[1], binder.path, key);
				Binder.bind(clone, binder.container, binder.scope);
				binder.element.appendChild(clone);
			}

			if (REPEAT) {
				self.default(binder);
			}

		}
	};
};

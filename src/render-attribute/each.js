import Batcher from '../batcher.js';
import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	const self = this;

	let data, element, pass, key;

	// if (binder.context.pending) return;
	// else binder.context.pending = true;

	if (binder.length === undefined) binder.length = 0;
	if (!binder.cache) binder.cache = binder.element.removeChild(binder.element.firstElementChild);

	return {
		read () {

			data = Model.get(binder.keys);

			if (!data || typeof data !== 'object') {
				return false;
			}

			const isArray = data.constructor === Array;
			const isObject = data.constructor === Object;

			data = Binder.piper(binder, data);

			if (isArray) {
				if (binder.length === data.length) {
					return false;
				} else {
					key = binder.length;
				}
			}

			if (isObject) {
				const keys = Object.keys(data);

				if (binder.length === keys.length) {
					return false;
				} else {
					key = keys[binder.length];
				}
			}

			// if (binder.length > data.length && binder.element.children.length > data.length) {
			if (binder.length > data.length) {
				element = binder.element.lastElementChild;
			} else if (binder.length < data.length) {
				binder.length++;
			} else {
				return false;
			}

		},
		write () {

			if (element) {
				binder.element.removeChild(element);
				element = undefined;
			} else {
				const clone = binder.cache.cloneNode(true);
				Utility.replaceEachVariable(clone, binder.names[1], binder.path, key);
				Binder.bind(clone, binder.container);
				binder.element.appendChild(clone);
			}

			/*
				check if select element with o-value
				perform a re-render of the o-value
				becuase of o-each is async
			*/
			if (
				binder.element.nodeName === 'SELECT' &&
				binder.element.attributes['o-value'] ||
				binder.element.attributes['data-o-value']
			) {
				const name = binder.element.attributes['o-value'] || binder.element.attributes['data-o-value'];
				const value = binder.element.attributes['o-value'].value || binder.element.attributes['data-o-value'].value;
				const keys = [binder.scope].concat(value.split('|')[0].split('.'));
				self.value({
					keys: keys,
					name: name,
					value: value,
					scope: binder.scope,
					element: binder.element,
					container: binder.container,
				});
			}

			// self.default(binder);
		}
	};
};

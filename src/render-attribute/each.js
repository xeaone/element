import Batcher from '../batcher.js';
import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	const self = this;

	let data, length, pass, key;

	console.log('each');

	// if (binder.context.pending) return;
	// else binder.context.pending = true;

	// if (length === undefined) length = 0;
	// else length++;

	if (!binder.cache) binder.cache = binder.element.removeChild(binder.element.firstElementChild);

	return {
		read () {

			data = Model.get(binder.keys);

			if (!data || typeof data !== 'object') {
				binder.pending = false;
				return false;
			}

			// const length = binder.element.children.length;
			const isArray = data.constructor === Array;
			const isObject = data.constructor === Object;

			data = Binder.piper(binder, data);

			const keys = isObject ? Object.keys(data) : [];

			console.log(data.length);

			if (isArray) {
				if (length === data.length) {
				// if (length === data.length) {
					// binder.pending = false;
					return false;
				} else {
					key = length;
					// key = length;
				}
			}

			if (isObject) {
				if (length === keys.length) {
				// if (length === keys.length) {
					// binder.context.pending = false;
					return false;
				} else {
					key = keys[length];
					// key = keys[length];
				}
			}

			if (length > data.length && binder.element.children.length > data.length) {
				binder.context.element = binder.element.lastElementChild;
				length = length !== 0 ? length-1 : length;
			} else {
				length++;
			}

			// binder.context.element = length > data.length ? binder.element.lastElementChild : null;
		},
		write () {

			if (binder.context.element) {
				binder.element.removeChild(binder.context.element);
				binder.context.element = undefined;
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

			// binder.context.pending = false;
			// self.default(binder);
		}
	};
};

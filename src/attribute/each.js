import Batcher from '../batcher.js';
import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	const self = this;

	let data ;

	console.log('each');

	// if (binder.context.pending) return;
	// else binder.context.pending = true;

	if (binder.context.length === undefined) binder.context.length = 0;
	// else binder.context.length++;

	if (!binder.context.cache) binder.context.cache = binder.element.removeChild(binder.element.firstElementChild);

	Batcher.batch({
		read () {

			data = Model.get(binder.keys);

			if (!data || typeof data !== 'object') {
				binder.pending = false;
				binder.context.continue = false;
				return;
			}

			// const length = binder.element.children.length;
			const isArray = data.constructor === Array;
			const isObject = data.constructor === Object;

			data = Binder.piper(binder, data);

			const keys = isObject ? Object.keys(data) : [];

			if (isArray) {
				if (binder.context.length === data.length) {
				// if (length === data.length) {
					// binder.pending = false;
					binder.context.continue = false;
					return;
				} else {
					binder.context.key = binder.context.length;
					// binder.context.key = length;
				}
			}

			if (isObject) {
				if (binder.context.length === keys.length) {
				// if (length === keys.length) {
					// binder.context.pending = false;
					binder.context.continue = false;
					return;
				} else {
					binder.context.key = keys[binder.context.length];
					// binder.context.key = keys[length];
				}
			}

			if (binder.context.length > data.length && binder.element.children.length > data.length) {
				binder.context.element = binder.element.lastElementChild;
				binder.context.length = binder.context.length !== 0 ? binder.context.length-1 : binder.context.length;
			} else {
				binder.context.length++;
			}

			// binder.context.element = length > data.length ? binder.element.lastElementChild : null;
		},
		write () {

			if (binder.context.element) {
				binder.element.removeChild(binder.context.element);
				binder.context.element = undefined;
			} else {
				const clone = binder.context.cache.cloneNode(true);
				Utility.replaceEachVariable(clone, binder.names[1], binder.path, binder.context.key);
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
	});
}

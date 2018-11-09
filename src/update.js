import Model from './model.js';
import Binder from './binder.js';
import Batcher from './batcher.js';

export default async function (element, attribute) {

	if (!element) throw new Error('Oxe - requires element argument');
	if (!attribute) throw new Error('Oxe - requires attribute argument');

	var binder = Binder.elements.get(element).get(attribute);

	var read = function () {
		var type = binder.element.type;
	 	var name = binder.element.nodeName;

		var data;

		if (name === 'SELECT') {
			var elements = binder.element.options;
			var multiple = binder.element.multiple;

			var selected = false;

			data = multiple ? [] : '';

			for (var i = 0, l = elements.length; i < l; i++) {
				var element = elements[i];
				// NOTE might need to handle disable

				if (element.selected) {
					selected = true;

					if (multiple) {
						data.push(element.value);
					} else {
						data = element.value;
						break;
					}

				}

			}

			if (elements.length && !multiple && !selected) {
				data = elements[0].value;
			}

		} else if (type === 'radio') {
			var query = 'input[type="radio"][o-value="' + binder.value + '"]';
			var elements = binder.container.querySelectorAll(query);

			for (var i = 0, l = elements.length; i < l; i++) {
				var element = elements[i];

				if (binder.element === element) {
					data = i;
				}

			}

		} else if (type === 'file') {
			var files = binder.element.files;

			data = data || [];

			for (var i = 0, l = files.length; i < l; i++) {
				var file = files[i];
				data.push(file);
			}

		} else if (type === 'checkbox') {
			data = binder.element.checked;
		} else {
			data = binder.element.value;
		}

		if (data !== undefined) {
			var original = Model.get(binder.keys);

			if (
				data &&
				typeof data === 'object' &&
				data.constructor === original.constructor
			) {
				for (var key in data) {
					if (data[key] !== original[key]) {
						Model.set(binder.keys, data);
						break;
					}
				}
			} else if (original !== data) {
				Model.set(binder.keys, data);
			}

		}

	};

	Batcher.batch({ read });
};

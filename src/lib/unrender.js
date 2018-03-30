import Global from '../global';

export default {

	alt (opt) {
		Global.batcher.write(function () {
			opt.element.alt = '';
		});
	},

	each (opt) {
		Global.batcher.write(function () {
			var element;

			while (element = opt.element.lastElementChild) {
				opt.element.removeChild(element);
			}
		});
	},

	href (opt) {
		Global.batcher.write(function () {
			opt.element.href = '';
		});
	},

	class (opt) {
		Global.batcher.write(function () {
			var className = opt.names.slice(1).join('-');
			opt.element.classList.remove(className);
		});
	},

	html (opt) {
		Global.batcher.write(function () {
			var element;

			while (element = opt.element.lastElementChild) {
				opt.element.removeChild(element);
			}
		});
	},

	on (opt) {
		opt.element.removeEventListener(opt.names[1], opt.cache, false);
	},

	css (opt) {
		Global.batcher.write(function () {
			opt.element.style.cssText = '';
		});
	},

	required (opt) {
		Global.batcher.write(function () {
			opt.element.required = false;
		});
	},

	src (opt) {
		Global.batcher.write(function () {
			opt.element.src = '';
		});
	},

	text (opt) {
		Global.batcher.write(function () {
			opt.element.innerText = '';
		});
	},

	value (opt) {
		Global.batcher.write(function () {
			var i , l, query, element, elements;

			if (opt.element.nodeName === 'SELECT') {

				elements = opt.element.options;

				for (i = 0, l = elements.length; i < l; i++) {
					element = elements[i];
					element.selected = false;
				}

			} else if (opt.element.type === 'radio') {

				query = 'input[type="radio"][o-value="' + opt.path + '"]';
				elements = opt.element.parentNode.querySelectorAll(query);

				for (i = 0, l = elements.length; i < l; i++) {
					element = elements[i];

					if (i === 0) {
						element.checked = true;
					} else {
						element.checked = false;
					}

				}

			} else if (opt.element.type === 'checkbox') {

				opt.element.checked = false
				opt.element.value = false;

			} else {
				opt.element.value = '';
			}

		});
	},

	default (opt) {}

};

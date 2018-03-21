
export default {

	alt (opt) {
		opt.element.alt = '';
	},

	each (opt) {
		var element;

		while (element = opt.element.lastElementChild) {
			opt.element.removeChild(element);
		}

	},

	href (opt) {
		opt.element.href = '';
	},

	class (opt) {

		var className = opt.names.slice(1).join('-');
		opt.element.classList.remove(className);

	},

	html (opt) {
		var element;

		while (element = opt.element.lastElementChild) {
			opt.element.removeChild(element);
		}

	},

	on (opt) {
		opt.element.removeEventListener(opt.names[1], opt.cache, false);
	},

	css (opt) {
		opt.element.style.cssText = '';
	},

	required (opt) {
		opt.element.required = false;
	},

	src (opt) {
		opt.element.src = '';
	},

	text (opt) {
		opt.element.innerText = '';
	},

	value (opt) {
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

	},

	default (opt) {
		// console.log(opt);
	}

}

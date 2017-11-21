
var Unrender = {};

Unrender.alt = function (opt) {
	opt.element.alt = '';
};

Unrender.each = function (opt) {
	var element;

	while (element = element.lastElementChild) {
		element.removeChild(element);
	}

};

Unrender.href = function (opt) {
	opt.element.href = '';
};

Unrender.class = function (opt) {

	var className = opt.names.slice(1).join('-');
	opt.element.classList.remove(className);

};

Unrender.html = function (opt) {
	var element;

	while (element = opt.element.lastElementChild) {
		opt.element.removeChild(element);
	}

};

Unrender.on = function UnrenderOn (opt) {
	opt.element.removeEventListener(opt.names[1], opt.cache, false);
};

Unrender.css = function (opt) {

	opt.element.style.cssText = '';

};

Unrender.required = function (opt) {

	opt.element.required = false;

};

Unrender.src = function (opt) {
	opt.element.src = '';
};

Unrender.text = function (opt, data) {
	opt.element.innerText = '';
};

Unrender.value = function (opt) {
	var i , l, query, element, elements;

	if (opt.element.type === 'checkbox') {

		opt.element.checked = false
		opt.element.value = false;

	} else if (opt.element.nodeName === 'SELECT') {

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

	} else {
		opt.element.value = '';
	}

};

export default Unrender;

import Global from '../global';

/*
	css
	class
	disable
	each
	enable
	hide
	html
	on
	read
	required
	selected
	show
	src
	text
	write
	value
*/

var Render = {};

Render.maxFrameTime = 1000/60;

Render.class = function (opt) {
	var name = opt.names.slice(1).join('-');
	var data = Global.binder.modifyData(opt, opt.data);
	opt.element.classList.toggle(name, data);
};

Render.css = function (opt) {

	if (opt.element.style.cssText === opt.data) {
		return;
	}

	if (opt.names.length > 1) {
		opt.data = opt.names.slice(1).join('-') + ': ' +  opt.data + ';';
	}

	opt.element.style.cssText += Global.binder.modifyData(opt, opt.data);

};

Render.disable = function (opt) {

	if (opt.element.disabled === opt.data) {
		return;
	}

	opt.element.disabled = Global.binder.modifyData(opt, opt.data);
};

Render.enable = function (opt) {

	if (opt.element.disabled === !opt.data) {
		return;
	}

	opt.element.disabled = !Global.binder.modifyData(opt, opt.data);
};

Render.hide = function (opt) {

	if (opt.element.hidden === opt.data) {
		return;
	}

	opt.element.hidden = Global.binder.modifyData(opt, opt.data);
};

Render.html = function (opt) {

	if (opt.element.innerHTML === opt.data) {
		return;
	}

	opt.element.innerHTML = Global.binder.modifyData(opt, opt.data);
};

Render.read = function (opt) {

	if (opt.element.readOnly === opt.data) {
		return;
	}

	opt.element.readOnly = Global.binder.modifyData(opt, opt.data);
};

Render.required = function (opt) {

	if (opt.element.required === opt.data) {
		return;
	}

	opt.element.required = Global.binder.modifyData(opt, opt.data);
};

Render.selected = function (opt) {

	if (opt.element.selectedIndex === opt.data) {
		return;
	}

	opt.element.selectedIndex = Global.binder.modifyData(opt, opt.data);
};

Render.show = function (opt) {

	if (opt.element.hidden === !opt.data) {
		return;
	}

	opt.element.hidden = !Global.binder.modifyData(opt, opt.data);
};

Render.text = function (opt) {

	if (opt.data && typeof opt.data === 'object') {
		opt.data = JSON.stringify(opt.data);
	} else if (opt.data && typeof opt.data !== 'string') {
		opt.data = String(opt.data);
	}

	opt.data = Global.binder.modifyData(opt, opt.data);
	opt.data = opt.data === undefined || opt.data === null ? '' : opt.data;

	Global.batcher.write(function () {
		opt.element.innerText = opt.data;
	});

};

Render.write = function (opt) {

	if (opt.element.readOnly === !opt.data) {
		return;
	}

	opt.element.readOnly = !Global.binder.modifyData(opt, opt.data);
};

Render.each = function (opt) {

	if (opt.pending) {
		return;
	} else {
		opt.pending = true;
	}

	opt.data = Global.binder.modifyData(opt, opt.data);

	Global.batcher.read(function () {

		var dataLength = opt.data.length;
		var elementLength = opt.element.children.length;

		while (elementLength !== dataLength) {

			if (elementLength > dataLength) {

				elementLength--;

				Global.batcher.write(function (e) {
					opt.element.removeChild(e);
				}.bind(this, opt.element.children[elementLength]));

			} else if (elementLength < dataLength) {

				Global.batcher.write(function (l) {
					opt.element.insertAdjacentHTML('beforeend', opt.clone.replace(opt.pattern, l));
				}.bind(this, elementLength));

				elementLength++;

			}

		}

		opt.pending = false;

	}, this);

};

Render.on = function (opt) {
	opt.element.removeEventListener(opt.names[1], opt.cache);
	opt.cache = Global.utility.getByPath(Global.events.data, opt.uid + '.' + opt.path).bind(opt.model);
	opt.element.addEventListener(opt.names[1], opt.cache);
};

Render.value = function (opt, caller) {
	var i , l, query, element, elements;

	if (opt.element.type === 'checkbox') {
		if (caller === 'view') {
			Global.batcher.read(function () {
				opt.data = opt.element.value = opt.element.checked;
				Global.model.set(opt.keys, opt.data);
			});
		} else {
			Global.batcher.write(function () {
				opt.data = Global.binder.modifyData(opt, opt.data);
				opt.element.value = opt.data;
				opt.element.checked = opt.data;
			});
		}
	} else if (opt.element.nodeName === 'SELECT') {

		elements = opt.element.options;
		opt.data = opt.data === undefined || opt.data === null && opt.element.multiple ? [] : opt.data;
		opt.data = caller === 'view' && opt.element.multiple ? [] : opt.data;

		for (i = 0, l = elements.length; i < l; i++) {
			element = elements[i];

			if (element.selected) {

				if (opt.element.multiple) {
					opt.data.push(element.value || element.innerText);
				} else {
					opt.data = element.value || element.innerText;
					break;
				}

			}

		}

		// if (
		// 	!opt.element.multiple
		// 	&& opt.element.options.length
		// 	&& opt.data === null || opt.data === undefined
		// ) {
		// 	opt.data = elements[0].value || elements[0].innerText;
		// }

		opt.data = Global.binder.modifyData(opt, opt.data);
		Global.model.set(opt.keys, opt.data);

	} else if (opt.element.type === 'radio') {

		query = 'input[type="radio"][o-value="' + opt.value + '"]';
		elements = opt.container.querySelectorAll(query);
		opt.data = !opt.data ? 0 : opt.data;

		for (i = 0, l = elements.length; i < l; i++) {
			element = elements[i];

			if (caller === 'view') {

				if (opt.element === element) {

					opt.data = i;
					element.checked = true;

					opt.data = Global.binder.modifyData(opt, opt.data);
					Global.model.set(opt.keys, opt.data);

				} else {
					element.checked = false;
				}

			} else {
				element.checked = i == opt.data;
			}

		}

	} else if (opt.element.type === 'file') {

		opt.data = opt.element.files;
		opt.data = Global.binder.modifyData(opt, opt.data);
		Global.model.set(opt.keys, opt.data);

	} else if (opt.element.type === 'option') {

		opt.data = opt.element.value || opt.element.innerText;
		opt.data = Global.binder.modifyData(opt, opt.data);
		Global.model.set(opt.keys, opt.data);

	} else {

		if (caller === 'view') {

			Global.batcher.read(function () {
				opt.data = opt.element.value;
				Global.model.set(opt.keys, opt.data);
			});

		} else {

			opt.data = opt.data === undefined || opt.data === null ? '' : opt.data;
			opt.data = Global.binder.modifyData(opt, opt.data);

			Global.batcher.write(function () {
				opt.element.value = opt.data;
			});

		}

	}

};

Render.attribute = function (opt) {

	Global.batcher.read(function () {

		if (opt.element[opt.type] === opt.data) {
			return;
		}

		Global.batcher.write(function () {
			opt.element[opt.type] = Global.binder.modifyData(opt, opt.data);
		});

	});

};

export default Render;

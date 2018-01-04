import Global from '../global';
import Binder from './index';

var Render = {};

Render.class = function (opt) {
	var data = Binder.getData(opt);

	var name = opt.names.slice(1).join('-');
	opt.element.classList.toggle(name, Binder.modifyData(opt, data));

};

Render.css = function (opt) {
	var data = Binder.getData(opt);

	if (opt.element.style.cssText === data) {
		return;
	}

	if (opt.names.length > 1) {
		data = opt.names.slice(1).join('-') + ': ' +  data + ';';
	}

	opt.element.style.cssText += Binder.modifyData(opt, data);

};

Render.alt = function (opt) {
	var data = Binder.getData(opt);

	if (opt.element.alt === data) {
		return;
	}

	opt.element.alt = Binder.modifyData(opt, data);
};

Render.disable = function (opt) {
	var data = Binder.getData(opt);

	if (opt.element.disabled === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		Binder.setData(opt, data);
	}

	opt.element.disabled = Binder.modifyData(opt, data);
};

Render.enable = function (opt) {
	var data = Binder.getData(opt);

	if (opt.element.disabled === !data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		Binder.setData(opt, data);
	}

	opt.element.disabled = !Binder.modifyData(opt, data);
};

Render.hide = function (opt) {
	var data = Binder.getData(opt);

	if (opt.element.hidden === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		Binder.setData(opt, data);
	}

	opt.element.hidden = Binder.modifyData(opt, data);
};

Render.html = function (opt) {
	var data = Binder.getData(opt);

	if (opt.element.innerHTML === data) {
		return;
	}

	opt.element.innerHTML = Binder.modifyData(opt, data);
};

Render.href = function (opt) {
	var data = Binder.getData(opt);

	if (opt.element.href === data) {
		return;
	}

	opt.element.href = Binder.modifyData(opt, data);
};


Render.read = function (opt) {
	var data = Binder.getData(opt);

	if (opt.element.readOnly === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		Binder.setData(opt, data);
	}

	opt.element.readOnly = Binder.modifyData(opt, data);
};

Render.required = function (opt) {
	var data = Binder.getData(opt);

	if (opt.element.required === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		Binder.setData(opt, data);
	}

	opt.element.required = Binder.modifyData(opt, data);
};

Render.selected = function (opt) {
	var data = Binder.getData(opt);

	if (opt.element.selectedIndex === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = 0;
		Binder.setData(opt, data);
	}

	opt.element.selectedIndex = Binder.modifyData(opt, data);
};

Render.show = function (opt) {
	var data = Binder.getData(opt);

	if (opt.element.hidden === !data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		Binder.setData(opt, data);
	}

	opt.element.hidden = !Binder.modifyData(opt, data);
};

Render.src = function (opt) {
	var data = Binder.getData(opt);

	if (opt.element.src === data) {
		return;
	}

	opt.element.src = Binder.modifyData(opt, data);
};

Render.text = function (opt) {
	var data = Binder.getData(opt);

	if (data && typeof data === 'object') {
		data = JSON.stringify(data);
	} else if (data && typeof data !== 'string') {
		data = String(data);
	}

	data = Binder.modifyData(opt, data);
	data = data === undefined || data === null ? '' : data;

	opt.element.innerText = data;
};

Render.write = function (opt) {
	var data = Binder.getData(opt);

	if (opt.element.readOnly === !data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		Binder.setData(opt, data);
	}

	opt.element.readOnly = !Binder.modifyData(opt, data);
};

Render.each = function (opt, modified, time) {
	var data;
	var maxFrameTime = 1000/60;

	if (!modified) {
		data = Binder.getData(opt);

		if (!data) {
			data = [];
			Binder.setData(opt, data);
		}

		modified = Binder.modifyData(opt, data);
	}

	time = time || performance.now();

	while (opt.element.children.length !== modified.length) {

		if (opt.element.children.length > modified.length) {
			opt.element.removeChild(opt.element.lastElementChild);
		} else if (opt.element.children.length < modified.length) {
			opt.element.insertAdjacentHTML('beforeend', opt.clone.replace(opt.pattern, opt.element.children.length));
		}

		if (performance.now() - time > maxFrameTime) {
			break;
			return window.requestAnimationFrame(this.each.bind(this, opt, modified));
		}

	}

	if (opt.element.children.length !== Binder.getData(opt).length) {
		window.requestAnimationFrame(this.each.bind(this, opt, modified));
	}

};

Render.on = function (opt) {
	opt.element.removeEventListener(opt.names[1], opt.cache);
	opt.cache = Binder.getData(opt).bind(opt.model);
	opt.element.addEventListener(opt.names[1], opt.cache);
};

Render.value = function (opt, caller) {
	var i , l, data, query, element, elements;

	data = Binder.getData(opt);

	if (opt.element.type === 'checkbox') {

		if (caller === 'view') {
			data = opt.element.value = opt.element.checked;
		} else {
			data = !data ? false : data;
			opt.element.value = data;
			opt.element.checked = data;
		}

		data = Binder.modifyData(opt, data);
		Binder.setData(opt, data);

	} else if (opt.element.nodeName === 'SELECT') {

		elements = opt.element.options;
		data = data === undefined || data === null && opt.element.multiple ? [] : data;
		data = caller === 'view' && opt.element.multiple ? [] : data;

		for (i = 0, l = elements.length; i < l; i++) {
			element = elements[i];

			if (element.selected) {

				if (opt.element.multiple) {
					data.push(element.value || element.innerText);
				} else {
					data = element.value || element.innerText;
					break;
				}

			}

		}

		// if (
		// 	!opt.element.multiple
		// 	&& opt.element.options.length
		// 	&& data === null || data === undefined
		// ) {
		// 	data = elements[0].value || elements[0].innerText;
		// }

		data = Binder.modifyData(opt, data);
		Binder.setData(opt, data);

	} else if (opt.element.type === 'radio') {

		query = 'input[type="radio"][o-value="' + opt.value + '"]';
		elements = opt.container.querySelectorAll(query);
		data = !data ? 0 : data;

		for (i = 0, l = elements.length; i < l; i++) {
			element = elements[i];

			if (caller === 'view') {

				if (opt.element === element) {

					data = i;
					element.checked = true;

					data = Binder.modifyData(opt, data);
					Binder.setData(opt, data);

				} else {
					element.checked = false;
				}

			} else {
				element.checked = i == data;
			}

		}

	} else if (opt.element.type === 'file') {

		data = opt.element.files;
		data = Binder.modifyData(opt, data);
		Binder.setData(opt, data);

	} else if (opt.element.type === 'option') {

		data = opt.element.value || opt.element.innerText;
		data = Binder.modifyData(opt, data);
		Binder.setData(opt, data);

	} else {

		data = data === undefined || data === null ? opt.element.value : data;

		if (caller === 'view') {
			data = opt.element.value;
		} else {
			opt.element.value = data;
		}

		data = Binder.modifyData(opt, data);
		Binder.setData(opt, data);

	}

};

export default Render;

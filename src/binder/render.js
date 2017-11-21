
var Render = {};

Render.class = function (opt) {
	var data = this.getData(opt);

	var name = opt.names.slice(1).join('-');
	opt.element.classList.toggle(name, this.modifyData(opt, data));

};

Render.css = function (opt) {
	var data = this.getData(opt);

	if (opt.element.style.cssText === data) {
		return;
	}

	if (opt.names.length > 1) {
		data = opt.names.slice(1).join('-') + ': ' +  data + ';';
	}

	opt.element.style.cssText += this.modifyData(opt, data);

};

Render.alt = function (opt) {
	var data = this.getData(opt);

	if (opt.element.alt === data) {
		return;
	}

	opt.element.alt = this.modifyData(opt, data);
};

Render.disable = function (opt) {
	var data = this.getData(opt);

	if (opt.element.disabled === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		this.setData(opt, data);
	}

	opt.element.disabled = this.modifyData(opt, data);
};

Render.enable = function (opt) {
	var data = this.getData(opt);

	if (opt.element.disabled === !data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		this.setData(opt, data);
	}

	opt.element.disabled = !this.modifyData(opt, data);
};

Render.hide = function (opt) {
	var data = this.getData(opt);

	if (opt.element.hidden === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		this.setData(opt, data);
	}

	opt.element.hidden = this.modifyData(opt, data);
};

Render.html = function (opt) {
	var data = this.getData(opt);

	if (opt.element.innerHTML === data) {
		return;
	}

	opt.element.innerHTML = this.modifyData(opt, data);
};

Render.href = function (opt) {
	var data = this.getData(opt);

	if (opt.element.href === data) {
		return;
	}

	opt.element.href = this.modifyData(opt, data);
};


Render.read = function (opt) {
	var data = this.getData(opt);

	if (opt.element.readOnly === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		this.setData(opt, data);
	}

	opt.element.readOnly = this.modifyData(opt, data);
};

Render.required = function (opt) {
	var data = this.getData(opt);

	if (opt.element.required === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		this.setData(opt, data);
	}

	opt.element.required = this.modifyData(opt, data);
};

Render.selected = function (opt) {
	var data = this.getData(opt);

	if (opt.element.selectedIndex === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = 0;
		this.setData(opt, data);
	}

	opt.element.selectedIndex = this.modifyData(opt, data);
};

Render.show = function (opt) {
	var data = this.getData(opt);

	if (opt.element.hidden === !data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		this.setData(opt, data);
	}

	opt.element.hidden = !this.modifyData(opt, data);
};

Render.src = function (opt) {
	var data = this.getData(opt);

	if (opt.element.src === data) {
		return;
	}

	opt.element.src = this.modifyData(opt, data);
};

Render.text = function (opt) {
	var data = this.getData(opt) || '';

	if (typeof data === 'object') {
		data = JSON.stringify(data);
	} else if (typeof data !== 'string') {
		data = String(data);
	}

	opt.element.innerText = this.modifyData(opt, data);
};

Render.write = function (opt) {
	var data = this.getData(opt);

	if (opt.element.readOnly === !data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		this.setData(opt, data);
	}

	opt.element.readOnly = !this.modifyData(opt, data);
};

Render.each = function RenderEach (opt, modified) {
	var data;

	if (!modified) {
		data = this.getData(opt);

		if (!data) {
			data = [];
			this.setData(opt, data);
		}

		modified = this.modifyData(opt, data);
	}

	if (opt.element.children.length > modified.length) {
		opt.element.removeChild(opt.element.lastElementChild);
	} else if (opt.element.children.length < modified.length) {
		opt.element.insertAdjacentHTML('beforeend', opt.clone.replace(opt.pattern, opt.element.children.length));
	}

	if (opt.element.children.length !== modified.length) {
		this.batch(RenderEach.bind(this, opt, modified));
	}

};

Render.on = function RenderEach (opt) {
	opt.element.removeEventListener(opt.names[1], opt.cache);
	opt.cache = this.getData(opt).bind(opt.model);
	opt.element.addEventListener(opt.names[1], opt.cache);
};

Render.value = function (opt, caller) {
	var i , l, data, query, element, elements;

	data = this.getData(opt);

	if (opt.element.type === 'checkbox') {

		if (caller === 'view') {
			data = opt.element.value = opt.element.checked;
		} else {
			data = !data ? false : data;
			opt.element.value = data;
			opt.element.checked = data;
		}

		this.setData(opt, data);

	} else if (opt.element.nodeName === 'SELECT') {

		elements = opt.element.options;
		data = !data && opt.element.multiple ? [] : data;
		data = caller === 'view' && opt.element.multiple ? [] : data;

		for (i = 0, l = elements.length; i < l; i++) {
			element = elements[i];

			if (element.selected) {

				if (opt.element.multiple) {
					data.push(element.value);
				} else {
					data = element.value;
					break;
				}

			}

		}

		this.setData(opt, data);

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
					this.setData(opt, data);
				} else {
					element.checked = false;
				}

			} else {
				element.checked = i == data;
			}

		}

	} else {

		data = data === undefined ? '' : data;

		if (caller === 'view') {
			data = opt.element.value;
		} else {
			opt.element.value = data;
		}

		this.setData(opt, data);

	}

};

export default Render;

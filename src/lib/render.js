import Global from '../global';

var Render = {};

Render.maxFrameTime = 1000/60;

Render.class = function (opt) {
	var data = Global.binder.getData(opt);

	var name = opt.names.slice(1).join('-');
	opt.element.classList.toggle(name, Global.binder.modifyData(opt, data));

};

Render.css = function (opt) {
	var data = Global.binder.getData(opt);

	if (opt.element.style.cssText === data) {
		return;
	}

	if (opt.names.length > 1) {
		data = opt.names.slice(1).join('-') + ': ' +  data + ';';
	}

	opt.element.style.cssText += Global.binder.modifyData(opt, data);

};

Render.alt = function (opt) {
	var data = Global.binder.getData(opt);

	if (opt.element.alt === data) {
		return;
	}

	opt.element.alt = Global.binder.modifyData(opt, data);
};

Render.disable = function (opt) {
	var data = Global.binder.getData(opt);

	if (opt.element.disabled === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		Global.binder.setData(opt, data);
	}

	opt.element.disabled = Global.binder.modifyData(opt, data);
};

Render.enable = function (opt) {
	var data = Global.binder.getData(opt);

	if (opt.element.disabled === !data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		Global.binder.setData(opt, data);
	}

	opt.element.disabled = !Global.binder.modifyData(opt, data);
};

Render.hide = function (opt) {
	var data = Global.binder.getData(opt);

	if (opt.element.hidden === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		Global.binder.setData(opt, data);
	}

	opt.element.hidden = Global.binder.modifyData(opt, data);
};

Render.html = function (opt) {
	var data = Global.binder.getData(opt);

	if (opt.element.innerHTML === data) {
		return;
	}

	opt.element.innerHTML = Global.binder.modifyData(opt, data);
};

Render.href = function (opt) {
	var data = Global.binder.getData(opt);

	if (opt.element.href === data) {
		return;
	}

	opt.element.href = Global.binder.modifyData(opt, data);
};


Render.read = function (opt) {
	var data = Global.binder.getData(opt);

	if (opt.element.readOnly === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		Global.binder.setData(opt, data);
	}

	opt.element.readOnly = Global.binder.modifyData(opt, data);
};

Render.required = function (opt) {
	var data = Global.binder.getData(opt);

	if (opt.element.required === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		Global.binder.setData(opt, data);
	}

	opt.element.required = Global.binder.modifyData(opt, data);
};

Render.selected = function (opt) {
	var data = Global.binder.getData(opt);

	if (opt.element.selectedIndex === data) {
		return;
	}

	if (data === undefined || data === null) {
		data = 0;
		Global.binder.setData(opt, data);
	}

	opt.element.selectedIndex = Global.binder.modifyData(opt, data);
};

Render.show = function (opt) {
	var data = Global.binder.getData(opt);

	if (opt.element.hidden === !data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		Global.binder.setData(opt, data);
	}

	opt.element.hidden = !Global.binder.modifyData(opt, data);
};

Render.src = function (opt) {
	var data = Global.binder.getData(opt);

	if (opt.element.src === data) {
		return;
	}

	opt.element.src = Global.binder.modifyData(opt, data);
};

Render.text = function (opt) {
	var data = Global.binder.getData(opt);

	if (data && typeof data === 'object') {
		data = JSON.stringify(data);
	} else if (data && typeof data !== 'string') {
		data = String(data);
	}

	data = Global.binder.modifyData(opt, data);
	data = data === undefined || data === null ? '' : data;

	Global.batcher.write(function () {
		opt.element.innerText = data;
	});

};

Render.write = function (opt) {
	var data = Global.binder.getData(opt);

	if (opt.element.readOnly === !data) {
		return;
	}

	if (data === undefined || data === null) {
		data = true;
		Global.binder.setData(opt, data);
	}

	opt.element.readOnly = !Global.binder.modifyData(opt, data);
};

Render.each = function (opt) {

	if (opt.pending) {
		return;
	} else {
		opt.pending = true;
	}

	var data = Global.binder.getData(opt);

	if (!data) {
		data = [];
		Global.binder.setData(opt, data);
	}

	data = Global.binder.modifyData(opt, data);

	Global.batcher.read(function () {

		var dataLength = data.length;
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

	// window.requestAnimationFrame(function (time) {
    //
	// 	var dataLength = data.length;
	// 	var elementLength = opt.element.children.length;
    //
	// 	while (elementLength !== dataLength) {
    //
	// 		if (elementLength > dataLength) {
    //
	// 			elementLength--;
	// 			opt.element.removeChild(opt.element.children[elementLength]);
    //
	// 		} else if (elementLength < dataLength) {
    //
	// 			opt.element.insertAdjacentHTML('beforeend', opt.clone.replace(opt.pattern, elementLength));
	// 			elementLength++;
    //
	// 		}
    //
	// 		if (performance.now() - time > this.maxFrameTime) {
	// 			opt.pending = false;
	// 			return this.each(opt);
	// 		}
    //
	// 	}

		// while (opt.element.children.length !== data.length) {
        //
		// 	if (opt.element.children.length > data.length) {
		// 		opt.element.removeChild(opt.element.lastElementChild);
		// 	} else if (opt.element.children.length < data.length) {
		// 		opt.element.insertAdjacentHTML('beforeend', opt.clone.replace(opt.pattern, opt.element.children.length));
		// 	}
        //
		// 	if (performance.now() - time > this.maxFrameTime) {
		// 		opt.pending = false;
		// 		return this.each(opt);
		// 	}
        //
		// }

	// 	opt.pending = false;
    //
	// }.bind(this));

};

Render.on = function (opt) {
	opt.element.removeEventListener(opt.names[1], opt.cache);
	opt.cache = Global.binder.getData(opt).bind(opt.model);
	opt.element.addEventListener(opt.names[1], opt.cache);
};

Render.value = function (opt, caller) {
	var i , l, data, query, element, elements;

	data = Global.binder.getData(opt);

	if (opt.element.type === 'checkbox') {

		if (caller === 'view') {
			data = opt.element.value = opt.element.checked;
		} else {
			data = !data ? false : data;
			opt.element.value = data;
			opt.element.checked = data;
		}

		data = Global.binder.modifyData(opt, data);
		Global.binder.setData(opt, data);

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

		data = Global.binder.modifyData(opt, data);
		Global.binder.setData(opt, data);

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

					data = Global.binder.modifyData(opt, data);
					Global.binder.setData(opt, data);

				} else {
					element.checked = false;
				}

			} else {
				element.checked = i == data;
			}

		}

	} else if (opt.element.type === 'file') {

		data = opt.element.files;
		data = Global.binder.modifyData(opt, data);
		Global.binder.setData(opt, data);

	} else if (opt.element.type === 'option') {

		data = opt.element.value || opt.element.innerText;
		data = Global.binder.modifyData(opt, data);
		Global.binder.setData(opt, data);

	} else {

		window.requestAnimationFrame(function () {

			// data = data === undefined || data === null ? opt.element.value : data;

			if (caller === 'view') {
				// Global.batcher.read(function () {
					data = data === undefined || data === null ? opt.element.value : data;
					data = opt.element.value;
					Global.binder.setData(opt, data);
				// });
			} else {
				data = Global.binder.modifyData(opt, data);
				// Global.batcher.write(function () {
					opt.element.value = data;
				// });
			}

		});

		// data = Global.binder.modifyData(opt, data);
		// Global.binder.setData(opt, data);

	}

};

export default Render;

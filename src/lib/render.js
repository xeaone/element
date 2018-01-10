import Global from '../global';

var Render = {};

Render.fps = 1000/60;

// Render.selected = function (opt) {
// 	Global.batcher.read(function () {
//
// 		if (opt.element.selectedIndex === opt.data) {
// 			opt.pending = false;
// 			return;
// 		}
//
// 		Global.batcher.write(function () {
// 			opt.element.selectedIndex = Global.binder.modifyData(opt, opt.data);
// 			opt.pending = false;
// 		});
// 	});
// };

Render.required = function (opt) {
	Global.batcher.read(function () {

		if (opt.element.required === opt.data) {
			opt.pending = false;
			return;
		}

		Global.batcher.write(function () {
			opt.element.required = Global.binder.modifyData(opt, opt.data);
			opt.pending = false;
		});
	});
};

Render.disable = function (opt) {
	Global.batcher.read(function () {

		if (opt.element.disabled === opt.data) {
			opt.pending = false;
			return;
		}

		Global.batcher.write(function () {
			opt.element.disabled = Global.binder.modifyData(opt, opt.data);
			opt.pending = false;
		});
	});
};

Render.enable = function (opt) {
	Global.batcher.read(function () {

		if (opt.element.disabled === !opt.data) {
			opt.pending = false;
			return;
		}

		Global.batcher.write(function () {
			opt.element.disabled = !Global.binder.modifyData(opt, opt.data);
			opt.pending = false;
		});
	});
};

Render.hide = function (opt) {
	Global.batcher.read(function () {

		if (opt.element.hidden === opt.data) {
			opt.pending = false;
			return;
		}

		Global.batcher.write(function () {
			opt.element.hidden = Global.binder.modifyData(opt, opt.data);
			opt.pending = false;
		});
	});
};

Render.show = function (opt) {
	Global.batcher.read(function () {

		if (opt.element.hidden === !opt.data) {
			opt.pending = false;
			return;
		}

		Global.batcher.write(function () {
			opt.element.hidden = !Global.binder.modifyData(opt, opt.data);
			opt.pending = false;
		});
	});
};

Render.read = function (opt) {
	Global.batcher.read(function () {

		if (opt.element.readOnly === opt.data) {
			opt.pending = false;
			return;
		}

		Global.batcher.write(function () {
			opt.element.readOnly = Global.binder.modifyData(opt, opt.data);
			opt.pending = false;
		});
	});
};

Render.write = function (opt) {
	Global.batcher.read(function () {

		if (opt.element.readOnly === !opt.data) {
			opt.pending = false;
			return;
		}

		Global.batcher.write(function () {
			opt.element.readOnly = !Global.binder.modifyData(opt, opt.data);
			opt.pending = false;
		});
	});
};

Render.html = function (opt) {
	Global.batcher.read(function () {

		if (opt.element.innerHTML === opt.data) {
			opt.pending = false;
			return;
		}

		Global.batcher.write(function () {
			opt.element.innerHTML = Global.binder.modifyData(opt, opt.data);
			opt.pending = false;
		});
	});
};

Render.css = function (opt) {
	var data = opt.data

	Global.batcher.read(function () {
		if (opt.element.style.cssText === data) {
			opt.pending = false;
			return;
		}

		if (opt.names.length > 1) {
			data = opt.names.slice(1).join('-') + ': ' +  data + ';';
		}

		Global.batcher.write(function () {
			opt.element.style.cssText = Global.binder.modifyData(opt, data);
			opt.pending = false;
		});
	});
};

Render.class = function (opt) {
	var data = opt.data;
	var name = opt.names.slice(1).join('-');
	Global.batcher.write(function () {
		data = Global.binder.modifyData(opt, data);
		opt.element.classList.toggle(name, data);
		opt.pending = false;
	});
};

Render.on = function (opt) {

	if (opt.cache) {
		opt.element.removeEventListener(opt.names[1], opt.cache);
	}

	opt.cache = Global.utility.getByPath(Global.events.data, opt.uid + '.' + opt.path).bind(opt.model);
	opt.element.addEventListener(opt.names[1], opt.cache);
	opt.pending = false;
};

Render.text = function (opt) {
	var data = opt.data === undefined || opt.data === null ? '' : opt.data;

	if (data && typeof data === 'object') {
		data = JSON.stringify(data);
	} else if (data && typeof data !== 'string') {
		data = String(data);
	}

	Global.batcher.write(function () {
		opt.element.innerText = Global.binder.modifyData(opt, data);
		opt.pending = false;
	});

};

Render.each = function (opt) {
	var self = this;

	if (!opt.cache) {
		opt.cache = opt.element.removeChild(opt.element.firstElementChild);
	}

	Global.batcher.read(function () {
		var data = Global.binder.modifyData(opt, opt.data);
		var dataLength = data.length;
		var elementLength = opt.element.children.length;

		Global.batcher.write(function () {
			var time = performance.now();

			while (elementLength !== dataLength) {
				if (performance.now() - time > self.fps) {
					return self.each(opt);
				} else if (elementLength > dataLength) {
					elementLength--;
					opt.element.removeChild(opt.element.children[elementLength]);
				} else if (elementLength < dataLength) {
					var clone = opt.cache.cloneNode(true);
					Global.utility.replaceEachVariable(clone, opt.names[1], opt.path, elementLength);
					opt.element.appendChild(clone);
					elementLength++;
				}
			}

			opt.pending = false;
		});
	});
};

Render.value = function (opt, caller) {
	Global.batcher.read(function () {
		var data, attribute, query;
		var i, l, element, elements;
		var type = opt.element.type;
		var name = opt.element.nodeName;

		if (caller === 'view') {

			if (name === 'SELECT') {
				data = opt.element.multiple ? [] : '';
				elements = opt.element.options;
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
			} else if (type === 'radio') {
				query = 'input[type="radio"][o-value="' + opt.value + '"]';
				elements = opt.container.querySelectorAll(query);
				for (i = 0, l = elements.length; i < l; i++) {
					element = elements[i];
					if (opt.element === element) {
						data = i;
						break;
					}
				}
			} else if (type === 'file') {
				data = opt.element.files;
			} else if (type === 'checkbox') {
				data = opt.element.checked;
			} else {
				data = opt.element.value;
			}

			Global.model.set(opt.keys, data);
			opt.pending = false;

		} else {
			Global.batcher.write(function () {

				if (name === 'SELECT') {
					data = opt.data === undefined ? opt.element.multiple ? [] : '' : opt.data;
					elements = opt.element.options;
					for (i = 0, l = elements.length; i < l; i++) {
						element = elements[i];
						if (opt.element.multiple && (element.value === data[i] || element.innerText === data[i])) {
							element.selected = true;
							data.push(element.value || element.innerText);
						} else if (element.value === data || element.innerText === data) {
							element.selected = true;
							data = element.value || element.innerText;
							break;
						}
					}
					if (opt.element.multiple) {
						// data = !data.length ? [elements[0].value || elements[0].innerText] : data;
						// Global.model.set(opt.keys, data);
					} else {
						data = !data ? elements[0].value || elements[0].innerText : data;
						Global.model.set(opt.keys, data);
					}
				} else if (type === 'radio') {
					data = opt.data === undefined ? Global.model.set(opt.keys, 0) : opt.data;
					query = 'input[type="radio"][o-value="' + opt.value + '"]';
					elements = opt.container.querySelectorAll(query);
					for (i = 0, l = elements.length; i < l; i++) {
						element = elements[i];
						element.checked = i === data;
					}
					elements[data].checked = true;
				} else if (type === 'file') {
					attribute = 'files';
					data = opt.data === undefined ? Global.model.set(opt.keys, []) : opt.data;
				} else if (type === 'checkbox') {
					attribute = 'checked';
					data = opt.data === undefined ? Global.model.set(opt.keys, false) : opt.data;
				} else {
					attribute = 'value';
					data = opt.data === undefined ? Global.model.set(opt.keys, '') : opt.data;
				}

				if (attribute) {
					opt.element[attribute] = Global.binder.modifyData(opt, data);
				}

				opt.pending = false;

			});
		}

	});
};

Render.default = function (opt) {
	var data = opt.data;

	Global.batcher.read(function () {

		if (opt.element[opt.type] === data) {
			return;
		}

		Global.batcher.write(function () {
			opt.element[opt.type] = Global.binder.modifyData(opt, data);
		});

	});
};

export default Render;

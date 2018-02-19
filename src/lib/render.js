import Global from '../global';

// TODO dynamic for list dont handle selected

const Render = {

	required (opt) {
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
	},

	disable (opt) {
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
	},

	enable (opt) {
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
	},

	hide (opt) {
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
	},

	show (opt) {
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
	},

	read (opt) {
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
	},

	write (opt) {
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
	},

	html (opt) {
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
	},

	class (opt) {
		Global.batcher.write(function () {
			var name = opt.names.slice(1).join('-');
			opt.element.classList.toggle(name, Global.binder.modifyData(opt, opt.data));
			opt.pending = false;
		});
	},

	on (opt) {

		if (opt.cache) {
			opt.element.removeEventListener(opt.names[1], opt.cache);
		} else {
			opt.cache = Global.utility.getByPath(Global.methods.data, opt.scope + '.' + opt.path).bind(opt.container);
		}

		opt.element.addEventListener(opt.names[1], opt.cache);
		opt.pending = false;
	},

	css (opt) {
		Global.batcher.read(function () {

			if (opt.element.style.cssText === opt.data) {
				opt.pending = false;
				return;
			}

			var data;

			if (opt.names.length > 1) {
				data = opt.names.slice(1).join('-') + ': ' +  data + ';';
			}

			Global.batcher.write(function () {
				opt.element.style.cssText = Global.binder.modifyData(opt, data);
				opt.pending = false;
			});
		});
	},

	text (opt) {
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

	},

	each (opt) {

		if (!opt.cache) {
			opt.cache = opt.element.removeChild(opt.element.firstElementChild);
		}

		if (!opt.data || typeof opt.data !== 'object' || opt.element.children.length === opt.data.length) {
			opt.pending = false;
			return;
		}

		Global.batcher.read(function () {

			var clone;
			var element = opt.element;
			var data = Global.binder.modifyData(opt, opt.data);

			var dLength = data.length;
			var eLength = element.children.length;

			Global.batcher.write(function () {

				while (eLength !== dLength) {

					if (eLength > dLength) {

						eLength--;
						element.removeChild(element.children[eLength]);

					} else if (eLength < dLength) {

						clone = opt.cache.cloneNode(true);
						Global.utility.replaceEachVariable(clone, opt.names[1], opt.path, eLength);
						element.appendChild(clone);
						eLength++;

					}

				}

				opt.pending = false;
			});
		});
	},

	value (opt, caller) {

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
					data = data || [];
					for (i = 0, l = opt.element.files.length; i < l; i++) {
						data[i] = opt.element.files[i];
					}
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

						for (i = 0, l = opt.element.options.length; i < l; i++) {
							if (!opt.element.options[i].disabled) {
								if (opt.element.options[i].selected) {
									if (opt.element.multiple) {
										data.push(opt.element.options[i].value || opt.element.options[i].innerText || '');
									} else {
										data = opt.element.options[i].value || opt.element.options[i].innerText || '';
										break;
									}
								} else if (i === l-1 && !opt.element.multiple) {
									data = opt.element.options[0].value || opt.element.options[0].innerText || '';
								}
							}
						}

						Global.model.set(opt.keys, data);
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
						data = opt.data === undefined ? Global.model.set(opt.keys, []) : opt.data;
						for (i = 0, l = data.length; i < l; i++) {
							opt.element.files[i] = data[i];
						}
					} else if (type === 'checkbox') {
						attribute = 'checked';
						data = opt.data === undefined ? Global.model.set(opt.keys, false) : opt.data;
					} else {
						attribute = 'value';
						data = opt.data === undefined ? Global.model.set(opt.keys, '') : opt.data;
					}

					if (attribute) {
						opt.element[attribute] = data;
						opt.element[attribute] = Global.binder.modifyData(opt, data);
					}

					opt.pending = false;

				});
			}

		});

	},

	default (opt) {
		Global.batcher.read(function () {

			if (opt.element[opt.type] === opt.data) {
				return;
			}

			Global.batcher.write(function () {
				opt.element[opt.type] = Global.binder.modifyData(opt, opt.data);
			});

		});
	}

}

export default Render;

import Global from '../global';

// TODO dynamic for list dont handle selected

export default {

	required (opt) {
		Global.batcher.read(function () {
			var data = Global.model.get(opt.keys);

			if (opt.element.required === data) {
				return;
			}

			data = Global.utility.binderModifyData(opt, data);

			Global.batcher.write(function () {
				opt.element.required = data;
			});
		});
	},

	disable (opt) {
		Global.batcher.read(function () {
			var data = Global.model.get(opt.keys);

			if (opt.element.disabled === data) {
				return;
			}

			data = Global.binder.modifyData(opt, data);

			Global.batcher.write(function () {
				opt.element.disabled = data;
			});
		});
	},

	enable (opt) {
		Global.batcher.read(function () {
			var data = Global.model.get(opt.keys);

			if (opt.element.disabled === !data) {
				return;
			}

			data = Global.binder.modifyData(opt, data);

			Global.batcher.write(function () {
				opt.element.disabled = !data;
			});
		});
	},

	hide (opt) {
		Global.batcher.read(function () {
			var data = Global.model.get(opt.keys);

			if (opt.element.hidden === data) {
				return;
			}

			data = Global.binder.modifyData(opt, data);

			Global.batcher.write(function () {
				opt.element.hidden = data;
			});
		});
	},

	show (opt) {
		Global.batcher.read(function () {
			var data = Global.model.get(opt.keys);

			if (opt.element.hidden === !data) {
				return;
			}

			data = Global.binder.modifyData(opt, data);

			Global.batcher.write(function () {
				opt.element.hidden = !data;
			});
		});
	},

	read (opt) {
		Global.batcher.read(function () {
			var data = Global.model.get(opt.keys);

			if (opt.element.readOnly === data) {
				return;
			}

			data = Global.binder.modifyData(opt, data);

			Global.batcher.write(function () {
				opt.element.readOnly = data;
			});
		});
	},

	write (opt) {
		Global.batcher.read(function () {
			var data = Global.model.get(opt.keys);

			if (opt.element.readOnly === !data) {
				return;
			}

			data = Global.binder.modifyData(opt, data);

			Global.batcher.write(function () {
				opt.element.readOnly = !data;
			});
		});
	},

	html (opt) {
		Global.batcher.read(function () {
			var data = Global.model.get(opt.keys);

			if (opt.element.innerHTML === data) {
				return;
			}

			data = Global.binder.modifyData(opt, data);

			Global.batcher.write(function () {
				opt.element.innerHTML = data;
			});
		});
	},

	class (opt) {
		Global.batcher.write(function () {
			var data = Global.model.get(opt.keys);
			var name = opt.names.slice(1).join('-');
			data = Global.binder.modifyData(opt, data);
			opt.element.classList.toggle(name, data);
		});
	},

	on (opt) {
		Global.batcher.write(function () {
			const data = Global.utility.getByPath(Global.methods.data, opt.scope + '.' + opt.path);

			if (typeof data !== 'function') return;

			if (opt.cache) {
				opt.element.removeEventListener(opt.names[1], opt.cache);
			} else {
				opt.cache = function (e) {
					return Promise.resolve().then(function () {
						const parameters = [e];

						for (let i = 0, l = opt.modifiers.length; i < l; i++) {
							const keys = opt.modifiers[i].split('.');
							keys.unshift(opt.scope);
							const parameter = Oxe.model.get(keys);
							parameters.push(parameter);
						}

						return data.apply(opt.container, parameters);
					}).catch(console.error);
				};
			}

			opt.element.addEventListener(opt.names[1], opt.cache);

		});
	},

	css (opt) {
		Global.batcher.read(function () {
			var data = Global.model.get(opt.keys);

			if (opt.element.style.cssText === data) {
				return;
			}

			if (opt.names.length > 1) {
				data = opt.names.slice(1).join('-') + ': ' +  data + ';';
			}

			data = Global.binder.modifyData(opt, data);

			Global.batcher.write(function () {
				opt.element.style.cssText = data;
			});
		});
	},

	text (opt) {
		Global.batcher.read(function () {
			var data = Global.model.get(opt.keys);

			data = data === undefined || data === null ? '' : data;

			if (data && typeof data === 'object') {
				data = JSON.stringify(data);
			} else if (data && typeof data !== 'string') {
				data = String(data);
			}

			data = Global.binder.modifyData(opt, data);

			Global.batcher.write(function () {
				opt.element.innerText = data;
			});
		});
	},

	each (opt) {
		Global.batcher.read(function () {
			var data = Global.model.get(opt.keys);
			var isArray = data ? data.constructor === Array : false;
			var isObject = data ? data.constructor === Object: false;

			if (!data || typeof data !== 'object') {
				return;
			} else if (isArray && opt.element.children.length === data.length) {
				return;
			} else if (isObject && opt.element.children.length === Object.keys(data).length) {
				return;
			}

			data = Global.binder.modifyData(opt, data);

			Global.batcher.write(function () {

				if (isObject) {
					data = Object.keys(data);
				}

				while (opt.element.children.length !== data.length) {

					if (opt.element.children.length > data.length) {
						opt.element.removeChild(opt.element.children[opt.element.children.length-1]);
					} else if (opt.element.children.length < data.length) {
						var key;
						var clone = opt.cache.cloneNode(true);

						if (isArray) {
							key = opt.element.children.length;
						} else if (isObject) {
							key = data[opt.element.children.length];
						}

						Global.utility.replaceEachVariable(clone, opt.names[1], opt.path, key);
						Global.binder.bind(clone, opt.container);

						opt.element.appendChild(clone);
					}
				}

			});
		});
	},

	value (opt) {
		Global.batcher.read(function () {

			var type = opt.element.type;
			var name = opt.element.nodeName;
			var attribute, query, multiple;
			var i, l, data, element, elements;

			if (opt.setup) {
				opt.setup = false;

				data = Global.model.get(opt.keys);

				if (name === 'SELECT') {
					elements = opt.element.options;
					multiple = opt.element.multiple;
					data = data === undefined ? (multiple ? [] : '') : data;
					for (i = 0, l = elements.length; i < l; i++) {
						if (!elements[i].disabled) {
							if (elements[i].selected) {
								if (multiple) {
									data.push(elements[i].value || elements[i].innerText || '');
								} else {
									data = elements[i].value || elements[i].innerText || '';
									break;
								}
							} else if (i === l-1 && !multiple) {
								data = elements[0].value || elements[0].innerText || '';
							}
						}
					}
				} else if (type === 'radio') {
					data = data === undefined ? 0 : data;
					query = 'input[type="radio"][o-value="' + opt.value + '"]';
					elements = opt.container.querySelectorAll(query);
					for (i = 0, l = elements.length; i < l; i++) {
						element = elements[i];
						if (i === data) {
							element.checked = true;
						} else {
							element.checked = false;
						}
					}
				} else if (type === 'file') {
					data = data === undefined ? [] : data;
					for (i = 0, l = data.length; i < l; i++) {
						opt.element.files[i] = data[i];
					}
				} else if (type === 'checkbox') {
					attribute = 'checked';
					data = data === undefined ? false : data;
				} else {
					attribute = 'value';
					data = data === undefined ? '' : data;
				}

				if (attribute) {
					opt.element[attribute] = Global.binder.modifyData(opt, data);
				}

			} else {

				if (name === 'SELECT') {
					multiple = opt.element.multiple;
					elements = opt.element.options;
					data = multiple ? [] : '';
					for (i = 0, l = elements.length; i < l; i++) {
						element = elements[i];
						if (element.selected) {
							if (multiple) {
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
							element.checked = true;
						} else {
							element.checked = false;
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

			}

			if (data !== undefined) {
				Global.model.set(opt.keys, data);
			}

		});
	},

	default (opt) {
		Global.batcher.read(function () {
			var data = Global.model.get(opt.keys);

			if (opt.element[opt.type] === data) {
				return;
			}

			data = Global.binder.modifyData(opt, data);

			Global.batcher.write(function () {
				opt.element[opt.type] = data;
			});
		});
	}

};

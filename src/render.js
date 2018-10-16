import Batcher from './batcher.js';
import Utility from './utility.js';
import Methods from './methods.js';
import Binder from './binder.js';
import Model from './model.js';

// TODO dynamic for list dont handle selected

export default {

	required (opt) {
		return {
			read () {
				this.data = Model.get(opt.keys);

				if (opt.element.required === data) {
					return;
				}

				this.data = Utility.binderModifyData(opt, this,data);
			},
			write () {
				opt.element.required = this.data;
			}
		};
	},

	disable (opt) {
		Batcher.read(function () {
			let data = Model.get(opt.keys);

			if (opt.element.disabled === data) {
				return;
			}

			data = Binder.piper(opt, data);

			Batcher.write(function () {
				opt.element.disabled = data;
			});
		});
	},

	enable (opt) {
		Batcher.read(function () {
			let data = Model.get(opt.keys);

			if (opt.element.disabled === !data) {
				return;
			}

			data = Binder.piper(opt, data);

			Batcher.write(function () {
				opt.element.disabled = !data;
			});
		});
	},

	hide (opt) {
		Batcher.read(function () {
			let data = Model.get(opt.keys);

			if (opt.element.hidden === data) {
				return;
			}

			data = Binder.piper(opt, data);

			Batcher.write(function () {
				opt.element.hidden = data;
			});
		});
	},

	show (opt) {
		Batcher.read(function () {
			let data = Model.get(opt.keys);

			if (opt.element.hidden === !data) {
				return;
			}

			data = Binder.piper(opt, data);

			Batcher.write(function () {
				opt.element.hidden = !data;
			});
		});
	},

	read (opt) {
		Batcher.read(function () {
			let data = Model.get(opt.keys);

			if (opt.element.readOnly === data) {
				return;
			}

			data = Binder.piper(opt, data);

			Batcher.write(function () {
				opt.element.readOnly = data;
			});
		});
	},

	write (opt) {
		Batcher.read(function () {
			let data = Model.get(opt.keys);

			if (opt.element.readOnly === !data) {
				return;
			}

			data = Binder.piper(opt, data);

			Batcher.write(function () {
				opt.element.readOnly = !data;
			});
		});
	},

	html (opt) {
		Batcher.read(function () {
			let data = Model.get(opt.keys);

			if (opt.element.innerHTML === data) {
				return;
			}

			data = Binder.piper(opt, data);

			Batcher.write(function () {
				opt.element.innerHTML = data;
			});
		});
	},

	class (opt) {
		Batcher.write(function () {
			let data = Model.get(opt.keys);
			let name = opt.names.slice(1).join('-');
			data = Binder.piper(opt, data);
			opt.element.classList.toggle(name, data);
		});
	},

	on (opt) {
		Batcher.write(function () {
			const data = Methods.get(opt.keys);

			if (typeof data !== 'function') return;

			if (opt.cache) {
				opt.element.removeEventListener(opt.names[1], opt.cache);
			} else {
				opt.cache = function (e) {
					const parameters = [e];

					for (let i = 0, l = opt.pipes.length; i < l; i++) {
						const keys = opt.pipes[i].split('.');
						keys.unshift(opt.scope);
						const parameter = Oxe.model.get(keys);
						parameters.push(parameter);
					}

					Promise.resolve()
					.then(data.bind(opt.container).apply(null, parameters))
					.catch(console.error);
				};
			}

			opt.element.addEventListener(opt.names[1], opt.cache);

		});
	},

	css (opt) {
		Batcher.read(function () {
			let data = Model.get(opt.keys);

			if (opt.element.style.cssText === data) {
				return;
			}

			if (opt.names.length > 1) {
				data = opt.names.slice(1).join('-') + ': ' +  data + ';';
			}

			data = Binder.piper(opt, data);

			Batcher.write(function () {
				opt.element.style.cssText = data;
			});
		});
	},

	text (opt) {
		return {
			read () {
				this.data = Model.get(opt.keys);

				if (this.data === undefined || this.data === null) {
					this.data = '';
				} else if (this.data && typeof this.data === 'object') {
					this.data = JSON.stringify(this.data);
				} else if (this.data && typeof this.data !== 'string') {
					this.data = String(this.data);
				}

				this.data = Binder.piper(opt, this.data);
			},
			write () {
				opt.element.innerText = this.data;
			}
		};
	},

	te: 0,

	each (opt) {
		const self = this;

		if (opt.pending) return;
		else opt.pending = true;

		self.te++;

		if (!opt.cache) opt.cache = opt.element.removeChild(opt.element.firstElementChild);

		return {
			read () {

				this.data = Model.get(opt.keys);

				if (!this.data || typeof this.data !== 'object') {
					opt.pending = false;
					this.continue = false;
					return;
				}

				const length = opt.element.children.length;
				const isArray = this.data.constructor === Array;
				const isObject = this.data.constructor === Object;

				this.data = Binder.piper(opt, this.data);

				const keys = isObject ? Object.keys(this.data) : [];

				if (isArray) {
					if (length === this.data.length) {
						opt.pending = false;
						this.continue = false;
						return;
					} else {
						this.key = length;
					}
				}

				if (isObject) {
					if (length === keys.length) {
						opt.pending = false;
						this.continue = false;
						return;
					} else {
						this.key = keys[length];
					}
				}

				this.element = length > this.data.length ? opt.element.lastElementChild : null;
			},
			write () {

				if (this.element) {
					opt.element.removeChild(this.element);
				} else {
					const clone = opt.cache.cloneNode(true);
					Utility.replaceEachVariable(clone, opt.names[1], opt.path, this.key);
					Binder.bind(clone, opt.container);
					opt.element.appendChild(clone);
				}

				/*
					check if select element with o-value
					perform a re-render of the o-value
					becuase of o-each is async
				*/
				if (
					opt.element.nodeName === 'SELECT' &&
					opt.element.attributes['o-value'] ||
					opt.element.attributes['data-o-value']
				) {
					const name = opt.element.attributes['o-value'] || opt.element.attributes['data-o-value'];
					const value = opt.element.attributes['o-value'].value || opt.element.attributes['data-o-value'].value;
					const keys = [opt.scope].concat(value.split('|')[0].split('.'));
					self.value({
						keys: keys,
						name: name,
						value: value,
						scope: opt.scope,
						element: opt.element,
						container: opt.container,
					});
				}

				opt.pending = false;
				self.default(opt);
			}
		};
	},

	value (opt) {
		return {
			read () {

				const type = opt.element.type;
				const name = opt.element.nodeName;
				const current = Model.get(opt.keys);

				this.data = Model.get(opt.keys);

				if (name === 'SELECT') {
					const elements = opt.element.options;
					const multiple = opt.element.multiple;

					let selected = false;

					if (multiple && this.data.constructor !== Array) {
						throw new Error(`Oxe - invalid multiple select value type ${opt.keys.join('.')} array required`);
					}

					// NOTE might need to handle disable
					for (var i = 0, l = elements.length; i < l; i++) {
						const value = this.data && this.data.constructor === Array ? this.data[i] : this.data;

						if (value && elements[i].value === value) {
							elements[i].setAttribute('selected', '');
							elements[i].value = value;
							selected = true;
						} else {
							elements[i].removeAttribute('selected');
						}

					}

					if (elements.length && !multiple && !selected) {
						const value = this.data && this.data.constructor === Array ? this.data[0] : this.data;

						elements[0].setAttribute('selected', '');

						if (value !== (elements[0].value || '')) {
							Model.set(opt.keys, elements[0].value || '');
						}

					}

				} else if (type === 'radio') {
					const query = 'input[type="radio"][o-value="' + opt.value + '"]';
					const elements = opt.container.querySelectorAll(query);

					let checked = false;

					for (let i = 0, l = elements.length; i < l; i++) {
						const element = elements[i];

						if (i === this.data) {
							checked = true;
							element.checked = true;
						} else {
							element.checked = false;
						}

					}

					if (!checked) {
						elements[0].checked = true;
						if (this.data !== 0) {
							Model.set(opt.keys, 0);
						}
					}

				} else if (type === 'file') {
					this.data = this.data || [];

					for (let i = 0, l = this.data.length; i < l; i++) {

						if (this.data[i] !== opt.element.files[i]) {

							if (this.data[i]) {
								opt.element.files[i] = this.data[i];
							} else {
								console.warn('Oxe - file remove not implemented');
							}

						}

					}

				} else if (type === 'checkbox') {
					opt.element.checked = this.data === undefined ? false : this.data;

					if (this.data !== opt.element.checked) {
						Model.set(opt.keys, this.data === undefined ? false : this.data);
					}

				} else {
					opt.element.value = this.data === undefined ? '' : this.data;

					if (this.data !== opt.element.value) {
						Model.set(opt.keys, this.data === undefined ? '' : this.data);
					}

				}
			}
		};
	},

	default (opt) {
		if (opt.type in this) {
			const render = this[opt.type](opt);
			if (render) {
				render.context = render.context || {};
				Batcher.batch(render);
			}
		} else {
			let data;
			Batcher.batch({
				read () {
					data = Model.get(opt.keys);

					if (opt.element[opt.type] === data) {
						return;
					}

					data = Binder.piper(opt, data);
				},
				write () {
					opt.element[opt.type] = data;
				}
			});
		}
	}

}

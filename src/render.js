import Batcher from './batcher.js';
import Utility from './utility.js';
import Methods from './methods.js';
import Binder from './binder.js';
import Model from './model.js';

// TODO dynamic for list dont handle selected

export default {

	required (opt) {
		Batcher.read(function () {
			let data = Model.get(opt.keys);

			if (opt.element.required === data) {
				return;
			}

			data = Utility.binderModifyData(opt, data);

			Batcher.write(function () {
				opt.element.required = data;
			});
		});
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
		Batcher.read(function () {
			let data = Model.get(opt.keys);

			if (data === undefined || data === null) {
				data = '';
			} else if (data && typeof data === 'object') {
				data = JSON.stringify(data);
			} else if (data && typeof data !== 'string') {
				data = String(data);
			}

			data = Binder.piper(opt, data);

			Batcher.write(function () {
				opt.element.innerText = data;
			});
		});
	},

	each (opt) {
		const self = this;

		if (opt.pending) return;
		else opt.pending = true;

		if (!opt.cache) opt.cache = opt.element.removeChild(opt.element.firstElementChild);

		Batcher.read(function () {

			let data = Model.get(opt.keys);

			if (!data || typeof data !== 'object') {
			 	opt.pending = false;
				return;
			}

			const length = opt.element.children.length;
			const isArray = data.constructor === Array;
			const isObject = data.constructor === Object;

			data = Binder.piper(opt, data);

			let key;
			const keys = isObject ? Object.keys(data) : [];

			if (isArray) {
				if (length === data.length) {
					opt.pending = false;
					return;
				} else {
					key = length;
				}
			}

			if (isObject) {
				if (length === keys.length) {
					opt.pending = false;
					return;
				} else {
					key = keys[length];
				}
			}

			const element = length > data.length ? opt.element.lastElementChild : null;
			const clone = opt.cache.cloneNode(true);
			// console.log(data.length);
			// console.log(length);
			// console.log(key);

			Utility.replaceEachVariable(clone, opt.names[1], opt.path, key);
			Binder.bind(clone, opt.container);

			Batcher.write(function () {

				if (element) opt.element.removeChild(element);
				else opt.element.appendChild(clone);

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
				self.each(opt);
			});

			// const done = function () {
			// 	/*
			// 		check if select element with o-value
			// 		perform a re-render of the o-value
			// 		becuase of o-each is async
			// 	*/
			// 	if (
			// 		opt.element.nodeName === 'SELECT' &&
			// 		opt.element.attributes['o-value'] ||
			// 		opt.element.attributes['data-o-value']
			// 	) {
			// 		const name = opt.element.attributes['o-value'] || opt.element.attributes['data-o-value'];
			// 		const value = opt.element.attributes['o-value'].value || opt.element.attributes['data-o-value'].value;
			// 		const keys = [opt.scope].concat(value.split('|')[0].split('.'));
			// 		self.value({
			// 			keys: keys,
			// 			name: name,
			// 			value: value,
			// 			scope: opt.scope,
			// 			element: opt.element,
			// 			container: opt.container,
			// 		});
			// 	}
			//
			// 	opt.pending = false;
			// 	self.each(opt);
			// };
			//
			// if (opt.element.children.length > data.length) {
			// 	return Batcher.write(function () {
			// 		opt.element.removeChild(opt.element.children[opt.element.children.length-1]);
			// 		done();
			// 	});
			// }
			//
			// if (opt.element.children.length < data.length) {
			// 	return Batcher.write(function () {
			// 		opt.element.appendChild(clone);
			// 		done();
			// 	});
			// }

		});
	},

	value (opt) {
		Batcher.read(function () {
			const type = opt.element.type;
			const name = opt.element.nodeName;
			const current = Model.get(opt.keys);

			let data = Model.get(opt.keys);

			if (name === 'SELECT') {
				const elements = opt.element.options;
				const multiple = opt.element.multiple;

				let selected = false;

				if (multiple && data.constructor !== Array) {
					throw new Error(`Oxe - invalid multiple select value type ${opt.keys.join('.')} array required`);
				}

				// NOTE might need to handle disable
				for (var i = 0, l = elements.length; i < l; i++) {
					const value = data && data.constructor === Array ? data[i] : data;

					if (value && elements[i].value === value) {
						elements[i].setAttribute('selected', '');
						elements[i].value = value;
						selected = true;
					} else {
						elements[i].removeAttribute('selected');
					}

				}

				if (elements.length && !multiple && !selected) {
					const value = data && data.constructor === Array ? data[0] : data;

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

					if (i === data) {
						checked = true;
						element.checked = true;
					} else {
						element.checked = false;
					}

				}

				if (!checked) {
					elements[0].checked = true;
					if (data !== 0) {
						Model.set(opt.keys, 0);
					}
				}

			} else if (type === 'file') {
				data = data || [];

				for (let i = 0, l = data.length; i < l; i++) {

					if (data[i] !== opt.element.files[i]) {

						if (data[i]) {
							opt.element.files[i] = data[i];
						} else {
							console.warn('Oxe - file remove not implemented');
						}

					}

				}

			} else if (type === 'checkbox') {
				opt.element.checked = data === undefined ? false : data;

				if (data !== opt.element.checked) {
					Model.set(opt.keys, data === undefined ? false : data);
				}

			} else {
				opt.element.value = data === undefined ? '' : data;

				if (data !== opt.element.value) {
					Model.set(opt.keys, data === undefined ? '' : data);
				}

			}

		});
	},

	default (opt) {
		if (opt.type in this) {
			this[opt.type](opt);
		} else {
			Batcher.read(function () {
				let data = Model.get(opt.keys);

				if (opt.element[opt.type] === data) {
					return;
				}

				data = Binder.piper(opt, data);

				Batcher.write(function () {
					opt.element[opt.type] = data;
				});
			});
		}
	}

}

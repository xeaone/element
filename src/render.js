import ValueDefault from './value/default.js';
import ValueSelect from './value/select.js';
import Each from './attribute/each.js';
import Batcher from './batcher.js';
import Utility from './utility.js';
import Methods from './methods.js';
import Binder from './binder.js';
import Model from './model.js';

// TODO dynamic for list dont handle selected

export default {

	each: Each,

	required (binder) {
		return {
			read () {
				this.data = Model.get(binder.keys);

				if (binder.element.required === data) {
					return;
				}

				this.data = Utility.binderModifyData(binder, this,data);
			},
			write () {
				binder.element.required = this.data;
			}
		};
	},

	disable (binder) {
		Batcher.read(function () {
			let data = Model.get(binder.keys);

			if (binder.element.disabled === data) {
				return;
			}

			data = Binder.piper(binder, data);

			Batcher.write(function () {
				binder.element.disabled = data;
			});
		});
	},

	enable (binder) {
		Batcher.read(function () {
			let data = Model.get(binder.keys);

			if (binder.element.disabled === !data) {
				return;
			}

			data = Binder.piper(binder, data);

			Batcher.write(function () {
				binder.element.disabled = !data;
			});
		});
	},

	hide (binder) {
		Batcher.read(function () {
			let data = Model.get(binder.keys);

			if (binder.element.hidden === data) {
				return;
			}

			data = Binder.piper(binder, data);

			Batcher.write(function () {
				binder.element.hidden = data;
			});
		});
	},

	show (binder) {
		Batcher.read(function () {
			let data = Model.get(binder.keys);

			if (binder.element.hidden === !data) {
				return;
			}

			data = Binder.piper(binder, data);

			Batcher.write(function () {
				binder.element.hidden = !data;
			});
		});
	},

	read (binder) {
		Batcher.read(function () {
			let data = Model.get(binder.keys);

			if (binder.element.readOnly === data) {
				return;
			}

			data = Binder.piper(binder, data);

			Batcher.write(function () {
				binder.element.readOnly = data;
			});
		});
	},

	write (binder) {
		Batcher.read(function () {
			let data = Model.get(binder.keys);

			if (binder.element.readOnly === !data) {
				return;
			}

			data = Binder.piper(binder, data);

			Batcher.write(function () {
				binder.element.readOnly = !data;
			});
		});
	},

	html (binder) {
		Batcher.read(function () {
			let data = Model.get(binder.keys);

			if (binder.element.innerHTML === data) {
				return;
			}

			data = Binder.piper(binder, data);

			Batcher.write(function () {
				binder.element.innerHTML = data;
			});
		});
	},

	class (binder) {
		Batcher.write(function () {
			let data = Model.get(binder.keys);
			let name = binder.names.slice(1).join('-');
			data = Binder.piper(binder, data);
			binder.element.classList.toggle(name, data);
		});
	},

	on (binder) {
		Batcher.write(function () {
			const data = Methods.get(binder.keys);

			if (typeof data !== 'function') return;

			if (binder.cache) {
				binder.element.removeEventListener(binder.names[1], binder.cache);
			} else {
				binder.cache = function (e) {
					const parameters = [e];

					for (let i = 0, l = binder.pipes.length; i < l; i++) {
						const keys = binder.pipes[i].split('.');
						keys.unshift(binder.scope);
						const parameter = Oxe.model.get(keys);
						parameters.push(parameter);
					}

					Promise.resolve()
					.then(data.bind(binder.container).apply(null, parameters))
					.catch(console.error);
				};
			}

			binder.element.addEventListener(binder.names[1], binder.cache);

		});
	},

	css (binder) {
		Batcher.read(function () {
			let data = Model.get(binder.keys);

			if (binder.element.style.cssText === data) {
				return;
			}

			if (binder.names.length > 1) {
				data = binder.names.slice(1).join('-') + ': ' +  data + ';';
			}

			data = Binder.piper(binder, data);

			Batcher.write(function () {
				binder.element.style.cssText = data;
			});
		});
	},

	text (binder) {
		return {
			read () {
				this.data = Model.get(binder.keys);

				if (this.data === undefined || this.data === null) {
					this.data = '';
				} else if (this.data && typeof this.data === 'object') {
					this.data = JSON.stringify(this.data);
				} else if (this.data && typeof this.data !== 'string') {
					this.data = String(this.data);
				}

				this.data = Binder.piper(binder, this.data);
			},
			write () {
				binder.element.innerText = this.data;
			}
		};
	},

	value (binder) {
		return {
			read () {
				const type = binder.element.type;
				const name = binder.element.nodeName;

				if (name === 'SELECT') {
					return ValueSelect.call(this, binder);
				} else if (type === 'radio') {
					const query = 'input[type="radio"][o-value="' + binder.value + '"]';
					const elements = binder.container.querySelectorAll(query);

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
							Model.set(binder.keys, 0);
						}
					}

				} else if (type === 'file') {
					this.data = this.data || [];

					for (let i = 0, l = this.data.length; i < l; i++) {

						if (this.data[i] !== binder.element.files[i]) {

							if (this.data[i]) {
								binder.element.files[i] = this.data[i];
							} else {
								console.warn('Oxe - file remove not implemented');
							}

						}

					}

				} else if (type === 'checkbox') {
					binder.element.checked = this.data === undefined ? false : this.data;

					if (this.data !== binder.element.checked) {
						Model.set(binder.keys, this.data === undefined ? false : this.data);
					}

				} else {
					return ValueDefault.call(this, binder);
				}
			}
		};
	},

	default (binder) {
		if (binder.type in this) {
			const render = this[binder.type](binder);
			if (render) {
				render.context = render.context || {};
				Batcher.batch(render);
			}
		} else {
			let data;
			Batcher.batch({
				read () {
					data = Model.get(binder.keys);

					if (binder.element[binder.type] === data) {
						return;
					}

					data = Binder.piper(binder, data);
				},
				write () {
					binder.element[binder.type] = data;
				}
			});
		}
	}

}

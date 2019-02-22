
Oxe.component.define({
	name: 'o-options',
	template: /*html*/`
		<slot></slot>
	`
});

Oxe.component.define({
	name: 'o-option',
	properties: {
		selected: {
			enumerable: true,
			get: function () {
				return this.hasAttribute('selected');
			},
			set: function (data) {
				data = data ? true : false;

				if (data) {
					this.setAttribute('selected', '');
				} else {
					this.removeAttribute('selected');
				}

				return data;
			}
		}
	},
	created: function () {
		var self = this;
	},
	template: /*html*/`
		<slot></slot>
	`
});

export default {
	name: 'o-select',
	model: [],
	properties: {
		options: {
			enumerable: true,
			get: function () {
				return this.querySelectorAll('o-option');
			}
		},
		multiple: {
			enumerable: true,
			get: function () {
				return this.hasAttribute('multiple');
			},
			set: function (data) {
				data = data ? true : false;

				if (data) {
					this.setAttribute('multiple', '');
				} else {
					this.removeAttribute('multiple');
				}

				return data;
			}
		}
	},
	created: function () {
		var self = this;

		self.addEventListener('click', function (e) {
			var target = e.target;

			if (target.nodeName !== 'O-OPTION') {
				while (target = target.parentElement) {
					if (target === self) {
						return;
					} else if (target.nodeName === 'O-OPTION') {
						break;
					}
				}
			}

			var options = self.options;
			var selected = target.hasAttribute('selected');
			// var index;

			if (!self.multiple) {
				for (var i = 0, l = options.length; i < l; i++) {
					options[i].selected = false;
					options[i].removeAttribute('selected');
				}
			}

			if (selected) {
				target.selected = false;
				target.removeAttribute('selected');
			} else {
				target.selected = true;
				target.setAttribute('selected', '');
			}

			// var binder = Oxe.binder.elements.get(self).get('value');
			// Oxe.render.default(binder);

			const value = Oxe.utility.value(self);
			Oxe.render.default(binder);

		});

	},
	template: /*html*/`
		<slot></slot>
	`
}

var Model = require('./model');
var View = require('./view');

function Binder () {}

Binder.prototype.create = function (options, callback) {
	var self = this;

	Object.defineProperties(self, {
		name: {
			value: options.name
		},
		modifiers: {
			value: options.modifiers || {}
		},
		_view: {
			value: View()
		},
		_model: {
			value: Model()
		},
		view: {
			enumerable: true,
			get: function () {
				return self._view.data;
			}
		},
		model: {
			enumerable: true,
			get: function () {
				return self._model.data;
			}
		},
		elements: {
			get: function () {
				return (options.view.shadowRoot || options.view).querySelectorAll('*');
			}
		}
	});

	self._model.on('*', function (path, value) {
		// console.log(path);
		// console.log(value);
		// console.log('\n');

		if (value === undefined) {
			self._view.removeAll('^' + path + '.*');
		} else {
			self._view.renderAll(path);
		}

	});

	self._view.setup({
		elements: (options.view.shadowRoot || options.view).querySelectorAll('*'),
		getter: function () {
			this._data = self._model.get(this.attribute.path);

			this.attribute.modifiers.forEach(function (modifier) {
				this._data = self.modifiers[modifier].call(this._data);
			}, this);

			return this._data;
		},
		setter: function (value) {
			this._data = self._model.set(this.attribute.path, value);
		}
	});

	self._model.setup(options.model || {});

	if (callback) callback.call(self);

	return self;
};

module.exports = function (options, callback) {
	return new Binder().create(options, callback);
};

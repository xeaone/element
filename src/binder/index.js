var Global = require('../global');
var Model = require('./model');
var View = require('./view');
var Unit = require('./unit');

function Binder () {}

Binder.prototype.parseModifiers = function (value) {
	var self = this;

	if (value.indexOf('|') === -1) return [];

	var modifiers = value.replace(Global.rModifier, '').split(' ');

	return modifiers.map(function (modifier) {
		return self.modifiers[modifier];
	});
};

Binder.prototype.createView = function (elements) {
	var self = this;

	return View(elements, function (element, attribute) {
		return Unit({
			controller: self,
			element: element,
			attribute: attribute,
			modifiers: self.parseModifiers(attribute.value)
		});
	});
};

Binder.prototype.createModel = function (collection) {
	var self = this;

	return Model(collection, function (key, value) {
		self.view[key].forEach(function (unit) {
			unit.value = value;
			unit.render();
		});
	});
};

Binder.prototype.create = function (options, callback) {
	var self = this;

	Object.defineProperties(self, {
		name: {
			enumerable: true,
			value: options.name
		},
		modifiers: {
			enumerable: true,
			value: options.modifiers || {}
		},
		_view: {
			get: function () {
				return (options.view.shadowRoot || options.view).querySelectorAll('*');
			}
		},
		_model: {
			value: options.model || {}
		}
	});

	Object.defineProperty(self, 'view', {
		enumerable: true,
		value: self.createView(self._view)
	});

	Object.defineProperty(self, 'model', {
		enumerable: true,
		value: self.createModel(self._model)
	});

	if (callback) callback.call(self);

	return self;
};

module.exports = function (options, callback) {
	return new Binder().create(options, callback);
};

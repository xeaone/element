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

Binder.prototype.create = function (data, callback) {
	var self = this;

	self.name = data.name;
	self.scope = data.scope.shadowRoot || data.scope;

	self.model = data.model || {};
	self.modifiers = data.modifiers || {};
	self.view = data.view || self.scope.querySelectorAll('*');

	self.view = self.createView(self.view);
	self.model = self.createModel(self.model);

	if (callback) callback.call(self);

	return self;
};

module.exports = function (options, callback) {
	return new Binder().create(options, callback);
};

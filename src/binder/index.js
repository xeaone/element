var Model = require('./model');
var View = require('./view');
var Unit = require('./unit');

function Binder () {}

Binder.prototype.parseModifiers = function (value) {
	var self = this;

	if (value.indexOf('|') === -1) return [];

	var modifiers = value.replace(self.rModifier, '').split(' ');

	return modifiers.map(function (modifier) {
		return self.modifiers[modifier];
	});
};

Binder.prototype.createView = function (elements) {
	var self = this;

	return View(elements || self.elements, self.rRejects, self.rAccepts, function (element, attribute) {
		return Unit({
			controller: self,
			element: element,
			attribute: attribute,
			modifiers: self.parseModifiers(attribute.value)
		});
	});
};

Binder.prototype.createModel = function () {
	var self = this;

	return Model(self.model, function (key, value) {
		self.view[key].forEach(function (unit) {
			unit.value = value;
			unit.render();
		});
	});
};

Binder.prototype.create = function (data, callback) {
	var self = this;

	self.name = data.name;
	self.scope = data.scope;
	self.elements = self.scope.getElementsByTagName('*');

	self.view = data.view || {};
	self.model = data.model || {};
	self.modifiers = data.modifiers || {};

	self.prefix = '(data-)?j-';
	self.sPrefix = self.prefix;
	self.sValue = self.prefix + 'value';
	self.sFor = self.prefix + 'for-(.*?)=';

	self.sAccepts = self.prefix;
	self.sRejects = self.prefix + '^\w+(-\w+)+|^iframe|^object|^script';

	self.rPath = /(\s)?\|(.*?)$/;
	self.rModifier = /^(.*?)\|(\s)?/;

	self.rFor = new RegExp(self.sFor);
	self.rPrefix = new RegExp(self.sPrefix);
	self.rAccepts = new RegExp(self.sAccepts);
	self.rRejects = new RegExp(self.sRejects);

	self.view = self.createView();
	self.model = self.createModel();

	self.model.text = 'new stuff is rendered';

	if (callback) callback.call(self);
};

module.exports = function (data, callback) {
	return new Binder().create(data, callback);
};

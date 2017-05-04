var Renders = require('./renders');

function Unit () {}

Unit.prototype.renders = Renders;

Unit.prototype.bindChildren = function () {
	var self = this;

	self.binder._view.set(self.element.getElementsByTagName('*'), function (unit) {
		unit.binder = self.binder;
		unit.data = self.binder._model.get(unit.attribute.path);
		unit.render();
		return unit;
	});

	return self;
};

Unit.prototype.unrender = function () {
	var self = this;
	self.element.parentNode.removeChild(self.element);
	return self;
};

Unit.prototype.render = function () {
	var self = this;
	self.data = self.binder._model.get(self.attribute.path);
	self.renders[self.renderName].call(self);
	return self;
};

Unit.prototype.create = function (options) {
	var self = this;

	self.attribute = options.attribute;
	self.element = options.element;
	self.binder = options.binder;

	self.isChangeEventAdded = false;
	self.isChanging = false;
	self.isNew = true;
	self.listeners = {};

	self.renderName = options.renderName || self.attribute.cmds[0] in self.renders ? self.attribute.cmds[0] : 'default';

	self._data, self.clone;

	Object.defineProperty(self, 'data', {
		configurable: true,
		enumerable: true,
		get: function () {

			// if (self._data === undefined) {
			// 	self._data = self.binder._model.get(self.attribute.path);
			// }

			if (self.binder.modifiers && self.attribute.modifiers) {
				self.attribute.modifiers.forEach(function (modifier) {
					self._data = self.binder.modifiers[modifier].call(self._data);
				});
			}

			return self._data;
		},
		set: function (value) {
			self._data = value;
		}
	});

	return self;
};

module.exports = function (options) {
	return new Unit().create(options);
};

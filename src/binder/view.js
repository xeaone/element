var Collection = require('../collection');
var Global = require('../global');

var PATH = Global.rPath;
var PREFIX = Global.rPrefix;
var MODIFIERS = Global.rModifier;
var ATTRIBUTE_ACCEPTS = Global.rAttributeAccepts;
var ELEMENT_ACCEPTS = Global.rElementAccepts;
var ELEMENT_REJECTS = Global.rElementRejects;
var ELEMENT_REJECTS_CHILDREN = Global.rElementRejectsChildren;

function View () {}

View.prototype.preview = function (element) {
	return element.outerHTML
	.replace(/\/?>([\s\S])*/, '')
	.replace(/^</, '');
};

View.prototype.eachElement = function (elements, callback) {
	for (var i = 0; i < elements.length; i++) {
		var element = elements[i];
		var preview = this.preview(element);

		if (ELEMENT_REJECTS.test(preview)) {
			i += element.querySelectorAll('*').length;
		} else if (ELEMENT_REJECTS_CHILDREN.test(preview)) {
			i += element.querySelectorAll('*').length;
			callback.call(this, element);
		} else if (ELEMENT_ACCEPTS.test(preview)) {
			callback.call(this, element);
		}
	}
};

View.prototype.eachAttribute = function (element, callback) {
	Array.prototype.forEach.call(element.attributes, function (ea) {
		if (ATTRIBUTE_ACCEPTS.test(ea.name)) {
			var attribute = {};
			attribute.name = ea.name;
			attribute.value = ea.value;
			attribute.path = attribute.value.replace(PATH, '');
			attribute.opts = attribute.path.split('.');
			attribute.command = attribute.name.replace(PREFIX, '');
			attribute.cmds = attribute.command.split('-');
			attribute.key = attribute.opts.slice(-1);
			attribute.modifiers = attribute.value.indexOf('|') === -1 ? [] : attribute.value.replace(MODIFIERS, '').split(' ');
			callback.call(this, attribute);
		}
	}, this);
};

View.prototype.unrenderAll = function (pattern) {
	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

	this.data.forEach(function (paths, path) {
		paths.forEach(function (unit) {
			if (pattern.test(path)) {
				unit.unrender();
			}
		}, this);
	}, this);
};

View.prototype.renderAll = function (pattern) {
	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

	this.data.forEach(function (paths, path) {
		paths.forEach(function (unit) {
			if (pattern.test(path)) {
				unit.render();
			}
		}, this);
	}, this);
};

View.prototype.removeOne = function (element) {
	this.data.forEach(function (paths) {
		paths.forEach(function (unit, _, id) {
			if (element === unit.element) {
				paths.removeById(id);
			}
		}, this);
	}, this);
};

View.prototype.removeAll = function (elements) {
	Array.prototype.forEach.call(elements, function (element) {
		this.removeOne(element);
	}, this);
};

View.prototype.addOne = function (element) {
	var self = this;

	self.eachAttribute(element, function (attribute) {

		if (!self.data.has(attribute.path)) {
			self.data.set(attribute.path, new Collection());
		}

		self.emit(element, attribute);
	});
};

View.prototype.addAll = function (elements) {
	this.eachElement(elements, function (element) {
		this.addOne(element);
	});
};

View.prototype.setup = function (elements, callback) {
	this.elements = elements;
	this.emit = callback;
	this.addAll(this.elements);
	return this;
};

View.prototype.create = function () {
	this.data = new Collection();
	return this;
};

module.exports = function () {
	return new View().create();
};

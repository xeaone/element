var Attributes = require('./attributes');
var Global = require('../global');
var Unit = require('./unit');

var PATH = Global.rPath;
var PREFIX = Global.rPrefix;
var MODIFIERS = Global.rModifier;
var ATTRIBUTE_ACCEPTS = Global.rAttributeAccepts;
var ELEMENT_ACCEPTS = Global.rElementAccepts;
var ELEMENT_REJECTS = Global.rElementRejects;
var ELEMENT_REJECTS_CHILDREN = Global.rElementRejectsChildren;

function View () {}

View.prototype.glance = function (element) {
	return element.outerHTML
	.replace(/\/?>([\s\S])*/, '')
	.replace(/^</, '');
};

View.prototype.eachElement = function (elements, callback) {
	var element, glance;

	for (var i = 0; i < elements.length; i++) {
		element = elements[i];
		glance = this.glance(element);

		if (ELEMENT_REJECTS.test(glance)) {
			i += element.querySelectorAll('*').length;
		} else if (ELEMENT_REJECTS_CHILDREN.test(glance)) {
			i += element.querySelectorAll('*').length;
			callback(element);
		} else if (ELEMENT_ACCEPTS.test(glance)) {
			callback(element);
		}
	}
};

View.prototype.eachAttribute = function (element, callback) {
	var attributes = element.attributes, attribute;

	for (var i = 0; i < attributes.length; i++) {
		attribute = {};
		attribute.name = attributes[i].name;
		attribute.value = attributes[i].value;

		if (ATTRIBUTE_ACCEPTS.test(attribute.name)) {
			attribute.path = attribute.value.replace(PATH, '');
			attribute.opts = attribute.path.split('.');
			attribute.command = attribute.name.replace(PREFIX, '');
			attribute.cmds = attribute.command.split('-');

			if (attribute.value.indexOf('|') === -1) {
				attribute.modifiers = [];
			} else {
				attribute.modifiers = attribute.value.replace(MODIFIERS, '').split(' ');
			}

			callback(attribute);
		}

	}
};

View.prototype.removeAll = function (pattern) {
	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

	Object.keys(this.data).forEach(function (path) {
		this.data[path].forEach(function (_, index) {
			if (pattern.test(path + '.' + index)) {
				this.data[path][index].unrender();
				this.data[path].splice(index, 1);
			}
		}, this);
	}, this);
};

// View.prototype.removeOne = function (pattern) {
// 	var self = this, path, index, length;
//
// 	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
//
// 	for (path in self.data) {
// 		index = 0, length = self.data[path].length;
// 		for (index; index < length; index++) {
// 			if (pattern.test(path + '.' + index.toString())) {
// 				self.data[path].slice(index, 1);
// 				break;
// 			}
// 		}
// 	}
// };

View.prototype.renderAll = function (path) {
	(this.data[path] || []).forEach(function (unit) {
		unit.render();
	}, this);
};

View.prototype.add = function (elements, render) {
	var self = this, unit;

	self.eachElement(elements, function (element) {
		self.eachAttribute(element, function (attribute) {

			if (!(attribute.path in self.data)) self.data[attribute.path] = [];

			unit = Unit({
				view: self,
				element: element,
				attribute: attribute,
				method: Attributes[attribute.cmds[0]] || Attributes['default'],
				getter: self.getter,
				setter: self.setter
			});

			if (render) unit.render();

			self.data[attribute.path].push(unit);

		});
	});

	return self;
};

View.prototype.setup = function (options) {
	this.setter = options.setter;
	this.getter = options.getter;
	this.data = {};
	this.add(options.elements);
	return self;
};

View.prototype.create = function () {
	return this;
};

module.exports = function () {
	return new View().create();
};

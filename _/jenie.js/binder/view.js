var Events = require('../events');
var Global = require('../global');

var PATH = Global.rPath;
var PREFIX = Global.rPrefix;
var MODIFIERS = Global.rModifier;
var ATTRIBUTE_ACCEPTS = Global.rAttributeAccepts;
var ELEMENT_ACCEPTS = Global.rElementAccepts;
var ELEMENT_REJECTS = Global.rElementRejects;
var ELEMENT_REJECTS_CHILDREN = Global.rElementRejectsChildren;

function View () {}

View.prototype = Object.create(Events.prototype);
View.prototype.constructor = View;

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
			callback.call(this, element);
		} else if (ELEMENT_ACCEPTS.test(glance)) {
			callback.call(this, element);
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
			attribute.key = attribute.opts.slice(-1);

			if (attribute.value.indexOf('|') === -1) {
				attribute.modifiers = [];
			} else {
				attribute.modifiers = attribute.value.replace(MODIFIERS, '').split(' ');
			}

			callback.call(this, attribute);
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

View.prototype.renderAll = function (path, data) {
	(this.data[path] || []).forEach(function (unit) {
		unit.render(data);
	}, this);
};

View.prototype.addOne = function (element) {
	this.eachAttribute(element, function (attribute) {
		if (!(attribute.path in this.data)) this.data[attribute.path] = [];
		this.emit('add', element, attribute);
	});
};

View.prototype.addAll = function (elements) {
	this.eachElement(elements, function (element) {
		this.addOne(element);
	});
};

View.prototype.setup = function (elements) {
	this.addAll(elements);
	return this;
};

View.prototype.create = function () {
	this.data = {};
	this.events = {};
	return this;
};

module.exports = function () {
	return new View().create();
};

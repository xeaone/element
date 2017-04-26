var Global = require('../global');

var PATH = Global.rPath;
var PREFIX = Global.rPrefix;
var ATTRIBUTE_ACCEPTS = Global.rAttributeAccepts;
var ELEMENT_ACCEPTS = Global.rElementAccepts;
var ELEMENT_REJECTS = Global.rElementRejects;

function View () {}

View.prototype.glance = function (element) {
	return element.outerHTML
	.replace(/(\/)?>.*$/, '')
	.replace(/^</, '');
};

View.prototype.eachElement = function (elements, callback) { //skip,
	var element, glance, i;

	for (i = 0; i < elements.length; i++) {
		element = elements[i];
		glance = this.glance(element);

		if (ELEMENT_REJECTS.test(glance)) {
			i += element.children.length;
		// } else if (skip && skip.test(glance)) {
		// 	continue;
		} else if (ELEMENT_ACCEPTS.test(glance)) {
			callback(element);
		}
	}
};

View.prototype.eachAttribute = function (element, callback) {
	var attribute = {}, i;

	for (i = 0; i < element.attributes.length; i++) {
		attribute.name = element.attributes[i].name;
		attribute.value = element.attributes[i].value;
		attribute.path = attribute.value.replace(PATH, '');
		attribute.opts = attribute.path.split('.');
		attribute.command = attribute.name.replace(PREFIX, '');
		attribute.cmds = attribute.command.split('-');

		if (ATTRIBUTE_ACCEPTS.test(attribute.name)) {
			callback(attribute);
		}

	}
};

View.prototype.create = function (elements, callback) {
	var self = this, view = {};

	self.eachElement(elements, function (element) {
		self.eachAttribute(element, function (attribute) {
			if (!(attribute.path in view)) view[attribute.path] = [];
			view[attribute.path].push(callback(element, attribute));
		});
	});

	return view;
};

module.exports = function (elements, callback) {
	return new View().create(elements, callback);
};

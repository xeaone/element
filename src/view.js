import OnceBinder from './once-binder';
import Utility from './utility';
import Binder from './binder';

export default function View (options) {
	this.isRan = false;
	this.setup(options);
}

View.prototype.setup = function (options) {
	options = options || {};
	this.data = options.data || {};
	this.container = options.container || document.body;
};

View.prototype.PATH = /\s?\|(.*?)$/;
View.prototype.PREFIX = /(data-)?j-/;
View.prototype.MODIFIERS = /^(.*?)\|\s?/;
View.prototype.ATTRIBUTE_ACCEPTS = /(data-)?j-/i;
// View.prototype.ELEMENT_SKIPS = /\w+(-\w+)+|iframe|object|script|style|svg/i;

View.prototype.isOnce = function (node) {
	if (!node) return false;
	return node.hasAttribute('j-value') || node.hasAttribute('data-j-value');
};

View.prototype.isSkip = function (node) {
	if (!node) return false;
	return node.nodeName === 'J-VIEW'
		|| node.hasAttribute('j-view')
		|| node.hasAttribute('data-j-view');
};


View.prototype.isSkipChildren = function (node) {
	if (!node) return false;
	var name = node.nodeName;
	// node.uid !== undefined ||
	return name === 'IFRAME'
		|| name === 'OBJECT'
		|| name === 'SCRIPT'
		|| name === 'STYLE'
		|| name === 'SVG';
};

View.prototype.isAccept = function (node) {
	if (!node) return false;
	var attributes = node.attributes;
	for (var i = 0, l = attributes.length; i < l; i++) {
		var attribute = attributes[i];
		if (attribute.name.indexOf('j-') === 0 || attribute.name.indexOf('data-j-') === 0) {
			return true;
		}
	}
	return false;
};

View.prototype.isAcceptAttribute = function (attribute) {
	if (typeof attribute !== 'object') return false;
	return attribute.name.indexOf('j-') === 0 || attribute.name.indexOf('data-j-') === 0;
};

View.prototype.createAttribute = function (name, value) {
	var attribute = {};
	attribute.name = name;
	attribute.value = value;
	attribute.path = attribute.value.replace(this.PATH, '');
	attribute.opts = attribute.path.split('.');
	// attribute.command = attribute.name.replace(this.PREFIX, '');
	// attribute.cmds = attribute.command.split('-');
	attribute.cmds = attribute.name.replace(this.PREFIX, '').split('-');
	attribute.key = attribute.opts.slice(-1);
	attribute.vpath = attribute.cmds[0] === 'each' ? attribute.path + '.length' : attribute.path;
	attribute.modifiers = attribute.value.indexOf('|') === -1 ? [] : attribute.value.replace(this.MODIFIERS, '').split(' ');
	return attribute;
};

View.prototype.eachAttribute = function (attributes, callback) {
	for (var i = 0, l = attributes.length; i < l; i++) {
		var attribute = attributes[i];
		if (this.isAcceptAttribute(attribute)) {
			callback(this.createAttribute(attribute.name, attribute.value));
		}
	}
};

View.prototype.eachElement = function (elements, callback) {
	for (var i = 0; i < elements.length; i++) {
		var element = elements[i];
		if (this.isSkip(element)) {
			continue;
		} else if (this.isSkipChildren(element)) {
			i += element.getElementsByTagName('*').length;
			callback(element);
		} else if (this.isAccept(element)) {
			callback(element);
		}
	}
};

// View.prototype.find = function (uid, pattern, callback) {
// 	pattern = typeof pattern === 'string' ? new RegExp('^' + pattern): pattern;
// 	var paths = this.data[uid];
// 	for (var path in paths) {
// 		if (pattern.test(path)) {
// 			var binders = paths[path];
// 			for (var i = 0, l = binders.length; i < l; i++) {
// 				if (callback(binders[i])) return binders[i];
// 			}
// 		}
// 	}
// };

View.prototype.forEach = function (uid, pattern, callback) {
	pattern = typeof pattern === 'string' ? new RegExp('^' + pattern): pattern;
	var paths = this.data[uid];
	for (var path in paths) {
		if (pattern.test(path)) {
			callback(paths[path], path, paths);
		}
	}
};

View.prototype.has = function (element, uid, path) {
	if (!(uid in this.data)) return false;
	if (!(path in this.data[uid])) return false;
	var binders = this.data[uid][path];
	for (var i = 0, l = binders.length; i < l; i++) {
		if (binders[i].element === element) return true;
	}
	return false;
};

View.prototype.add = function (element, uid, path, container, attribute) {
	if (!(uid in this.data)) this.data[uid] = {};
	if (!(path in this.data[uid])) this.data[uid][path] = [];
	this.data[uid][path].push(new Binder({
		element: element,
		container: container,
		attribute: attribute
	}));
};

View.prototype.addElement = function (element) {
	var container = Utility.getContainer(element);
	var uid = container.uid;
	this.eachAttribute(element.attributes, function (attribute) {
		if (this.isOnce(element)) {
			OnceBinder.bind(element, attribute, container);
		} else {
			// TODO maybe change vpath to path but breaks each
			var path = attribute.vpath;
			if (!this.has(element, uid, path)) {
				this.add(element, uid, path, container, attribute);
			}
		}
	}.bind(this));
};

View.prototype.addElements = function (elements) {
	this.eachElement(elements, function (element) {
		this.addElement(element);
	}.bind(this));
};

// View.prototype.removeElement = function (element) {
// 	var self = this;
// 	var container = Utility.getContainer(element);
// 	var uid = container.uid;
// 	self.eachAttribute(element, function (attribute) {
// 		if (self.isOnceBinder(element)) {
// 			OnceBinder.bind(element, attribute, container);
// 		} else {
// 			var path = attribute.path;
// 			if (!self.has(uid, path, element)) {
// 				self.add(uid, path, new Binder({
// 					element: element,
// 					container: container,
// 					attribute: attribute
// 				}));
// 			}
// 		}
// 	});
// };
//
// View.prototype.removeElements = function (elements) {
// 	var self = this;
// 	self.eachElement(elements, function (element) {
// 		self.removeElement(element);
// 	});
// };

View.prototype.run = function () {
	if (this.isRan) return;
	else this.isRan = true;

	this.addElements(this.container.getElementsByTagName('*'));

	this.observer = new MutationObserver(function (mutations) {
		// TODO prob need to filter attached cached components
		var addedNode, addedNodes, removedNode, removedNodes;
		var i, l, c, s;
		for (i = 0, l = mutations.length; i < l; i++) {
			addedNodes = mutations[i].addedNodes;
			removedNodes = mutations[i].removedNodes;
			for (c = 0, s = addedNodes.length; c < s; c++) {
				addedNode = addedNodes[c];
				if (addedNode.nodeType === 1) {
					this.addElements(addedNode.getElementsByTagName('*'));
					this.addElement(addedNode);
				}
			}
			for (c = 0, s = removedNodes.length; c < s; c++) {
				removedNode = removedNodes[c];
				if (removedNode.nodeType === 1) {
					// TODO need to handle remove
					// this.removeElements(removedNode.getElementsByTagName('*'));
					// this.removeElement(removedNode);
				}
			}
		}
	}.bind(this));
	this.observer.observe(this.container, { childList: true, subtree: true });
};

// function toModel (element, data, path) {
// 	var i, l;
// 	if (element.type === 'checkbox') {
// 		element.value = element.checked;
// 		data = element.checked;
// 	} else if (element.nodeName === 'SELECT' && element.multiple) {
// 		var values = [];
// 		var options = element.options;
// 		for (i = 0, l = options.length; i < l; i++) {
// 			var option = options[i];
// 			if (option.selected) {
// 				values.push(option.value);
// 			}
// 		}
// 		data = values;
// 	} else if (element.type === 'radio') {
// 		var elements = element.parentNode.querySelectorAll('input[type="radio"][j-value="' + path + '"]');
// 		for (i = 0, l = elements.length; i < l; i++) {
// 			var radio = elements[i];
// 			if (radio === element) {
// 				data = i;
// 			} else {
// 				radio.checked = false;
// 			}
// 		}
// 	} else {
// 		data = element.value;
// 	}
// }
//
// View.prototype.inputListener = function (element) {
// 	var value = element.getAttribute('j-value');
// 	if (value) {
// 		var attribute = this.attribute('j-value', value);
// 		var uid = this.getContainer(element).uid;
// 		// var binder = this.find(uid, attribute.path, function (binder) {
// 		// 	return binder.element === element;
// 		// });
// 		// binder.updateModel();
// 	}
// };

// RUN
// self.container.addEventListener('change', function (e) {
// 	if ((e.target.type === 'checkbox' || e.target.type === 'radio') && e.target.nodeName !== 'SELECT') {
// 		self.inputListener.call(self, e.target);
// 	}
// }, true);
//
// self.container.addEventListener('input', function (e) {
// 	self.inputListener.call(self, e.target);
// }, true);

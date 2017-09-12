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
	return this;
};

View.prototype.PATH = /\s?\|.*/;
// View.prototype.PATH = /\s?\|(.*?)$/;
View.prototype.PREFIX = /(data-)?j-/;
View.prototype.MODIFIERS = /^(.*?)\|\s?/;
View.prototype.IS_ACCEPT_PATH = /(data-)?j-value/;
// View.prototype.ATTRIBUTE_ACCEPTS = /(data-)?j-/i;
// View.prototype.ELEMENT_SKIPS = /\w+(-\w+)+|iframe|object|script|style|svg/i;

View.prototype.isOnce = function (node) {
	return node.hasAttribute('j-value')
		|| node.hasAttribute('data-j-value');
};

View.prototype.isSkip = function (node) {
	return node.nodeName === 'J-VIEW'
		|| node.hasAttribute('j-view')
		|| node.hasAttribute('data-j-view');
};


View.prototype.isSkipChildren = function (node) {
	return node.nodeName === 'IFRAME'
		|| node.nodeName === 'OBJECT'
		|| node.nodeName === 'SCRIPT'
		|| node.nodeName === 'STYLE'
		|| node.nodeName === 'SVG';
};

View.prototype.isAccept = function (node) {
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

View.prototype.eachElement = function (element, callback) {
	// for (var i = 0; i < elements.length; i++) {
	// 	var element = elements[i];
	// 	if (this.isSkip(element)) i++;
	// 	if (this.isSkipChildren(element)) i += element.getElementsByTagName('*').length;
	// 	if (this.isAccept(element)) callback(element);
	// }
	if (this.isAccept(element) && !this.isSkip(element)) callback(element);
	if (!this.isSkipChildren(element)) {
		for (element = element.firstElementChild; element; element = element.nextElementSibling) {
			this.eachElement(element, callback);
		}
	}
};

View.prototype.eachBinder = function (uid, path, callback) {
	var paths = this.data[uid];
	for (var key in paths) {
		if (key.indexOf(path) === 0) {
			var binders = paths[key];
			for (var i = 0, l = binders.length; i < l; i++) {
				callback(binders[i], i, binders, paths, key);
			}
		}
	}
};

View.prototype.has = function (uid, path, element) {
	if (!(uid in this.data) || !(path in this.data[uid])) return false;
	var binders = this.data[uid][path];
	for (var i = 0, l = binders.length; i < l; i++) {
		if (binders[i].element === element) return true;
	}
	return false;
};

View.prototype.push = function (uid, path, element, container, attribute) {
	if (!(uid in this.data)) this.data[uid] = {};
	if (!(path in this.data[uid])) this.data[uid][path] = [];
	this.data[uid][path].push(new Binder({
		element: element,
		container: container,
		attribute: attribute
	}));
};

View.prototype.add = function (data) {
	var self = this;
	self.eachElement(data, function (element) {
		var container = Utility.getContainer(element);
		var uid = container.uid;
		self.eachAttribute(element.attributes, function (attribute) {
			if (self.isOnce(element)) {
				OnceBinder.bind(element, attribute, container);
			} else {
				// TODO maybe change vpath to path but breaks each
				var path = attribute.vpath;
				if (!self.has(uid, path, element)) {
					self.push(uid, path, element, container, attribute);
				}
			}
		});
	});
};

View.prototype.eachPath = function (element, callback) {
	var attributes = element.attributes;
	for (var i = 0, l = attributes.length; i < l; i++) {
		var attribute = attributes[i];
		if (this.IS_ACCEPT_PATH.test(attribute.name)) {
			callback(attribute.name.replace(this.PATH, ''));
		}
	}
};

View.prototype.remove = function (data) {
	var self = this;
	var uid = Utility.getContainer(data).uid;

	self.eachElement(data, function (element) {
		self.eachPath(element, function (path) {
			self.eachBinder(uid, path, function (binder, index, binders, paths, key) {
				console.log(binder.element === element);
				if (binder.element === element) {
					binder.unrender();
					binders.splice(index, 1);
					if (binders.length === 0) {
						delete paths[key];
					}
				}
			});
		});
	});
};

View.prototype.handler = function (callback) {
	this._handler = callback;
};

View.prototype.run = function () {
	var self = this;
	if (self.isRan) return;
	else self.isRan = true;

	self.add(self.container);

	self.observer = new MutationObserver(function (mutations) {
		for (var i = 0, l = mutations.length; i < l; i++) {
			self._handler(mutations[i].addedNodes, mutations[i].removedNodes);
		}
	});

	self.observer.observe(this.container, { childList: true, subtree: true });
};

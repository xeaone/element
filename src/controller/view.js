import Collection from '../collection';
import Utility from '../utility';
import Binder from './binder';

export default function View (options) {
	this.controller = options.controller;
	this.data = new Collection();
}

View.prototype.ELEMENT_ACCEPTS = /(data-)?j-/;
View.prototype.ATTRIBUTE_ACCEPTS = /(data-)?j-/;
View.prototype.ELEMENT_REJECTS = /^iframe/;
View.prototype.ELEMENT_REJECTS_CHILDREN = /^\w+(-\w+)+|^object|^script|^style|^svg/;

View.prototype.preview = function (element) {
	var html = element.outerHTML;
	html = html.slice(1, html.indexOf('>'));
	html = html.replace(/\/$/, '');
	return html;
	// return element.outerHTML
	// .replace(/\/?>([\s\S])*/, '')
	// .replace(/^</, '');
};

View.prototype.eachElement = function (elements, callback) {
	var element, preview, i;

	for (i = 0; i < elements.length; i++) {
		element = elements[i];
		preview = this.preview(element);
		if (this.ELEMENT_REJECTS.test(preview)) {
			i += element.getElementsByTagName('*').length;
		} else if (this.ELEMENT_REJECTS_CHILDREN.test(preview)) {
			i += element.getElementsByTagName('*').length;
			callback.call(this, element);
		} else if (this.ELEMENT_ACCEPTS.test(preview)) {
			callback.call(this, element);
		}
	}
};

View.prototype.eachAttribute = function (element, callback) {
	var attribute, i = 0, l = element.attributes.length;
	for (i; i < l; i++) {
		attribute = element.attributes[i];
		if (this.ATTRIBUTE_ACCEPTS.test(attribute.name)) {
			callback.call(this, Utility.attribute(attribute.name, attribute.value));
		}
	}
};

View.prototype.unrenderAll = function (pattern) {
	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
	this.data.forEach(function (paths, path) {
		if (pattern.test(path)) {
			paths.forEach(function (binder) {
				binder.unrender();
			}, this);
		}
	}, this);
};

View.prototype.renderAll = function (pattern) {
	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
	this.data.forEach(function (paths, path) {
		if (pattern.test(path)) {
			paths.forEach(function (binder) {
				binder.render();
			}, this);
		}
	}, this);
};

View.prototype.removeOne = function (element) {
	this.data.forEach(function (paths, _, did) {
		paths.forEach(function (binder, _, pid) {
			if (element === binder.element) {
				paths.removeById(pid);
				if (paths.size() === 0) {
					this.data.removeById(did);
				}
			}
		}, this);
	}, this);
};

View.prototype.removeAll = function (elements) {
	var i = 0, l = elements.length;
	for (i; i < l; i++) {
		this.removeOne(elements[i]);
	}
};

View.prototype.addOne = function (element) {
	var self = this;

	self.eachAttribute(element, function (attribute) {
		if (!self.data.has(attribute.vpath)) {
			self.data.set(attribute.vpath, new Collection());
		}
		self.data.get(attribute.vpath).push(new Binder({
			element: element,
			attribute: attribute,
			controller: self.controller,
		}));
	});
};

View.prototype.addAll = function (elements) {
	var self = this;
	self.eachElement(elements, function (element) {
		self.addOne(element);
	});
};

View.prototype.setListener = function (listener) {
	this.listener = listener;
};

View.prototype.setElement = function (element) {
	this.element = element;
	this.elements = element.getElementsByTagName('*');
};

View.prototype.run = function () {
	var self = this;

	self.addAll(self.elements);

	self.observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if (mutation.addedNodes.length > 0) {
				mutation.addedNodes.forEach(function (node) {
					if (node.nodeType === 1) {
						self.addAll(node.getElementsByTagName('*'));
						self.addOne(node);
					}
				});
			}
		});
	});

	self.observer.observe(self.element, {
		childList: true,
		subtree: true
	});

};

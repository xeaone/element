import Collection from '../collection';
import Utility from '../utility';

export default function View () {
	this.data = new Collection();
}

View.prototype.ELEMENT_ACCEPTS = /(data-)?j-/;
View.prototype.ATTRIBUTE_ACCEPTS = /(data-)?j-/;
View.prototype.ELEMENT_REJECTS_CHILDREN = /(data-)?j-each/;
View.prototype.ELEMENT_REJECTS = /^\w+(-\w+)+|^iframe|^object|^script|^style|^svg/;

View.prototype.preview = function (element) {
	return element.outerHTML
	.replace(/\/?>([\s\S])*/, '')
	.replace(/^</, '');
};

View.prototype.eachElement = function (elements, callback) {
	for (var i = 0, l = elements.length; i < l; i++) {
		var element = elements[i];
		var preview = this.preview(element);

		if (this.ELEMENT_REJECTS.test(preview)) {
			i += element.querySelectorAll('*').length;
		} else if (this.ELEMENT_REJECTS_CHILDREN.test(preview)) {
			i += element.querySelectorAll('*').length;
			callback.call(this, element);
		} else if (this.ELEMENT_ACCEPTS.test(preview)) {
			callback.call(this, element);
		}
	}
};

View.prototype.eachAttribute = function (element, callback) {
	Array.prototype.forEach.call(element.attributes, function (attribute) {
		if (this.ATTRIBUTE_ACCEPTS.test(attribute.name)) {
			callback.call(this, Utility.attribute(attribute.name, attribute.value));
		}
	}, this);
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
	Array.prototype.forEach.call(elements, function (element) {
		this.removeOne(element);
	}, this);
};

View.prototype.addOne = function (element) {
	this.eachAttribute(element, function (attribute) {

		if (!this.data.has(attribute.path)) {
			this.data.set(attribute.path, new Collection());
		}

		this.emit(element, attribute);
	});
};

View.prototype.addAll = function (elements) {
	this.eachElement(elements, function (element) {
		this.addOne(element);
	});
};

View.prototype.listener = function (listener) {
	this.emit = listener;
};

View.prototype.run = function (elements) {
	this.elements = elements;
	this.addAll(this.elements);
};

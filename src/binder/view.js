import Collection from '../collection';

export default function View () {
	this.data = new Collection();
}

View.prototype.regexp = {
	PATH: /\s?\|(.*?)$/,
	PREFIX: /(data-)?j-/,
	MODIFIERS: /^(.*?)\|\s?/,
	ATTRIBUTE_ACCEPTS: /(data-)?j-/,
	ELEMENT_ACCEPTS: /(data-)?j-/,
	ELEMENT_REJECTS_CHILDREN: /(data-)?j-each/,
	ELEMENT_REJECTS: /^\w+(-\w+)+|^iframe|^object|^script/
};

View.prototype.preview = function (element) {
	return element.outerHTML
	.replace(/\/?>([\s\S])*/, '')
	.replace(/^</, '');
};

View.prototype.eachElement = function (elements, callback) {
	for (var i = 0; i < elements.length; i++) {
		var element = elements[i];
		var preview = this.preview(element);

		if (this.regexp.ELEMENT_REJECTS.test(preview)) {
			i += element.querySelectorAll('*').length;
		} else if (this.regexp.ELEMENT_REJECTS_CHILDREN.test(preview)) {
			i += element.querySelectorAll('*').length;
			callback.call(this, element);
		} else if (this.regexp.ELEMENT_ACCEPTS.test(preview)) {
			callback.call(this, element);
		}
	}
};

View.prototype.eachAttribute = function (element, callback) {
	Array.prototype.forEach.call(element.attributes, function (ea) {
		if (this.regexp.ATTRIBUTE_ACCEPTS.test(ea.name)) {
			var attribute = {};
			attribute.name = ea.name;
			attribute.value = ea.value;
			attribute.path = attribute.value.replace(this.regexp.PATH, '');
			attribute.opts = attribute.path.split('.');
			attribute.command = attribute.name.replace(this.regexp.PREFIX, '');
			attribute.cmds = attribute.command.split('-');
			attribute.key = attribute.opts.slice(-1);
			attribute.modifiers = attribute.value.indexOf('|') === -1 ? [] : attribute.value.replace(this.regexp.MODIFIERS, '').split(' ');
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
	this.data.forEach(function (paths, _, did) {
		paths.forEach(function (unit, _, pid) {

			if (element === unit.element) {

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

View.prototype.listener = function (listener) {
	this.emit = listener;
};

View.prototype.run = function (elements) {
	this.elements = elements;
	this.addAll(this.elements);
};

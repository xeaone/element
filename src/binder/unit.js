
function Unit () {}

Unit.prototype.unrender = function () {
	this.element.parentNode.removeChild(this.element);
	return this;
};

Unit.prototype.render = function () {
	this.method();
	return this;
};

Unit.prototype.create = function (options) {
	this.view = options.view;
	this.element = options.element;
	this.attribute = options.attribute;
	this.method = options.method.bind(this);

	Object.defineProperty(this, 'data', {
		enumerable: true,
		configurable: true,
		get: options.getter,
		set: options.setter
	});

	return this;
};

module.exports = function (options) {
	return new Unit().create(options);
};

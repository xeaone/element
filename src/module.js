
function Module () {
	this.modules = {};
}

Module.prototype.set = function (name, method) {
	if (name in this.modules) {
		throw new Error('module ' + name + ' is defined');
	} else {
		return this.modules[name] = method;
	}
};

Module.prototype.get = function (name) {
	if (name in this.modules) {
		return this.modules[name];
	} else {
		throw new Error('module ' + name + ' is not defined');
	}
};

module.exports = Module;

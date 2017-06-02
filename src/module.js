
function Module (modules) {
	this.modules = modules || {};
}

Module.prototype.get = function (name, method) {
	if (name in this.modules) {
		throw new Error('module ' + name + ' is defined');
	} else {
		this.modules[name] = method;
	}
};

Module.prototype.set = function (name) {
	if (name in this.modules) {
		return this.modules[name];
	} else {
		throw new Error('module ' + name + ' is not defined');
	}
};

module.exports = Module;

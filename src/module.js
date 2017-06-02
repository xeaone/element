
function Module () {
	this.modules = {};
}

Module.prototype.set = function (name, dependencies, method) {
	var self = this;

	if (name in self.modules) {
		throw new Error('module ' + name + ' is defined');
	} else {

		if (typeof dependencies === 'function') {
			method = dependencies;
			dependencies = [];
		}

		if (typeof method === 'function') {
			dependencies.forEach(function (dependency) {
				method = method.bind(null, self.get(dependency)());
			});
		}

		return self.modules[name] = method;
	}

};

Module.prototype.get = function (name) {
	var self = this;

	if (name in self.modules) {
		return self.modules[name];
	} else {
		throw new Error('module ' + name + ' is not defined');
	}

};

module.exports = Module;

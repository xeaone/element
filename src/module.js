
function Module () {
	this.modules = {};
}

Module.prototype.load = function (paths) {

	paths.forEach(function(path) {
		var script = document.createElement('script');

		script.src = path;
		script.async = false;
		script.type = 'text/javascript';

		document.head.appendChild(script);
	});

};

Module.prototype.import = function (name) {
	var self = this;

	if (name in self.modules) {
		return  typeof self.modules[name] === 'function' ? self.modules[name]() : self.modules[name];
	} else {
		throw new Error('module ' + name + ' is not defined');
	}

};

Module.prototype.export = function (name, dependencies, method) {
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
				method = method.bind(null, self.import(dependency));
			});
		}

		return self.modules[name] = method;
	}

};

module.exports = Module;

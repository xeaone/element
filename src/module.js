
export default function Module () {
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
	if (name in this.modules) {
		return  typeof this.modules[name] === 'function' ? this.modules[name]() : this.modules[name];
	} else {
		throw new Error('module ' + name + ' is not defined');
	}
};

Module.prototype.export = function (name, dependencies, method) {
	if (name in this.modules) {
		throw new Error('module ' + name + ' is defined');
	} else {

		if (typeof dependencies === 'function') {
			method = dependencies;
			dependencies = [];
		}

		if (typeof method === 'function') {
			dependencies.forEach(function (dependency) {
				method = method.bind(null, this.import(dependency));
			}, this);
		}

		return this.modules[name] = method;
	}
};

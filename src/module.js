
export default function Module (options) {
	options = options || {};
	this.modules = {};

	if (options.modules) {
		for (var i = 0, l = options.modules.length; i < l; i++) {
			var module = options.modules[i];
			this.export.call(
				this,
				module.name,
				module.dependencies || module.method,
				module.dependencies ? module.method : null
			);
		}
	}
	
}

Module.prototype.load = function (paths) {
	for (var i = 0, l = paths.length; i < l; i++) {
		var path = paths[i];
		var script = document.createElement('script');
		script.src = path;
		script.async = false;
		script.type = 'text/javascript';
		document.head.appendChild(script);
	}
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
			for (var i = 0, l = dependencies.length; i < l; i++) {
				var dependency = dependencies[i];
				method = method.bind(null, this.import(dependency));
			}
		}

		return this.modules[name] = method;
	}
};

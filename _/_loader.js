
export default function Loader (options) {
	this.loads = {};
	this.groups = {};
	this.counts = {};
	this.LOADED = 3;
	this.LOADING = 2;
	this.setup(options || {});
}

Loader.prototype.setup = function (options) {
	if (options.loads) {
		for (var i = 0, l = options.loads.length; i < l; i++) {
			this.add(options.loads[i]);
		}
	}
};

Loader.prototype.add = function (load) {
	if (!load.path) throw new Error('Missing load path');
	if (!load.group) throw new Error('Missing load group');
	if (load.path in this.loads) return;

	load.execution = load.execution ? load.execution : 'defer';

	if (!(load.group in this.groups)) {
		this.counts[load.group] = 0;
		this.groups[load.group] = [];
	}

	this.loads[load.path] = load;
	this.groups[load.group].push(load);
};

Loader.prototype.inject = function (load, callback) {
	var self = this;

	load = typeof load === 'string' ? { path: load } : load;

	if (load.path in self.loads && load.status) {
		if (load.status === self.LOADED) {
			if (callback) callback();
		} else if (load.status === self.LOADING) {
			if (load.group === 'module' || load.group === 'route') {
				load.xhr.addEventListener('readystatechange', function () {
					if (load.xhr.readyState === 4) {
						if (load.xhr.status >= 200 && load.xhr.status < 400) {
							if (callback) callback(load);
						} else {
							throw load.xhr.responseText;
						}
					}
				});
			} else {
				load.element.addEventListener('load', function () {
					if (callback) callback(load);
				});
			}
		}

		return;
	}

	if (load.group === 'module' || load.group === 'route') {
		load.xhr = new XMLHttpRequest();
		load.xhr.addEventListener('readystatechange', function () {
			if (load.xhr.readyState === 4) {
				if (load.xhr.status >= 200 && load.xhr.status < 400) {
					load.status = self.LOADED;
					load.data = load.xhr.responseText;
					if (callback) callback(load);
				} else {
					throw load.xhr.responseText;
				}
			}
		});
		load.xhr.open('GET', load.path);
		load.xhr.send();
	} else {
		if (/\.css$/.test(load.path)) {
			load.element = document.createElement('link');
			load.element.rel = 'stylesheet';
			load.element.href = load.path;
		} else if (/\.html$/.test(load.path)) {
			load.element = document.createElement('link');
			load.element.rel = 'import';
			load.element.href = load.path;
		} else if (/\.js$/.test(load.path)) {
			load.element = document.createElement('script');
			load.element.src = load.path;
		} else {
			throw 'Unrecognized extension';
		}

		load.attributes = load.attributes || {};
		for (var attribute in load.attributes) {
			load.element.setAttribute(attribute, load.attributes[attribute]);
		}

		load.element.addEventListener('load', function () {
			load.status = self.LOADED;
			if (callback) callback(load);
		});

		load.element.async = false;
		document.head.appendChild(load.element);
	}

	load.status = self.LOADING;
};

Loader.prototype.listener = function (group, callback) {
	if (++this.counts[group] === this.groups[group].length) {
		if (callback) {
			callback(this.groups[group]);
		}
	}
};

Loader.prototype.start = function (group, callback) {
	if (!group) throw new Error('Missing group argument');
	if (!(group in this.groups)) return console.warn('Group ' + group + ' not in groups');

	if (this.counts[group] === this.groups[group].length) {
		if (callback) callback();
		return;
	}

	for (var i = this.counts[group], l = this.groups[group].length; i < l; i++) {
		this.inject(
			this.loads[this.groups[group][i].path],
			this.listener.bind(this, group, callback)
		);
	}
};

// export default function Loader (options) {
// 	this.setup(options || {});
// }
//
// Loader.prototype.setup = function (options) {
// 	this.loads = {};
// 	this.counts = {};
//
// 	if (options.loads && options.loads.length) {
// 		this.insert(options.loads);
// 	}
// };
//
// Loader.prototype.insert = function (loads) {
// 	for (var i = 0, l = loads.length, load; i < l; i++) {
// 		load = loads[i];
//
// 		if (!load.group) {
// 			throw new Error('Missing load group');
// 		}
//
// 		if (!load.path) {
// 			throw new Error('Missing load path');
// 		}
//
// 		if (!load.execution) {
// 			load.execution = 'defer';
// 		}
//
// 		if (!(load.group in this.loads)) {
// 			this.counts[load.group] = 0;
// 			this.loads[load.group] = [];
// 		}
//
// 		this.loads[load.group].push(load);
// 	}
// };
//
// Loader.prototype.inject = function (load, callback) {
// 	var self = this;
//
// 	load = typeof load === 'string' ? { path: load } : load;
// 	load.attributes = load.attributes || {};
//
// 	if (load.path in self.loads) {
// 		if (load.status === self.LOADING) {
// 			load.element.addEventListener('load', function () {
// 				if (callback) callback();
// 			});
// 			return;
// 		} else if (load.status === self.LOADED) {
// 			if (callback) callback();
// 			return;
// 		}
// 	}
//
// 	if (/\.css$/.test(load.path)) {
// 		load.element = document.createElement('link');
// 		load.element.rel = 'stylesheet';
// 		load.element.href = load.path;
// 	} else if (/\.html$/.test(load.path)) {
// 		load.element = document.createElement('link');
// 		load.element.rel = 'import';
// 		load.element.href = load.path;
// 	} else if (/\.js$/.test(load.path)) {
// 		load.element = document.createElement('script');
// 		load.element.src = load.path;
// 	} else {
// 		throw new Error('Unrecognized extension');
// 	}
//
// 	for (var attribute in load.attributes) {
// 		load.element.setAttribute(attribute, load.attributes[attribute]);
// 	}
//
// 	load.element.addEventListener('load', function () {
// 		load.status = self.LOADED;
// 		if (callback) callback();
// 	});
//
// 	document.head.appendChild(load.element);
// 	load.status = self.LOADING;
// };
//
// Loader.prototype.listener = function (group, listener) {
// 	if (++this.counts[group] === this.loads[group].length) {
// 		if (listener) listener();
// 	}
// };
//
// Loader.prototype.start = function (group, listener) {
// 	if (!group) throw new Error('Missing inject group');
// 	if (!this.loads[group]) return console.warn('Missing group');
//
// 	for (var i = 0, l = this.loads[group].length; i < l; i++) {
// 		this.inject(
// 			this.loads[group][i],
// 			this.listener.bind(this, group, listener)
// 		);
// 	}
// };


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
	this.groups[load.group].push(load.path);
};

Loader.prototype.inject = function (load, listener) {
	var self = this;

	load = typeof load === 'string' ? { path: load } : load;
	load.attributes = load.attributes || {};

	if (load.path in self.loads) {
		if (load.status === self.LOADING) {
			load.element.addEventListener('load', function () {
				if (listener) listener();
			});
			return;
		} else if (load.status === self.LOADED) {
			if (listener) listener();
			return;
		}
	}

	if (/\.css$/.test(load.path)) {
		load.element = document.createElement('link');
		load.element.setAttribute('rel', 'stylesheet');
		load.element.setAttribute('href', load.path);
	} else if (/\.html$/.test(load.path)) {
		load.element = document.createElement('link');
		load.element.setAttribute('rel', 'import');
		load.element.setAttribute('href', load.path);
		if (!('async' in load.attributes || 'defer' in load.attributes)) {
			load.element.setAttribute('defer', '');
		}
	} else if (/\.js$/.test(load.path)) {
		load.element = document.createElement('script');
		load.element.setAttribute('src', load.path);
		if (!('async' in load.attributes || 'defer' in load.attributes)) {
			load.element.setAttribute('defer', '');
		}
	} else {
		throw new Error('Unrecognized extension');
	}

	for (var attribute in load.attributes) {
		load.element.setAttribute(attribute, load.attributes[attribute]);
	}

	load.element.addEventListener('load', function () {
		load.status = self.LOADED;
		if (listener) listener();
	});

	document.head.appendChild(load.element);
	load.status = self.LOADING;
};

Loader.prototype.listener = function (group, listener) {
	if (++this.counts[group] === this.groups[group].length) {
		if (listener) {
			listener();
		}
	}
};

Loader.prototype.start = function (group, listener) {
	if (!group) throw new Error('Missing group argument');
	if (!(group in this.groups)) return console.warn('Group ' + ' not in groups');

	if (this.counts[group] === this.groups[group].length-1) {
		if (listener) listener();
		return;
	}

	for (var i = this.counts[group], l = this.groups[group].length; i < l; i++) {
		this.inject(
			this.loads[this.groups[group][i]],
			this.listener.bind(this, group, listener)
		);
	}
};

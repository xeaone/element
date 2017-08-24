
function Loader (options) {
	options = options || {};
	this.loads = {};
	this.counts = {};

	if (options.loads && options.loads.length) {
		this.setup(options.loads);
	}
}

Loader.prototype.setup = function (loads) {
	for (var i = 0, l = loads.length, load; i < l; i++) {
		load = loads[i];

		if (!load.group) {
			throw new Error('Missing load group');
		}

		if (!load.path) {
			throw new Error('Missing load path');
		}

		if (!(load.group in this.loads)) {
			this.counts[load.group] = 0;
			this.loads[load.group] = [];
		}

		this.loads[load.group].push(load);
	}
};

Loader.prototype.inject = function (load, callback) {
	var element;

	load = typeof load === 'string' ? { path: load } : load;
	load.type = load.type || 'async';

	if (/\.css$/.test(load.path)) {
		element = document.createElement('link');
		element.setAttribute('rel', 'stylesheet');
		element.setAttribute('href', load.path);
		element.setAttribute(load.type, '');
	} else if (/\.html$/.test(load.path)) {
		element = document.createElement('link');
		element.setAttribute('rel', 'import');
		element.setAttribute('href', load.path);
		element.setAttribute(load.type, '');
	} else if (/\.js$/.test(load.path)) {
		element = document.createElement('script');
		element.setAttribute('src', load.path);
		element.setAttribute(load.type, '');
	} else {
		throw new Error('Unrecognized extension');
	}

	element.onload = callback;
	document.head.appendChild(element);
};

Loader.prototype.listener = function (group, listener) {
	if (++this.counts[group] === this.loads[group].length) {
		if (listener) listener();
	}
};

Loader.prototype.start = function (group, listener) {
	if (!group) throw new Error('Missing inject group');
	if (!this.loads[group]) return console.warn('Missing group');

	for (var i = 0, l = this.loads[group].length; i < l; i++) {
		this.inject(
			this.loads[group][i],
			this.listener.bind(this, group, listener)
		);
	}
};

export default Loader;

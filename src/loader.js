
export default function Loader (options) {
	this.setup(options || {});
}

Loader.prototype.setup = function (options) {
	this.loads = {};
	this.counts = {};

	if (options.loads && options.loads.length) {
		this.insert(options.loads);
	}
};

Loader.prototype.insert = function (loads) {
	for (var i = 0, l = loads.length, load; i < l; i++) {
		load = loads[i];

		if (!load.group) {
			throw new Error('Missing load group');
		}

		if (!load.path) {
			throw new Error('Missing load path');
		}

		if (!load.execution) {
			load.execution = 'defer';
		}

		if (!(load.group in this.loads)) {
			this.counts[load.group] = 0;
			this.loads[load.group] = [];
		}

		this.loads[load.group].push(load);
	}
};

Loader.prototype.inject = function (load, callback) {
	if (load.done) {
		if (callback) callback();
		return;
	}

	var element;

	load = typeof load === 'string' ? { path: load } : load;
	load.attributes = load.attributes || {};

	for (var attribute in load.attributes) {
		element.setAttribute(attribute, load.attributes[attribute]);
	}

	if (/\.css$/.test(load.path)) {
		element = document.createElement('link');
		element.setAttribute('rel', 'stylesheet');
		element.setAttribute('href', load.path);
	} else if (/\.html$/.test(load.path)) {
		element = document.createElement('link');
		element.setAttribute('rel', 'import');
		element.setAttribute('href', load.path);
		if (!('async' in load.attributes || 'defer' in load.attributes)) {
			element.setAttribute('defer', '');
		}
	} else if (/\.js$/.test(load.path)) {
		element = document.createElement('script');
		element.setAttribute('src', load.path);
		if (!('async' in load.attributes || 'defer' in load.attributes)) {
			element.setAttribute('defer', '');
		}
	} else {
		throw new Error('Unrecognized extension');
	}

	element.onload = callback;
	document.head.appendChild(element);
	load.done = true;
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

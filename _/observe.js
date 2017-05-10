var Utility = {
	path: function () {
		return Array.prototype.join
		.call(arguments, '.')
		.replace(/\.{2,}/g, '.')
		.replace(/^\.|\.$/g, '');
	},
	is: function (variable, name) {
		return variable && variable.constructor.name === name;
	},
	isCollection: function (variable) {
		return variable !== null && typeof variable === 'object';
	}
};

function Events () {}

Events.prototype.on = function (name, callback) {
	if (!this.events[name]) this.events[name] = [];
	this.events[name].push(callback);
};

Events.prototype.off = function (name, callback) {
	if (!this.events[name]) return;
	var index = this.events[name].indexOf(callback);
	if (this.events[name].indexOf(callback) > -1) this.events[name].splice(index, 1);
};

Events.prototype.emit = function (name) {
	if (!this.events[name]) return;
	var args = [].slice.call(arguments, 1);
	var events = this.events[name].slice();
	for (var i = 0, l = events.length; i < l; i++) events[i].apply(this, args);
};

// --------------------------------------------------------------------------------------------------------------------

function Model () {}

Model.prototype = Object.create(Events.prototype);
Model.prototype.constructor = Model;

Model.prototype.each = function (data, callback, index) {
	Object.keys(data).slice(index).forEach(function (key) {
		callback.call(this, data[key], key, data);
	}, this);
};

Model.prototype.every = function (data, callback, index, emit, path) {
	if (Utility.isCollection(data)) {
		this.each(data, function (value, key) {
			this.every(value, callback, 0, true, Utility.path(path, key));
		}, index);
	}

	if (emit) callback.call(this, data, path || '');
};

Model.prototype.ins = function (data, key, value) {
	var self = this;

	if (Utility.isCollection(value)) self.define(value, Utility.path(data._path, key), true);
	self.defineProperty(data, key);
	data._meta[key] = value;
	this.emit('*', Utility.path(data._path, key), value);
};

Model.prototype.del = function (data, key) {
	if (Utility.is(data, 'Object')) {
		var item = data[key];
		delete data._meta[key];
		delete data[key];

		this.every(item, function (value, p) {
			this.emit('*', Utility.path(data._path, key, p), undefined);
		});

		this.emit('*', Utility.path(data._path, key), undefined);
	} else if (Utility.is(data, 'Array')) {
		data._meta.splice(key, 1);
		data.splice(data.length-1, 1);

		this.every(data, function (value, p) {
			this.emit('*', Utility.path(data._path, p), value);
		}, parseInt(key));

		this.emit('*', Utility.path(data._path, data.length.toString()), undefined);
	}
};

Model.prototype.defineProperty = function (data, key) {
	return Object.defineProperty(data, key, {
		enumerable: true,
		configurable: true,
		get: function () {
			return this._meta[key];
		},
		set: function (value) {
			if (value === undefined) {
				this.del(key);
			} else {
				this.ins(key, value);
			}
		}
	});
};

Model.prototype.define = function (data, path, emit) {
	var self = this;

	Object.defineProperties(data, {
		_meta: {
			writable: true,
			configurable: true,
			value: data.constructor()
		},
		_path: {
			configurable: true,
			value: path || ''
		},
		ins: {
			value: self.ins.bind(self, data)
		},
		del: {
			value: self.del.bind(self, data)
		}
	});

	this.each(data, function (value, key) {
		if (value === undefined) return;

		if (Utility.isCollection(value)) this.define(value, Utility.path(path || '', key), emit);
		this.defineProperty(data, key);
		data._meta[key] = value;
		if (emit) this.emit('*', Utility.path(path || '', key), data._meta[key]);
	});

	return data;
};

Model.prototype.create = function (data) {
	this.events = {};
	this.data = this.define(data);
	return this;
};

// module.exports = function (data) {
// 	return new Model().create(data);
// };

var object = {
	o: { zero: '0', hello: 'test' },
	a: [0, 1, 2, { num: 3 }, { num: 4 }],
	n: null
};

var model = new Model().create(object);

model.on('*', function (path, value) {
	console.log(path);
	console.log(value);
});

// model.o.hello = 'wolrd';
// model.o.zero = undefined;
// console.log(model.o);
// console.log('\n');

// model.a[0] = undefined;
// console.log(model.a);
// console.log('\n');

// model.n = 1;
// console.log(model);
// console.log('\n');




// Object.defineProperty(data, '_meta', {
// 	writable: true,
// 	configurable: true,
// 	value: data.constructor()
// });
//
// if (!data.ins) {
// 	Object.defineProperty(data, 'ins', {
// 		value: self.ins.bind(self, data, path)
// 	});
// }
//
// if (!data.del) {
// 	Object.defineProperty(data, 'del', {
// 		value: self.del.bind(self, data, path)
// 	});
// }

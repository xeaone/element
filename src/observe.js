var Utility = {
	is: function (variable, name) {
		return variable && variable.constructor.name === name;
	},
	isCollection: function (variable) {
		return variable !== null && typeof variable === 'object';
	},
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

Model.prototype.path = function () {
	return Array.prototype.join
	.call(arguments, '.')
	.replace(/\.{2,}/g, '.')
	.replace(/^\.|\.$/g, '');
};

Model.prototype.each = function (data, callback, index) {
	Object.keys(data).slice(index).forEach(function (key) {
		callback.call(this, data[key], key, data);
	}, this);
};

Model.prototype.every = function (data, callback, index, path) {
	if (Utility.isCollection(data)) {
		this.each(data, function (value, key) {
			this.every(value, callback, 0, this.path(path, key));
		}, index);
	}
	// this is calling the parent before undefined last calls
	callback.call(this, data, path || '');
};

Model.prototype.ins = function (data, path, key, value) {
	var self = this;
	path += key;

	if (Utility.isCollection(value)) self.define(value, path, true);
	self.defineProperty(data, key);
	data.meta[key] = value;
	this.emit('*', path, value);
};

Model.prototype.del = function (data, path, key) {
	if (Utility.is(data, 'Object')) {
		var item = data[key];
		delete data.meta[key];
		delete data[key];

		this.every(item, function (value, p) {
			this.emit('*', this.path(path, key, p), undefined);
		});
		// might need to emit the item it self
	} else if (Utility.is(data, 'Array')) {
		data.meta.splice(key, 1);
		data.splice(data.length-1, 1);

		this.every(data, function (value, p) {
			this.emit('*', this.path(path, p), value);
		}, parseInt(key));

		this.emit('*', this.path(path, data.length.toString()), undefined);
	}
};

Model.prototype.defineProperty = function (data, key) {
	return Object.defineProperty(data, key, {
		enumerable: true,
		configurable: true,
		get: function () {
			return this.meta[key];
		},
		set: function (value) {
			if (value === undefined) {
				this.del(self, key);
			} else {
				this.ins(self, key, value);
			}
		}
	});
};

Model.prototype.define = function (data, path, emit) {
	var self = this;

	Object.defineProperties(data, {
		meta: {
			writable: true,
			configurable: true,
			value: data.constructor()
		},
		ins: {
			value: self.ins.bind(self, data, path || '')
		},
		del: {
			value: self.del.bind(self, data, path || '')
		}
	});

	this.each(data, function (value, key) {
		if (value === undefined) return;

		if (Utility.isCollection(value)) this.define(value, this.path(path || '', key), emit);
		this.defineProperty(data, key);
		data.meta[key] = value;
		if (emit) this.emit('*', this.path(path || '', key), data.meta[key]);
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




// Object.defineProperty(data, 'meta', {
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

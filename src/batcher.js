
var Batcher = {};

Batcher.reads = [];
Batcher.writes = [];
Batcher.pending = false;

Batcher.batch = function (options) {
	var task;

	if (options.context) {
		task = options.method.bind(options.context);
	} else {
		task = options.method;
	}

	if (options.priority) {
		this[options.type].unshift(task);
	} else {
		this[options.type].push(task);
	}

	this.tick();
};

// adds a task to the read batch
Batcher.read = function (method, context, priority) {
	this.batch({
		type: 'reads',
		method: method,
		context: context,
		priority: priority
	});
};

// adds a task to the write batch
Batcher.write = function (method, context, priority) {
	this.batch({
		type: 'writes',
		method: method,
		context: context,
		priority: priority
	});
};

// removes a pending task
Batcher.remove = function (tasks, task) {
	var index = tasks.indexOf(task);
	return !!~index && !!tasks.splice(index, 1);
};

// clears a pending read or write task
Batcher.clear = function (task) {
	return this.remove(this.reads, task) || this.remove(this.writes, task);
};

// schedules a new read/write batch if one is not pending
Batcher.tick = function () {
	if (this.pending) return;
	self.pending = true;
	this.flush();
};

var restarts = 0;

Batcher.flush = function () {
	var self = this;

	self.run(self.reads, function () {
		self.run(self.writes, function () {
			self.pending = false;
		});
	});

};

Batcher.run = function (tasks, callback) {
	var self = this;

	if (!tasks.length) {
		return callback();
	}

	var task;

	while (task = tasks.shift()) {
		window.requestAnimationFrame(task);
	}

};

// Batcher.flush = function () {
// 	var self = this;
//
// 	self.run(self.reads.shift(), function () {
// 		self.run(self.writes.shift(), function () {
//
// 			if (self.reads.length || self.writes.length) {
// 				self.flush();
// 			} else {
// 				self.pending = false;
// 			}
//
// 		});
// 	});
//
// };
//
// Batcher.run = function (task, callback) {
//
// 	if (!task) {
// 		return callback();
// 	}
//
// 	window.requestAnimationFrame(function () {
// 		task();
// 		callback();
// 	});
//
// };

export default Batcher;

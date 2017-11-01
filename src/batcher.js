
var Batcher = {};

Batcher.tasks = [];
Batcher.reads = [];
Batcher.writes = [];
Batcher.rafCount = 0;
Batcher.maxTaskTimeMS = 30;
Batcher.pending = false;

// Adds a task to the read batch
Batcher.read = function (method, context) {
	var task = context ? method.bind(context) : method;
	this.reads.push(task);
	this.tick();
};


// Adds a task to the write batch
Batcher.write = function (method, context) {
	var task = context ? method.bind(context) : method;
	this.writes.push(task);
	this.tick();
};

// Schedules a new read/write batch if one isn't pending.
Batcher.tick = function () {
	var self = this;
	if (!self.pending) {
		self.flush();
	}
};

Batcher.flush = function (callback) {
	var self = this;
	self.pending = true;
	self.run(self.reads, function () {
		self.run(self.writes, function () {
			if (self.reads.length || self.writes.length) {
				self.flush();
			} else {
				self.pending = false;
			}
		});
	});
};

// Clears a pending 'read' or 'write' task
Batcher.clear = function (task) {
	return this.remove(this.reads, task) || this.remove(this.writes, task);
};

Batcher.remove = function (tasks, task) {
	var index = tasks.indexOf(task);
	return !!~index && !!tasks.splice(index, 1);
};

Batcher.run = function (tasks, callback) {
	var self = this;
	if (tasks.length) {
		window.requestAnimationFrame(function (time) {
			var task;

			while (performance.now() - time < self.maxTaskTimeMS) {
				if (task = tasks.shift()) {
					task();
				} else {
					break;
				}
			}

			self.run(tasks, callback);
		});
	} else if (callback) {
		callback();
	}
};

export default Batcher;

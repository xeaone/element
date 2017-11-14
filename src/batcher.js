
var Batcher = {};

Batcher.tasks = [];
Batcher.reads = [];
Batcher.writes = [];
Batcher.pending = false;
Batcher.maxTaskTimeMS = 30;

// adds a task to the read batch
Batcher.read = function (method, context) {
	var task = context ? method.bind(context) : method;
	this.reads.push(task);
	this.tick();
};

// adds a task to the write batch
Batcher.write = function (method, context) {
	var task = context ? method.bind(context) : method;
	this.writes.push(task);
	this.tick();
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
	if (!this.pending) {
		this.flush();
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

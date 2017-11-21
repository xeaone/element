
var Batcher = {};

Batcher.reads = [];
Batcher.writes = [];
Batcher.pending = false;
// Batcher.tasks = [];
// Batcher.maxTaskTimeMS = 1000/60;

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
		self.pending = true;
		this.flush();
	}
};

Batcher.flush = function (callback) {
	var self = this;

	self.run(self.reads.splice(0, self.reads.length), function () {
		self.run(self.writes.splice(0, self.writes.length), function () {

			if (self.reads.length || self.writes.length) {
				self.flush();
			} else {
				self.pending = false;
			}

		});
	});

};

Batcher.run = function (tasks, callback, index) {

	if (tasks.length) {

		window.requestAnimationFrame(function (time) {
			var count = 0;
			var length = tasks.length;

			index = index || 0;

			for (index; index < length; index++) {
				tasks[index]();
			}

			return callback();
		});

	} else {
		return callback();
	}

};

export default Batcher;

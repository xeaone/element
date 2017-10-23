
export default function Batcher () {
	this.tasks = [];
	this.reads = [];
	this.writes = [];
	this.rafCount = 0;
	this.maxTaskTimeMS = 30;
	this.pending = false;
}

// Adds a task to the read batch
Batcher.prototype.read = function (method, context) {
	var task = context ? method.bind(context) : method;
	this.reads.push(task);
	this.tick();
};


// Adds a task to the write batch
Batcher.prototype.write = function (method, context) {
	var task = context ? method.bind(context) : method;
	this.writes.push(task);
	this.tick();
};

// Schedules a new read/write batch if one isn't pending.
Batcher.prototype.tick = function () {
	var self = this;
	if (!self.pending) {
		self.flush();
	}
};

Batcher.prototype.flush = function (callback) {
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

Batcher.prototype.run = function (tasks, callback) {
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

// Clears a pending 'read' or 'write' task
Batcher.prototype.clear = function (task) {
	return this.remove(this.reads, task) || this.remove(this.writes, task);
};

Batcher.prototype.remove = function (tasks, task) {
	var index = tasks.indexOf(task);
	return !!~index && !!tasks.splice(index, 1);
};

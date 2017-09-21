
export default function Batcher () {
	this.reads = [];
	this.writes = [];
	this.rafCount = 0;
	this.fps = 1000/60;
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
	if (!this.pending) {
		this.pending = true;
		this.flush();
	}
};

Batcher.prototype.flush = function () {
	var self = this;
	window.requestAnimationFrame(function (readsStartTime) {
		self.run(self.reads, function () {
			window.requestAnimationFrame(function (writesStartTime) {
				self.run(self.writes, function () {
					self.pending = false;
				}, writesStartTime);
			});
		}, readsStartTime);
	});
};

Batcher.prototype.run = function (tasks, callback, start) {
	if (tasks.length) {
		var end;
		var task = tasks.shift();

		do {
			task();
			task = tasks.shift();
			end = window.performance.now();
		} while (task && end - start < this.fps);

		window.requestAnimationFrame(this.run.bind(this, tasks, callback));
	} else {
		if (callback) {
			callback();
		}
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

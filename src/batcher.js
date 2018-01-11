import Events from './lib/events';

var Batcher = function (options) {
	Events.call(this);

	this.reads = [];
	this.writes = [];
	this.fps = 1000/60;
	this.pending = false;

	this.setup(options);
};

Batcher.prototype = Object.create(Events.prototype);
Batcher.prototype.constructor = Batcher;

Batcher.prototype.setup = function (options) {
	options = options || {};
	options.fps = options.fps === undefined || options.fps === null ? this.fps : options.fps;
};

// adds a task to the read batch
Batcher.prototype.read = function (method, context) {
	var task = context ? method.bind(context) : method;
	this.reads.push(task);
	this.tick();
	return task;
};

// adds a task to the write batch
Batcher.prototype.write = function (method, context) {
	var task = context ? method.bind(context) : method;
	this.writes.push(task);
	this.tick();
	return task;
};

// schedules a new read/write batch if one is not pending
Batcher.prototype.tick = function () {
	if (!this.pending) {
		this.pending = true;
		window.requestAnimationFrame(this.flush.bind(this));
	}
};

Batcher.prototype.flush = function (time) {
	var error, count;

	try {
		count = this.runReads(this.reads, time);
		this.runWrites(this.writes, count);
	} catch (e) {
		if (this.events.error && this.events.error.length) {
			this.emit('error', e);
		} else {
			throw e;
		}
	}

	this.pending = false;

	if (this.reads.length || this.writes.length) {
		this.tick();
	}

};

Batcher.prototype.runWrites = function (tasks, count) {
	var task;

	while (task = tasks.shift()) {

		task();

		if (count && tasks.length === count) {
			return;
		}

	}

};

Batcher.prototype.runReads = function (tasks, time) {
	var task;

	while (task = tasks.shift()) {

		task();

		if (this.fps && performance.now() - time > this.fps) {
			return tasks.length;
		}

	}

};

Batcher.prototype.remove = function (tasks, task) {
	var index = tasks.indexOf(task);
	return !!~index && !!tasks.splice(index, 1);
};

Batcher.prototype.clear = function (task) {
	return this.remove(this.reads, task) || this.remove(this.writes, task);
};

export default Batcher;

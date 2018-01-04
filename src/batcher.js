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
	var error;

	if (!this.reads.length && !this.writes.length) {
		return;
	}

	try {
		this.run(this.reads, time);
		this.run(this.writes, time);
	} catch (e) {
		error = e;
	}

	this.pending = false;

	if (this.reads.length || this.writes.length) {
		this.tick();
	}

	if (error) {
		if (this.events.error.length) {
			this.emit('error', error);
		} else {
			throw error;
		}
	}

};

Batcher.prototype.run = function (tasks, time) {
	var task;

	while (task = tasks.shift()) {

		task();

		if (this.maxFrameTime && performance.now() - time > this.fps) {
			break;
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

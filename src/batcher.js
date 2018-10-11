
export default {

	reads: [],
	writes: [],
	fps: 1000/60,
	pending: false,

	setup (options) {
		options = options || {};
		this.fps = options.fps || this.fps;
	},

	// adds a task to the read batch
	read (method, context) {
		const task = context ? method.bind(context) : method;

		this.reads.push(task);
		this.schedule();

		return task;
	},

	// adds a task to the write batch
	write (method, context) {
		const task = context ? method.bind(context) : method;

		this.writes.push(task);
		this.schedule();

		return task;
	},

	tick (callback) {
		window.requestAnimationFrame(callback);
	},

	// schedules a new read/write batch if one is not pending
	schedule () {
		if (!this.pending) {
			this.pending = true;
			this.tick(this.flush.bind(this));
		}
	},

	flush (time) {

		try {
			const count = this.runReads(this.reads, time);
			this.runWrites(this.writes, count);
		} catch (error) {
			if (typeof this.error === 'function') {
				this.error(error);
			} else {
				throw error;
			}
		}

		this.pending = false;

		if (this.reads.length || this.writes.length) {
			this.schedule();
		}

	},

	runWrites (tasks, count) {
		let task;

		while (task = tasks.shift()) {

			task();

			if (count && tasks.length === count) {
				return;
			}

		}

	},

	runReads (tasks, time) {
		let task;

		while (task = tasks.shift()) {

			task();

			if (this.fps && performance.now() - time > this.fps) {
				return tasks.length;
			}

		}

	},

	remove (tasks, task) {
		const index = tasks.indexOf(task);
		return !!~index && !!tasks.splice(index, 1);
	},

	clear (task) {
		return this.remove(this.reads, task) || this.remove(this.writes, task);
	}

}

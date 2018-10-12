
class Batcher {

	constructor () {
		this.reads = [];
		this.writes = [];
		this.fps = 90;
		// this.fps = 1000/60;
		this.pending = false;
	}

	setup (options) {
		options = options || {};
		this.fps = options.fps || this.fps;
	}

	// adds a task to the read batch
	read (method, context) {
		const task = context ? method.bind(context) : method;

		this.reads.push(task);
		this.schedule();

		return task;
	}

	// adds a task to the write batch
	write (method, context) {
		const task = context ? method.bind(context) : method;

		this.writes.push(task);
		this.schedule();

		return task;
	}

	tick (callback) {
		// if (this.id) window.cancelAnimationFrame(this.id);
		this.id = window.requestAnimationFrame(callback);
	}

	// schedules a new read/write batch if one is not pending
	schedule (count) {
		const self = this;

		if (!self.reads.length && !self.writes.length) {
			self.pending = false;
			return;
		} else {
			self.pending = true;
		}

		try {
			self.runReads(self.reads.slice());
			self.runWrites(self.writes.slice());
			self.reads = [];
			self.writes = [];

			// self.tick(function (time) {
			//
			// 	if (!count) {
			//
			// 		if (self.reads.length) {
			// 			count = self.runReads(self.reads, time);
			// 		} else {
			// 			count = self.writes.length;
			// 		}
			//
			// 	}
			//
			// 	if (performance.now() - time < self.fps) {
			// 		count = self.runWrites(self.writes, time, count);
			// 	}
			//
			// 	self.schedule(count);
			// });

		} catch (error) {

			if (typeof self.error === 'function') {
				self.error(error);
			} else {
				throw error;
			}

		}

	}

	runReads (tasks, time) {
		let task;
		// let i = 0;

		while (task = tasks.shift()) {
			this.tick(task);
			// task();
			// i++;
			// if (performance.now() - time > this.fps) break;
		}

		// return i;
	}

	runWrites (tasks, time, count) {
		let task;
		// let i = 0;

		while (task = tasks.shift()) {
			this.tick(task);
			// task();
			// i++;
			// if (i === count || performance.now() - time > this.fps) break;
		}

		// return count - i;
	}

	remove (tasks, task) {
		const index = tasks.indexOf(task);
		return !!~index && !!tasks.splice(index, 1);
	}

	clear (task) {
		return this.remove(this.reads, task) || this.remove(this.writes, task);
	}

}

export default new Batcher();

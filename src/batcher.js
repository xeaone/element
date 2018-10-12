
class Batcher {

	constructor () {
		this.reads = [];
		this.writes = [];
		this.time = 300;
		this.pending = false;
	}

	setup (options) {
		options = options || {};
		this.time = options.time || this.time;
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
		return window.requestAnimationFrame(callback);
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

		self.tick(function (time) {
			let read;
			let write;

			try {

				if (count === undefined) {
					count = 0;

					while (read = self.reads.shift()) {
						read();
						count++;
						if (performance.now() - time > self.time) {
							return self.schedule(count);
						}
					}

				}

				while (write = self.writes.shift()) {
					write();
					if (--count < 1 || performance.now() - time > self.time) {
						return self.schedule(count);
					}
				}

			} catch (error) {

				if (typeof self.error === 'function') {
					self.error(error);
				} else {
					throw error;
				}

			}

			self.schedule();
		});

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

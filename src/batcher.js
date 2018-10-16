
class Batcher {

	constructor () {
		this.reads = [];
		this.writes = [];
		// this.time = 1000;
		this.time = 1000/30;
		this.pending = false;
		this.mr = 0;
		this.mw = 0;
		this.tr = 0;
		this.tw = 0;
	}

	setup (options) {
		options = options || {};
		this.time = options.time || this.time;
	}

	// // adds a task to the read batch
	// read (method, context) {
	// 	const task = context ? method.bind(context) : method;
	//
	// 	this.reads.push(task);
	// 	this.schedule();
	//
	// 	return task;
	// }
	//
	// // adds a task to the write batch
	// write (method, context) {
	// 	const task = context ? method.bind(context) : method;
	//
	// 	this.writes.push(task);
	// 	this.schedule();
	//
	// 	return task;
	// }

	tick (callback) {
		return window.requestAnimationFrame(callback);
	}

	// schedules a new read/write batch if one is not pending
	schedule () {
		if (!this.pending) {
			this.pending = true;
			this.tick(this.flush.bind(this, null));
			// this.flush();
		}
	}

	flush (position, time) {
		const self = this;

		if (!self.reads.length && !self.writes.length) {
			self.pending = false;
			return;
		}

		// self.tick(function (time) {
			let i;

			if (position === null) {

				// count = 0;
				// while (read = self.reads.shift()) {
				for (i = 0; i < self.reads.length; i++) {
					self.tr++;
					const read = self.reads[i];
					if (read) read();
					// count++;
					if (performance.now() - time > self.time) {
						self.mr++;
						// return self.schedule(count);
						self.reads.splice(0, i + 1);
						return self.tick(self.flush.bind(self, i + 1));
					}
				}

				self.reads.splice(0, i + 1);
			}

			// while (write = self.writes.shift()) {
			for (i = 0; i < self.writes.length; i++) {
				// write();
				self.tw++;
				const write = self.writes[i];
				if (write) write();

				if (i === position) {
					console.log('position');
					self.writes.splice(0, i + 1);
					return self.flush(null, time);
				}

				if (performance.now() - time > self.time) {
					self.mw++;
					self.writes.splice(0, i + 1);
					// return self.flush(i + 1);
					return self.tick(self.flush.bind(self, i + 1));
				}

			}

			self.writes.splice(0, i + 1);

			self.flush(null, time);
		// });
	}

	remove (tasks, task) {
		const index = tasks.indexOf(task);
		return !!~index && !!tasks.splice(index, 1);
	}

	clear (task) {
		return this.remove(this.reads, task) || this.remove(this.writes, task);
	}

	batch (data) {
		const self = this;

		if (data.read) {

			const read = function () {

				if (data.context) {
					data.read.call(data.context);
				} else {
					data.read();
				}

				if (
					(data.write && !data.context) ||
					(data.write && data.context && data.context.continue !== false)
				) {
					let write;

					if (data.context) {
						write = data.write.bind(data.context);
					} else {
						write = data.write;
					}

					self.writes.push(write);
					self.schedule();
				}

			};

			self.reads.push(read);
			self.schedule();
		} else if (data.write) {
			let write;

			console.log('no read');

			if (data.context) {
				write = data.write.bind(data.context, data.shared);
			} else {
				write = data.write;
			}

			self.writes.push(write);
			self.schedule();
		}

		return data;
	}

}

export default new Batcher();

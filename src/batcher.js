
class Batcher {

	constructor () {
		this.reads = [];
		this.writes = [];
		this.time = 1000/30;
		this.pending = false;
	}

	setup (options) {
		options = options || {};
		this.time = options.time || this.time;
	}

	tick (callback) {
		return window.requestAnimationFrame(callback);
	}

	// schedules a new read/write batch if one is not pending
	schedule () {
		if (this.pending) return;
		this.pending = true;
		this.tick(this.flush.bind(this, null));
	}

	flush (time) {
		time = time || performance.now();

		let task;

		while (task = this.reads.shift()) {
			task();

			if (performance.now() - time > this.time) {
				this.tick(this.flush.bind(this, null));
				return;
			}

		}

		while (task = this.writes.shift()) {
			task();

			if (performance.now() - time > this.time) {
				this.tick(this.flush.bind(this, null));
				return;
			}

		}

		if (!this.reads.length && !this.writes.length) {
			this.pending = false;
		} else if (performance.now() - time > this.time) {
			this.tick(this.flush.bind(this, null));
		} else {
			this.flush(time);
		}

	}

	remove (tasks, task) {
		let index = tasks.indexOf(task);
		return !!~index && !!tasks.splice(index, 1);
	}

	clear (task) {
		return this.remove(this.reads, task) || this.remove(this.writes, task);
	}

	batch (data) {
		let self = this;

		// let read;
		// let write;
		//
		// if (data.context) {
		// 	read = data.read.bind(data.context, data.shared);
		// 	write = data.write.bind(data.context, data.shared);
		// } else {
		// 	read = data.read;
		// 	write = data.write;
		// }
		//
		// if (read) self.reads.push(read);
		// if (write) self.writes.push(write);
		//
		// self.schedule();

		if (data.read) {

			let read = function () {
				let result;
				let write;

				if (data.context) {
					result = data.read.call(data.context);
				} else {
					result = data.read();
				}

				if (data.write && result !== false) {

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

/*
	console.log('read ', Oxe.batcher.tr);
	console.log('write ', Oxe.batcher.tw);
	console.log('position ', Oxe.batcher.tp);
	Oxe.batcher.tr = 0;
	Oxe.batcher.tw = 0;
	Oxe.batcher.tp = 0;
*/

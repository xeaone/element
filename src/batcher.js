
export default {

	reads: [],
	writes: [],
	time: 1000/30,
	// time: 1000/60,
	pending: false,

	setup (options) {
		options = options || {};
		this.time = options.time || this.time;
	},

	tick (callback) {
		window.requestAnimationFrame(callback.bind(this, null));
	},

	// schedules a new read/write batch if one is not pending
	schedule () {
		if (this.pending) return;
		this.pending = true;
		this.tick(this.flush);
	},

	flush (time) {
		time = time || performance.now();

		let task;

		// if (data.reads === 0) {
		// 	while (task = this.reads.shift()) {
		//
		// 		if (task) {
		// 			task();
		// 			data.reads++;
		// 		}
		//
		// 		if (data.writes && data.writes === data.reads) {
		// 			data.writes = 0;
		// 			break;
		// 		}
		//
		// 		if ((performance.now() - data.time) > this.time) {
		// 			data.writes = 0;
		// 			data.time = null;
		// 			return this.tick(this.flush, data);
		// 			break;
		// 		}
		//
		// 	}
		// }
		//
		// if (data.writes === 0) {
		// 	while (task = this.writes.shift()) {
		//
		// 		if (task) {
		// 			task();
		// 			data.writes++;
		// 		}
		//
		// 		if (data.reads && data.reads === data.writes) {
		// 			data.reads = 0;
		// 			break;
		// 		}
		//
		// 		if ((performance.now() - data.time) > this.time) {
		// 			data.reads = 0;
		// 			data.time = null;
		// 			return this.tick(this.flush, data);
		// 		}
		//
		// 	}
		// }

		// while (task = this.reads.shift()) task();
		// while (task = this.writes.shift()) task();

		if (this.writes.length === 0) {
			while (task = this.reads.shift()) {

				if (task) {
					task();
				}

				if ((performance.now() - time) > this.time) {
					return this.tick(this.flush);
				}

			}
		}

		while (task = this.writes.shift()) {

			if (task) {
				task();
			}

			if ((performance.now() - time) > this.time) {
				return this.tick(this.flush);
			}

		}

		if (this.reads.length === 0 && this.writes.length === 0) {
			this.pending = false;
		} else if ((performance.now() - time) > this.time) {
			this.tick(this.flush);
		} else {
			this.flush(time);
		}

	},

	remove (tasks, task) {
		const index = tasks.indexOf(task);
		return !!~index && !!tasks.splice(index, 1);
	},

	clear (task) {
		return this.remove(this.reads, task) || this.remove(this.writes, task);
	},

	batch (data) {
		const self = this;

		if (!data) return;
		if (!data.read && !data.write) return;

		data.context = data.context || {};

		// const read = data.read ? data.read.bind(null, data.context) : null;
		// const write = data.write ? data.write.bind(null, data.context) : null;
		//
		// self.reads.push(read);
		// self.writes.push(write);
		//
		// self.schedule();

		const read = function () {
			let result;

			if (data.read) {
				result = data.read.call(data.context, data.context);
				// data.read.call(data.context);
			}

			if (data.write && result !== false) {
			// if (data.write) {
				const write = data.write.bind(data.context, data.context);

				self.writes.push(write);
			// } else {
				// self.writes.push(null);
			}

		};

		self.reads.push(read);
		self.schedule();
	}

};

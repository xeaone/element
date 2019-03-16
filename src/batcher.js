
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
		window.cancelAnimationFrame(this.frame);
		this.frame = window.requestAnimationFrame(callback);
	},

	// schedules a new read/write batch if one is not pending
	schedule () {
		if (this.pending) return;
		this.pending = true;
		this.tick(this.flush.bind(this, null));
	},

	flush (time) {
		time = time || performance.now();

		let task;

		while (task = this.reads.shift()) {
			task();

			if (performance.now() - time > this.time) {
				// console.log('max read');
				this.tick(this.flush.bind(this, null));
				return;
			}

		}

		while (task = this.writes.shift()) {
			task();

			if (performance.now() - time > this.time) {
				// console.log('max write');
				this.tick(this.flush.bind(this, null));
				return;
			}

		}

		if (!this.reads.length && !this.writes.length) {
			this.pending = false;
		} else if (performance.now() - time > this.time) {
			// console.log('max end');
			this.tick(this.flush.bind(this, null));
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

		data.context = data.context || {};

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

			const read = function () {
				const result = data.read.call(data.context);

				if (data.write && result !== false) {
					const write = data.write.bind(data.context);

					self.writes.push(write);
					self.schedule();
				}

			};

			self.reads.push(read);
			self.schedule();
		} else if (data.write) {
			const write = data.write.bind(data.context);

			self.writes.push(write);
			self.schedule();
		}
	}

};

/*
	console.log('read ', Oxe.batcher.tr);
	console.log('write ', Oxe.batcher.tw);
	console.log('position ', Oxe.batcher.tp);
	Oxe.batcher.tr = 0;
	Oxe.batcher.tw = 0;
	Oxe.batcher.tp = 0;
*/

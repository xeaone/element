
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
		// window.requestAnimationFrame(callback);
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

		while (task = this.reads.shift()) {
			task();

			// if ((performance.now() - time) > this.time) {
			// 	this.tick(this.flush.bind(this, null));
			// 	return;
			// }

		}

		while (task = this.writes.shift()) {
			task();

			// if (performance.now() - time > this.time) {
			// 	this.tick(this.flush.bind(this, null));
			// 	return;
			// }

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

		const read = function () {
			let result;

			if (data.read) {
				// result = data.read.call(data.context);
				data.read.call(data.context);
			}

			// if (data.write && result !== false) {
			if (data.write) {
				const write = data.write.bind(data.context);

				self.writes.push(write);
				self.schedule();
			}

		};

		self.reads.push(read);
		self.schedule();
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


class Batcher {

	constructor () {
		this.reads = [];
		this.writes = [];
		this.time = 1000/30;
		this.pending = false;
		// this.mr = 0;
		// this.mw = 0;
		// this.tr = 0;
		// this.tw = 0;
		// this.tp = 0;
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
		if (!this.pending) {
			this.pending = true;
			this.tick(this.flush.bind(this, null));
		}
	}

	flush (position, time) {

		if (!this.reads.length && !this.writes.length) {
			this.pending = false;
			return;
		}

		let i;

		if (position === null) {

			for (i = 0; i < this.reads.length; i++) {
				// this.tr++;
				this.reads[i]();

				// max read time
				if (performance.now() - time > this.time) {
					// this.mr++;
					this.reads.splice(0, i + 1);
					return this.tick(this.flush.bind(this, i + 1));
				}
			}

			this.reads.splice(0, i + 1);
		}

		for (i = 0; i < this.writes.length; i++) {
			// this.tw++;
			this.writes[i]();

			// position of max read time
			if (i === position) {
				// this.tp++;
				this.writes.splice(0, i + 1);
				return this.flush(null, time);
			}

			// max write time
			if (performance.now() - time > this.time) {
				// this.mw++;
				this.writes.splice(0, i + 1);
				return this.tick(this.flush.bind(this, i + 1));
			}

		}

		this.writes.splice(0, i + 1);
		this.flush(null, time);
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
				let result;

				if (data.context) {
					result = data.read.call(data.context);
				} else {
					result = data.read();
				}

				if (data.write && result !== false) {
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

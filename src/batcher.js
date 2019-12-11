
export default Object.freeze({

    reads: [],
    writes: [],

    options: {
        time: 1000/60,
        pending: false
    },

    setup (options) {
        options = options || {};
        this.options.time = options.time || this.options.time;
    },

    tick (callback) {
        window.requestAnimationFrame(callback.bind(this));
    },

    // schedules a new read/write batch if one is not pending
    schedule () {
        if (this.options.pending) return;
        this.options.pending = true;
        this.tick(this.flush);
    },

    flush (time) {

        let task;

        while (task = this.reads.shift()) {

            if (task) {
                task();
            }

            if ((performance.now() - time) > this.options.time) {
                return this.tick(this.flush);
            }

        }

        while (task = this.writes.shift()) {

            if (task) {
                task();
            }

            if ((performance.now() - time) > this.options.time) {
                return this.tick(this.flush);
            }

        }

        if (this.reads.length === 0 && this.writes.length === 0) {
            this.options.pending = false;
        } else if ((performance.now() - time) > this.options.time) {
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
        data.context.read = true;
        data.context.write = true;

        self.reads.push(data.read ? function () {
            if (this.read) {
                return data.read.call(data.context, data.context);
            }
        }.bind(data.context, data.context) : null);

        self.writes.push(data.write ? function () {
            if (this.write) {
                return data.write.call(data.context, data.context);
            }
        }.bind(data.context, data.context) : null);

        self.schedule();
    }

});

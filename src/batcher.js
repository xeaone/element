
const reads = [];
const writes = [];

const options = {
    time: 1000/60,
    pending: false
};

const setup = function (options = {}) {
    this.options.time = options.time || this.options.time;
};

const tick = function (method) {
    const self = this;
    return new Promise((resolve, reject) => {
        window.requestAnimationFrame((time) => {
            Promise.resolve()
                .then(method.bind(self, time))
                .then(resolve)
                .catch(reject);
        });
    });
};

// schedules a new read/write batch if one is not pending
const schedule = async function () {
    if (this.options.pending) return;
    this.options.pending = true;
    return this.tick(this.flush);
};

const flush = async function (time) {

    console.log('reads:', this.reads.length);
    console.log('write:', this.writes.length);

    let read;
    while (read = this.reads.shift()) {
        if (read) await read();

        if ((performance.now() - time) > this.options.time) {
            console.log('read max');
            return this.tick(this.flush);
        }

    }

    let write;
    while (write = this.writes.shift()) {
        if (write) await write();

        if ((performance.now() - time) > this.options.time) {
            console.log('write max');
            return this.tick(this.flush);
        }

    }

    if (this.reads.length === 0 && this.writes.length === 0) {
        this.options.pending = false;
    } else if ((performance.now() - time) > this.options.time) {
        return this.tick(this.flush);
    } else {
        return this.flush(time);
    }

};

const remove = function (tasks, task) {
    const index = tasks.indexOf(task);
    return !!~index && !!tasks.splice(index, 1);
};

const clear = function (task) {
    return this.remove(this.reads, task) || this.remove(this.writes, task);
};

const batch = function (data) {
    const self = this;

    if (!data) return;
    if (!data.read && !data.write) return;

    data.context = data.context ? { ...data.context } : {};
    data.context.read = data.read;
    data.context.write = data.write;

    if (data.read) {
        self.reads.push(async function () {
            if (this.read) return this.read.call(this, this);
        }.bind(data.context, data.context));
    }

    if (data.write) {
        self.writes.push(async function () {
            if (this.write) return this.write.call(this, this);
        }.bind(data.context, data.context));
    }

    self.schedule().catch(console.error);
};

export default Object.freeze({
    reads,
    writes,
    options,
    setup,
    tick,
    schedule,
    flush,
    remove,
    clear,
    batch
});

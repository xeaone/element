
const reads = [];
const writes = [];

const options = {
    time: 1000/60,
    pending: false
};

const setup = function (options:any = {}) {
    this.options.time = options.time || this.options.time;
};

const tick = function (method: () => void) {
    return new Promise((resolve, reject) => {
        window.requestAnimationFrame(time => {
            Promise.resolve()
                .then(method.bind(this, time))
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

    console.log('reads before:', this.reads.length);
    console.log('write before:', this.writes.length);

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

    console.log('reads after:', this.reads.length);
    console.log('write after:', this.writes.length);

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

const batch = function (context) {
    const self = this;

    if (!context) return;
    if (!context.read && !context.write) return;

    self.reads.push(async () =>
        context.read ? context.read.call(context, context) : undefined
    );

    self.writes.push(async () => 
        context.write ? context.write.call(context, context) : undefined
    );

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
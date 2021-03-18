
const reads = [];
const writes = [];

const options = {
    time: 1000 / 60,
    pending: false
};

const setup = function (options: any = {}) {
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
    else this.options.pending = true;
    // return this.flush();
    return this.tick(this.flush);
};

const flush = async function (time) {

    // console.log('reads before:', this.reads.length);
    // console.log('write before:', this.writes.length);

    const readTasks = [];
    let read;
    let reads = 0;
    while (read = this.reads.shift()) {
        if (read) readTasks.push(read());
        reads++;
    }
    await Promise.all(readTasks);
    const writeTasks = [];
    let write;
    let writes = 0;
    while (write = this.writes.shift()) {
        if (write) writeTasks.push(write());
        if (++writes === reads) break;
    }
    await Promise.all(writeTasks);

    // let read;
    // let reads = 0;
    // while (read = this.reads.shift()) {
    //     if (read) await read();
    //     reads++;
    // }
    // let write;
    // let writes = 0;
    // while (write = this.writes.shift()) {
    //     if (write) await write();
    //     if (++writes === reads) break;
    // }

    // const readTasks = [];
    // let read;
    // let reads = 0;
    // while (read = this.reads.shift()) {
    //     if (read) readTasks.push(this.tick(read));
    //     reads++;
    // }
    // await Promise.all(readTasks);
    // const writeTasks = [];
    // let write;
    // let writes = 0;
    // while (write = this.writes.shift()) {
    //     if (write) writeTasks.push(this.tick(write));
    //     if (++writes === reads) break;
    // }
    // await Promise.all(writeTasks);

    // console.log('reads after:', this.reads.length);
    // console.log('write after:', this.writes.length);

    if (this.reads.length === 0 && this.writes.length === 0) {
        this.options.pending = false;
    // } else if ((performance.now() - time) > this.options.time) {
        // return this.tick(this.flush);
    } else {
        return this.tick(this.flush);
        // return this.flush(time);
    }

};

const remove = function (tasks, task) {
    const index = tasks.indexOf(task);
    return !!~index && !!tasks.splice(index, 1);
};

const clear = function (task) {
    return this.remove(this.reads, task) || this.remove(this.writes, task);
};

const batch = function (read, write) {

    if (!read && !write) return;

    this.reads.push(read);
    this.writes.push(write);

    this.schedule().catch(console.error);
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


// schedules a new read/write batch if one is not pending

const reads = [];
const writes = [];

const options = {
    time: 16,
    pending: false
};

const setup = function (data: any = {}) {
    options.time = data.time || options.time;
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

// const schedule = async function () {
//     if (this.options.pending) return;
//     else this.options.pending = true;
//     return this.flush();
// };

// const flush = async function (time) {

//     const readTasks = [];
//     let read;
//     while (read = this.reads.shift()) {
//         if (read) readTasks.push(this.tick(read));
//     }
//     await Promise.all(readTasks);

//     const writeTasks = [];
//     let write;
//     while (write = this.writes.shift()) {
//         if (write) writeTasks.push(this.tick(write));
//         if (writeTasks.length === readTasks.length) break;
//     }
//     await Promise.all(writeTasks);

//     if (this.reads.length === 0 && this.writes.length === 0) {
//         this.options.pending = false;
//     } else {
//         return this.flush(time);
//     }

// };

const schedule = async function () {
    if (this.options.pending) return;
    else this.options.pending = true;
    return this.tick(this.flush);
};

const flush = async function (time) {

    const readTasks = [];
    let read;
    while (read = this.reads.shift()) {
        if (read) readTasks.push(read());
        if ((performance.now() - time) > options.time) return this.tick(this.flush);
    }
    await Promise.all(readTasks);

    const writeTasks = [];
    let write;
    while (write = this.writes.shift()) {
        if (write) writeTasks.push(write());
        if ((performance.now() - time) > options.time) return this.tick(this.flush);
        if (writeTasks.length === readTasks.length) break;
    }
    await Promise.all(writeTasks);

    if (this.reads.length === 0 && this.writes.length === 0) {
        this.options.pending = false;
    } else if ((performance.now() - time) > options.time) {
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

const batch = async function (read, write) {

    if (!read && !write) return;

    this.reads.push(read);
    this.writes.push(write);

    return this.schedule();
    // return this.schedule().catch(console.error);
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

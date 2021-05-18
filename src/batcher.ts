
const reads = [];
const writes = [];

let max = 16;
let pending = false;

const setup = function (data: any = {}) {
    max ?? data.max;
};

const tick = function (method: (time: number) => void) {
    return new Promise((resolve, reject) => {
        window.requestAnimationFrame(time => {
            Promise.resolve()
                .then(method.bind(this, time))
                .then(resolve)
                .catch(reject);
        });
    });
};

const schedule = async function () {
    if (pending) return;
    else pending = true;
    return tick(flush);
};

const flush = async function (time) {
    const tasks = [];

    // const readTasks = [];
    let read;
    while (read = reads.shift()) {
        // if (read) readTasks.push(read());
        tasks.push(read());
        if ((performance.now() - time) > max) return tick(flush);
    }
    await Promise.all(tasks);

    // const writeTasks = [];
    let write;
    while (write = writes.shift()) {
        // if (write) writeTasks.push(write());
        tasks.push(write());
        if ((performance.now() - time) > max) return tick(flush);
        //     if (writeTasks.length === readTasks.length) break;
    }
    await Promise.all(tasks);

    if (reads.length === 0 && writes.length === 0) {
        pending = false;
    } else if ((performance.now() - time) > max) {
        return tick(flush);
    } else {
        return flush(time);
    }

};

const remove = function (tasks, task) {
    const index = tasks.indexOf(task);
    return !!~index && !!tasks.splice(index, 1);
};

const clear = function (task) {
    return remove(reads, task) || remove(writes, task);
};

const batch = async function (read, write) {

    if (!read && !write) return;

    return new Promise((resolve: any) => {

        if (read) {
            reads.push(async () => {
                await read();
                if (write) {
                    writes.push(async () => {
                        await write();
                        resolve();
                    });
                }
            });
        } else {
            writes.push(async () => {
                await write();
                resolve();
            });
        }

        // let readDone = read ? false : true;
        // let writeDone = write ? false : true;

        // if (read) {
        //     reads.push(async () => {
        //         await read();
        //         readDone = true;
        //         if (readDone && writeDone) resolve();
        //     });
        // }

        // if (write) {
        //     writes.push(async () => {
        //         await write();
        //         writeDone = true;
        //         if (readDone && writeDone) resolve();
        //     });
        // }

        schedule();
    });

    // this.reads.push(read);
    // this.writes.push(write);
    // return this.schedule();
};

export default Object.freeze({
    reads,
    writes,
    setup,
    tick,
    schedule,
    flush,
    remove,
    clear,
    batch
});


const reads = [];
const writes = [];

let max = 16;
let pending = false;

const setup = function (data: any = {}) {
    max ?? data.max;
};

const tick = function (method: (time: number) => void) {
    return new Promise((resolve: any, reject: any) => {
        window.requestAnimationFrame(async time => {
            await method(time);
            resolve();
        });
    });
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

const batch = function (read, write) {
    if (!read && !write) throw new Error('read or write required');

    return new Promise((resolve: any, reject: any) => {

        if (read) {
            reads.push(async () => {
                await read();
                if (write) {
                    writes.push(async () => {
                        await write();
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        } else if (write) {
            writes.push(async () => {
                await write();
                resolve();
            });
        }

        if (!pending) {
            pending = true;
            tick(flush);
        }
    });
};

export default Object.freeze({
    reads,
    writes,
    setup,
    tick,
    flush,
    remove,
    clear,
    batch
});


export default class Batcher {

    #reads = [];
    #writes = [];

    #max = 16;
    #pending = false;

    constructor (data: any = {}) {
        this.#max ?? data.max;
    }

    // remove (tasks, task) {
    //     const index = tasks.indexOf(task);
    //     return !!~index && !!tasks.splice(index, 1);
    // }

    // clear (task) {
    //     return this.remove(this.#reads, task) || this.remove(this.#writes, task);
    // }

    tick (method: (time: number) => void) {
        return new Promise((resolve: any, reject: any) => {
            window.requestAnimationFrame(async time => {
                await method.call(this, time);
                resolve();
            });
        });
    };

    async flush (time: number) {
        const tasks = [];

        let read;
        while (read = this.#reads.shift()) {
            tasks.push(read());
            if ((performance.now() - time) > this.#max) return this.tick(this.flush);
        }
        await Promise.all(tasks);

        let write;
        while (write = this.#writes.shift()) {
            tasks.push(write());
            if ((performance.now() - time) > this.#max) return this.tick(this.flush);
        }
        await Promise.all(tasks);

        if (this.#reads.length === 0 && this.#writes.length === 0) {
            this.#pending = false;
        } else if ((performance.now() - time) > this.#max) {
            return this.tick(this.flush);
        } else {
            return this.flush(time);
        }

    }

    batch (read, write) {
        if (!read && !write) throw new Error('read or write required');

        return new Promise((resolve: any, reject: any) => {

            if (read) {
                this.#reads.push(async () => {
                    await read();
                    if (write) {
                        this.#writes.push(async () => {
                            await write();
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            } else if (write) {
                this.#writes.push(async () => {
                    await write();
                    resolve();
                });
            }

            if (!this.#pending) {
                this.#pending = true;
                this.tick(this.flush);
            }
        });
    }

}

// export default Object.freeze({
//     reads,
//     writes,
//     setup,
//     tick,
//     flush,
//     remove,
//     clear,
//     batch
// });

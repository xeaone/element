type Task = () => void | Promise<void>;

const ScheduleCache = new WeakMap();
const ScheduleNext = Promise.resolve();

export default async function schedule(target: Element, task: Task) {
    let cache = ScheduleCache.get(target);

    if (!cache) {
        cache = { resolves: [] };
        ScheduleCache.set(target, cache);
    }

    if (cache.busy) {
        cache.task = task;

        await new Promise(function ScheduleResolve(resolve) {
            cache.resolves.push(resolve);
        });

        return;
    }

    if (cache.frame) {
        cancelAnimationFrame(cache.frame);
    }

    cache.task = task;

    cache.frame = requestAnimationFrame(function ScheduleFrame() {
        const task = cache.task;
        const resolves = cache.resolves;

        cache.busy = true;
        cache.task = undefined;

        ScheduleNext.then(task).then(function (): any {
            if (cache.task) {
                return schedule(target, cache.task);
            } else {
                return Promise.all(resolves.map(function ScheduleMap(resolve: any) {
                    return resolve();
                }));
            }
        }).then(function () {
            cache.resolves = [];
            cache.busy = false;
            cache.task = undefined;
            cache.frame = undefined;
        });
    });

    await new Promise(function ScheduleResolve(resolve) {
        cache.resolves.push(resolve);
    });
}

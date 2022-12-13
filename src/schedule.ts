type Task = () => void | Promise<void>;

const ScheduleCache = new WeakMap();
const ScheduleNext = Promise.resolve();

export default async function schedule(target: Element, task: Task) {
    let cache = ScheduleCache.get(target);

    if (!cache) {
        cache = { resolves: [] };
        ScheduleCache.set(target, cache);
    }

    if (cache.current) {
        clearTimeout(cache.timer);
        cache.task = task;
    } else {
        cache.task = task;
    }

    cache.current = new Promise((resolve) => {
        cache.resolves.push(resolve);
        cache.timer = setTimeout(function ScheduleTime() {
            let r;
            const rs = cache.resolves;
            const u = cache.task;
            cache.current = undefined;
            cache.task = undefined;
            cache.timer = undefined;
            cache.resolves = [];
            ScheduleNext.then(u).then(function ScheduleResolves() {
                for (r of rs) r();
            });
        }, 100);
    });

    await cache.current;
}

import { Update } from './types.ts';

const ScheduleCache = new WeakMap();
const ScheduleNext = Promise.resolve();

export default async function Schedule(target: Element, update: Update) {
    let cache = ScheduleCache.get(target);

    if (!cache) {
        cache = { resolves: [] };
        ScheduleCache.set(target, cache);
    }

    if (cache.current) {
        clearTimeout(cache.timer);
        cache.update = update;
    } else {
        cache.update = update;
    }

    cache.current = new Promise((resolve) => {
        cache.resolves.push(resolve);
        cache.timer = setTimeout(function ScheduleTime() {
            let r;
            const rs = cache.resolves;
            const u = cache.update;
            cache.current = undefined;
            cache.update = undefined;
            cache.timer = undefined;
            cache.resolves = [];
            ScheduleNext.then(u).then(function ScheduleResolves() {
                for (r of rs) r();
            });
        }, 100);
    });

    await cache.current;
}

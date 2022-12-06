import { Update } from './types.ts';

const caches = new WeakMap();
const tick = Promise.resolve();

const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

export default async function Schedule(update: Update, target: Element) {
    let cache = caches.get(target);

    if (!cache) {
        cache = {};
        caches.set(target, cache);
    }

    if (cache.current) {
        cache.next = update;
    } else {
        cache.current = tick.then(async function () {
            // await sleep(100);
            if (cache.next) await cache.next();
            else await update();
            if (cache.next) await cache.next();
            cache.next = undefined;
            cache.current = undefined;
        });
    }

    await cache.current;
}

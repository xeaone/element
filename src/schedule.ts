import { Update } from './types.ts';

const caches = new WeakMap();
const tick = Promise.resolve();

const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

export default async function Schedule(target: Element, update: Update) {
    let cache = caches.get(target);

    if (!cache) {
        cache = {};
        caches.set(target, cache);
    }

    // if (cache.current) {
    //     cache.next = update;
    // } else {
    //     cache.current = tick.then(async function () {
    //         // await sleep(100);
    //         if (cache.next) await cache.next();
    //         else await update();
    //         if (cache.next) await cache.next();
    //         cache.next = undefined;
    //         cache.current = undefined;
    //     });
    // }

    if (cache.current) {
        clearTimeout(cache.timer);
        cache.update = update;
    } else {
        cache.update = update;
    }

    cache.current = new Promise((resolve) => {
        cache.resolves.push(resolve);
        cache.timer = setTimeout(async () => {
            await cache.update();
            cache.current = undefined;
            cache.update = undefined;
            cache.timer = undefined;
            const resolves = cache.resolves;
            cache.resolves = [];
            console.log(resolves);
            resolves.forEach((r: any) => r());
        }, 100);
    });

    await cache.current;
}

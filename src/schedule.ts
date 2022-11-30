import { Update } from './types.ts';

const tick = Promise.resolve();
const updates: Array<Update> = [];

let patching: number;

const frame = async function () {
    const tasks = [];
    while (updates.length) tasks.push(updates.shift()?.());
    await Promise.all(tasks);
    patching = 0;
};

export default function Schedule(update: Update, target: Element) {
    if (!Reflect.has(target, 'x')) {
        Reflect.set(target, 'x', {});
    }

    const x = Reflect.get(target, 'x');

    // x.patching = x.patching ?? false;
    // x.patches = x.patches ?? [];

    if (x.current) {
        x.next = update;
    } else {
        // x.patching = true;
        x.current = tick.then(update).then(function () {
            const next = x.next;
            x.next = undefined;
            x.current = undefined;
            if (next) {
                // x.patching = false;
                Schedule(next, target);
            }
        });
    }

    // if (updates.includes(update)) return;
    // console.log(update);
    // updates.push(update);
    // if (patching) return;
    // patching = 1;
    // await tick.then(frame);
}

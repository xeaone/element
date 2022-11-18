import { Update } from './types.ts';

const tick = Promise.resolve();
const updates: Array<Update> = [];

let patching: number;

// const frame = function () {
//     while (updates.length) updates.shift()?.();
//     patching = 0;
// };

const frame = async function () {
    const tasks = [];
    while (updates.length) tasks.push(updates.shift()?.());
    await Promise.all(tasks);
    patching = 0;
};

export default async function Schedule(update: Update) {
    updates.push(update);
    if (patching) return;
    patching = 1;
    await tick.then(frame);
}
